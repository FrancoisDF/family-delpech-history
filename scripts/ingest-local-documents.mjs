#!/usr/bin/env node
/**
 * Ingest local family documents (markdown, PDF, Word docs) and write chunked JSON to static/family-data.json
 * Replaces Builder.io ingestion workflow with local file processing.
 *
 * Supports:
 * - Markdown files with YAML frontmatter metadata
 * - PDF files (searchable text)
 * - Word documents (.docx)
 *
 * Directory structure example:
 *   documents/
 *   ├── 1818/La_Chaumière.md
 *   ├── 1850s/Marie_Antoinette/biography.md
 *   └── 1900s/Voyage_Atlantique.pdf
 *
 * Usage:
 *   node scripts/ingest-local-documents.mjs
 *   node scripts/ingest-local-documents.mjs --config scripts/config.documents.json
 *   node scripts/ingest-local-documents.mjs --source ./my-documents --verbose
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';
import yaml from 'js-yaml';
import mammoth from 'mammoth';

// Create require for CommonJS modules
const require = createRequire(import.meta.url);
const pdfParseModule = require('pdf-parse');
const pdfParse = typeof pdfParseModule === 'function' ? pdfParseModule : pdfParseModule?.default;
if (typeof pdfParse !== 'function') {
	throw new TypeError(
		`pdf-parse did not export a function. Got: ${Object.prototype.toString.call(pdfParseModule)}`
	);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_CONFIG = {
  sourceDir: './documents',
  outputPath: './static/family-data.json',
  chunkSize: 900,
  chunkOverlap: 250,
  minChunkLength: 50,
  maxFilesPerCategory: 0, // 0 = no limit
  verboseLogging: true,
  fileTypes: ['.md', '.pdf', '.docx'],
  excludeDirs: ['node_modules', '.git', '.vscode']
};

let config = { ...DEFAULT_CONFIG };

// ============================================================================
// Utilities
// ============================================================================

function log(msg, level = 'info') {
  const timestamp = new Date().toISOString().substring(11, 19);
  const prefix = {
    info: `[${timestamp}] ℹ️ `,
    success: `[${timestamp}] ✅`,
    warn: `[${timestamp}] ⚠️ `,
    error: `[${timestamp}] ❌`
  }[level] || `[${timestamp}] `;
  console.log(prefix, msg);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    config: null,
    source: null,
    output: null,
    verbose: false
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--config' && args[i + 1]) {
      options.config = args[++i];
    } else if (args[i] === '--source' && args[i + 1]) {
      options.source = args[++i];
    } else if (args[i] === '--output' && args[i + 1]) {
      options.output = args[++i];
    } else if (args[i] === '--verbose') {
      options.verbose = true;
    }
  }

  return options;
}

function loadConfig(configPath) {
  try {
    const content = fs.readFileSync(configPath, 'utf8');
    const loaded = JSON.parse(content);
    return { ...config, ...loaded };
  } catch (err) {
    log(`Failed to load config file ${configPath}: ${err.message}`, 'warn');
    return config;
  }
}

// ============================================================================
// File Walking & Detection
// ============================================================================

function walkDirectory(dirPath, fileList = [], dirsSeen = new Set()) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      // Skip excluded directories
      if (config.excludeDirs.includes(entry.name)) {
        continue;
      }

      const fullPath = path.join(dirPath, entry.name);

      // Avoid infinite loops with symlinks
      if (entry.isDirectory()) {
        const realPath = fs.realpathSync(fullPath);
        if (dirsSeen.has(realPath)) continue;
        dirsSeen.add(realPath);

        walkDirectory(fullPath, fileList, dirsSeen);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (config.fileTypes.includes(ext)) {
          fileList.push(fullPath);
        }
      }
    }
  } catch (err) {
    log(`Error walking directory ${dirPath}: ${err.message}`, 'warn');
  }

  return fileList;
}

// ============================================================================
// Metadata Extraction
// ============================================================================

/**
 * Extract metadata from directory path and filename
 * Example: documents/1850s/Marie_Antoinette/biography.md
 * Returns: { year: '1850s', category: 'Marie_Antoinette', filename: 'biography.md' }
 */
function extractMetadataFromPath(filePath) {
  const relativePath = path.relative(config.sourceDir, filePath);
  const parts = relativePath.split(path.sep);
  const filename = parts[parts.length - 1];
  const category = parts.length > 2 ? parts[parts.length - 2] : parts[0];
  const year = parts[0];

  return {
    year,
    category,
    filename,
    relativePath
  };
}

/**
 * Parse YAML frontmatter from markdown content
 * Returns: { metadata: {...}, content: '...' }
 */
function parseYamlFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { metadata: {}, content };
  }

  try {
    const metadata = yaml.load(match[1]) || {};
    const body = match[2];
    return { metadata, content: body };
  } catch (err) {
    log(`Failed to parse frontmatter: ${err.message}`, 'warn');
    return { metadata: {}, content };
  }
}

// ============================================================================
// Content Extraction
// ============================================================================

/**
 * Extract and parse markdown file
 */
async function extractMarkdownContent(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { metadata, content: body } = parseYamlFrontmatter(content);

    return {
      text: body.trim(),
      metadata,
      success: true
    };
  } catch (err) {
    log(`Error reading markdown ${filePath}: ${err.message}`, 'warn');
    return { text: '', metadata: {}, success: false };
  }
}

/**
 * Extract text from PDF file
 */
async function extractPdfContent(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(fileBuffer);

    // pdf-parse extracts text from each page
    const text = data.text || '';

    return {
      text: text.trim(),
      metadata: { pages: data.numpages },
      success: true
    };
  } catch (err) {
    log(`Error reading PDF ${filePath}: ${err.message}`, 'warn');
    return { text: '', metadata: {}, success: false };
  }
}

/**
 * Extract text from Word document (.docx)
 */
async function extractDocContent(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer: fileBuffer });

    return {
      text: result.value.trim(),
      metadata: { warnings: result.messages.length },
      success: true
    };
  } catch (err) {
    log(`Error reading DOCX ${filePath}: ${err.message}`, 'warn');
    return { text: '', metadata: {}, success: false };
  }
}

/**
 * Dispatch to appropriate extractor based on file type
 */
async function extractContent(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.md') {
    return extractMarkdownContent(filePath);
  } else if (ext === '.pdf') {
    return extractPdfContent(filePath);
  } else if (ext === '.docx') {
    return extractDocContent(filePath);
  }

  return { text: '', metadata: {}, success: false };
}

// ============================================================================
// Semantic Chunking
// ============================================================================

/**
 * Split text into semantic chunks (respects paragraph boundaries)
 */
function chunkText(text, size = 900, overlap = 250) {
  const chunks = [];

  // Split by double newlines (paragraph breaks) first
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);

  let currentChunk = '';

  for (const para of paragraphs) {
    const trimmedPara = para.trim();

    // If adding this paragraph would exceed size, save current chunk and start new one
    if (
      currentChunk.length > 0 &&
      currentChunk.length + trimmedPara.length + 2 > size
    ) {
      if (currentChunk.trim().length >= config.minChunkLength) {
        chunks.push(currentChunk.trim());
      }

      // Create overlap by including part of previous chunk
      const overlapStart = Math.max(
        0,
        currentChunk.length - overlap
      );
      currentChunk = currentChunk.substring(overlapStart);
    }

    if (currentChunk.length > 0) {
      currentChunk += '\n\n';
    }
    currentChunk += trimmedPara;
  }

  // Add final chunk
  if (currentChunk.trim().length >= config.minChunkLength) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// ============================================================================
// Processing
// ============================================================================

/**
 * Process a single file and generate chunks
 */
async function processFile(filePath) {
  const pathMetadata = extractMetadataFromPath(filePath);
  const { text, metadata: frontmatterMetadata, success } = await extractContent(
    filePath
  );

  if (!success || !text) {
    return [];
  }

  const title =
    frontmatterMetadata.title ||
    pathMetadata.filename.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
  const author = frontmatterMetadata.author || 'Archives Familiales';
  const year = frontmatterMetadata.year || pathMetadata.year;
  const category =
    frontmatterMetadata.category || pathMetadata.category || 'General';

  const chunks = chunkText(text, config.chunkSize, config.chunkOverlap);
  const output = [];

  for (let i = 0; i < chunks.length; i++) {
    output.push({
      id: `${pathMetadata.filename}::${i}`,
      sourceId: pathMetadata.filename,
      sourceModel: 'documents',
      title,
      author,
      year,
      category,
      url: `/documents/${year}/${pathMetadata.filename}`,
      index: i,
      text: chunks[i],
      length: chunks[i].length,
      tags: frontmatterMetadata.tags || []
    });
  }

  return output;
}

/**
 * Remove duplicate chunks
 */
function deduplicateChunks(chunks) {
  const seen = new Set();
  const unique = [];

  for (const chunk of chunks) {
    // Use text as dedup key (allow minor differences)
    const key = chunk.text.substring(0, 100);

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(chunk);
    }
  }

  return unique;
}

/**
 * Validate chunk structure
 */
function validateChunks(chunks) {
  const required = ['id', 'title', 'text', 'length'];
  const invalid = chunks.filter(
    (c) => !required.every((field) => field in c && c[field])
  );

  if (invalid.length > 0) {
    log(
      `Found ${invalid.length} invalid chunks (missing required fields)`,
      'warn'
    );
  }

  return chunks.filter((c) => required.every((field) => field in c && c[field]));
}

// ============================================================================
// Main Processing Loop
// ============================================================================

async function main() {
  const args = parseArgs();

  // Load configuration from file if provided
  if (args.config) {
    config = loadConfig(args.config);
  }

  // Override with command-line args
  if (args.source) config.sourceDir = args.source;
  if (args.output) config.outputPath = args.output;
  if (args.verbose) config.verboseLogging = args.verbose;

  log('====================================================');
  log('Family Document Ingestion Pipeline');
  log('====================================================');
  log(`Source directory: ${config.sourceDir}`);
  log(`Output file: ${config.outputPath}`);
  log(`Chunk size: ${config.chunkSize} characters`);
  log(`Chunk overlap: ${config.chunkOverlap} characters`);
  log(`Verbose logging: ${config.verboseLogging}`);
  log('');

  // Verify source directory exists
  if (!fs.existsSync(config.sourceDir)) {
    log(
      `Source directory does not exist: ${config.sourceDir}`,
      'error'
    );
    process.exit(1);
  }

  // Walk directory and find all files
  log('Scanning for document files...');
  const files = walkDirectory(config.sourceDir);

  if (files.length === 0) {
    log(`No document files found in ${config.sourceDir}`, 'warn');
    log('Supported formats: .md, .pdf, .docx');
    process.exit(1);
  }

  log(`Found ${files.length} document file(s)`, 'success');
  log('');

  // Process each file
  log('Processing documents...');
  let totalChunks = 0;
  const allChunks = [];
  const stats = {
    files: [],
    totalFiles: files.length,
    totalChunks: 0,
    errors: []
  };

  for (const filePath of files) {
    const relPath = path.relative(config.sourceDir, filePath);
    process.stdout.write(`  Processing: ${relPath}... `);

    try {
      const chunks = await processFile(filePath);
      allChunks.push(...chunks);
      totalChunks += chunks.length;
      process.stdout.write(`${chunks.length} chunks\n`);

      stats.files.push({
        file: relPath,
        chunks: chunks.length,
        status: 'success'
      });
    } catch (err) {
      process.stdout.write(`ERROR\n`);
      log(`  Error processing ${relPath}: ${err.message}`, 'error');
      stats.errors.push({
        file: relPath,
        error: err.message
      });
    }
  }

  log(`\nTotal chunks generated: ${totalChunks}`, 'success');
  log('');

  // Validate and deduplicate
  log('Validating chunks...');
  let validated = validateChunks(allChunks);
  log(`Valid chunks: ${validated.length}/${totalChunks}`);

  log('Deduplicating chunks...');
  const deduped = deduplicateChunks(validated);
  log(`Unique chunks: ${deduped.length}/${validated.length}`);
  log('');

  // Write output
  log('Writing output file...');
  const outputDir = path.dirname(config.outputPath);

  try {
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(
      config.outputPath,
      JSON.stringify(deduped, null, 2),
      'utf8'
    );
    log(`Wrote ${deduped.length} chunks to ${config.outputPath}`, 'success');
  } catch (err) {
    log(`Failed to write output: ${err.message}`, 'error');
    process.exit(1);
  }

  // Summary
  log('');
  log('====================================================');
  log('Ingestion Complete', 'success');
  log('====================================================');
  log(`Files processed: ${stats.totalFiles}`);
  log(`Chunks generated: ${deduped.length}`);
  if (stats.errors.length > 0) {
    log(`Errors: ${stats.errors.length}`, 'warn');
    stats.errors.forEach((e) => {
      log(`  - ${e.file}: ${e.error}`, 'warn');
    });
  }
  log('');
  log('Next steps:');
  log('  1. Verify the output looks correct');
  log('  2. Run: npm run prepare:embeddings');
  log('  3. Test in chat interface: npm run dev');
  log('');
}

main().catch((err) => {
  log(err.message, 'error');
  log(err.stack);
  process.exit(1);
});
