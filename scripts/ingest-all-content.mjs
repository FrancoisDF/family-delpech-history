#!/usr/bin/env node
/**
 * Unified ingestion script that combines local documents AND Builder.io content
 * Usage: PUBLIC_BUILDER_API_KEY=your_key node scripts/ingest-all-content.mjs
 * 
 * This script:
 * 1. Ingests all local documents (markdown, PDF, Word)
 * 2. Fetches content from Builder.io (if API key is available)
 * 3. Merges everything into a single family-data.json file
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import yaml from 'js-yaml';
import mammoth from 'mammoth';

// Create require for CommonJS modules
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

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

// ============================================================================
// Builder.io Integration
// ============================================================================

async function fetchFromBuilder() {
  if (!process.env.PUBLIC_BUILDER_API_KEY) {
    log('PUBLIC_BUILDER_API_KEY not set — skipping Builder.io content', 'warn');
    return [];
  }

  try {
    const { fetchEntries } = await import('@builder.io/sdk-svelte');

    log('Fetching content from Builder.io...');
    const models = ['stories', 'blog-articles'];
    const allChunks = [];

    for (const model of models) {
      try {
        const entries = await fetchEntries({
          model,
          apiKey: process.env.PUBLIC_BUILDER_API_KEY,
          limit: 200
        });

        log(`Fetched ${entries.length} items from Builder model '${model}'`);

        for (const entry of entries) {
          const chunks = processBuilderEntry(entry, model);
          allChunks.push(...chunks);
        }
      } catch (err) {
        log(`Error fetching Builder model '${model}': ${err.message}`, 'warn');
      }
    }

    return allChunks;
  } catch (err) {
    log(`Failed to initialize Builder.io SDK: ${err.message}`, 'warn');
    return [];
  }
}

function processBuilderEntry(entry, model) {
  const id = entry.id || entry.data?.id || `${model}-${Math.random().toString(36).slice(2, 9)}`;
  const title = entry.data?.title || entry.name || `${model} ${id}`;
  const url = getBuilderEntryUrl(entry, model);
  const text = extractTextFromBuilderEntry(entry);

  if (!text || text.length < 10) {
    return [];
  }

  const chunks = chunkText(text, config.chunkSize, config.chunkOverlap);
  const output = [];

  for (let i = 0; i < chunks.length; i++) {
    output.push({
      id: `${id}::${i}`,
      sourceId: id,
      sourceModel: model,
      title,
      url,
      index: i,
      text: chunks[i],
      length: chunks[i].length,
      isBuilderContent: true
    });
  }

  return output;
}

function getBuilderEntryUrl(entry, model) {
  if (entry.data?.slug) return entry.data.slug;
  if (entry.data?.handle) return entry.data.handle;
  if (entry.data?.url) return entry.data.url;
  if (entry.data?.path) return entry.data.path;
  const id = entry.id || entry.data?.id || Math.random().toString(36).slice(2, 9);
  return `/${model}/${id}`;
}

function extractTextFromBuilderEntry(entry) {
  const pieces = [];

  if (entry.name) pieces.push(String(entry.name));
  if (entry.data && typeof entry.data === 'object') {
    const d = entry.data;
    if (d.title) pieces.push(String(d.title));
    if (d.heading) pieces.push(String(d.heading));
    if (d.subtitle) pieces.push(String(d.subtitle));
    if (d.description) pieces.push(String(d.description));
    if (d.author) pieces.push(`Author: ${d.author}`);
    if (d.date) pieces.push(`Date: ${d.date}`);
    if (Array.isArray(d.blocks)) {
      for (const b of d.blocks) {
        pieces.push(JSON.stringify(b));
      }
    }
    pieces.push(JSON.stringify(d));
  }

  return pieces.join('\n\n');
}

// ============================================================================
// Local Document Processing
// ============================================================================

function walkDirectory(dirPath, fileList = [], dirsSeen = new Set()) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (config.excludeDirs.includes(entry.name)) continue;

      const fullPath = path.join(dirPath, entry.name);

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

function extractMetadataFromPath(filePath) {
  const relativePath = path.relative(config.sourceDir, filePath);
  const parts = relativePath.split(path.sep);
  const filename = parts[parts.length - 1];
  const category = parts.length > 2 ? parts[parts.length - 2] : parts[0];
  const year = parts[0];

  return { year, category, filename, relativePath };
}

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

async function extractPdfContent(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(fileBuffer);
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

function chunkText(text, size = 900, overlap = 250) {
  const chunks = [];
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);

  let currentChunk = '';

  for (const para of paragraphs) {
    const trimmedPara = para.trim();

    if (
      currentChunk.length > 0 &&
      currentChunk.length + trimmedPara.length + 2 > size
    ) {
      if (currentChunk.trim().length >= config.minChunkLength) {
        chunks.push(currentChunk.trim());
      }

      const overlapStart = Math.max(0, currentChunk.length - overlap);
      currentChunk = currentChunk.substring(overlapStart);
    }

    if (currentChunk.length > 0) {
      currentChunk += '\n\n';
    }
    currentChunk += trimmedPara;
  }

  if (currentChunk.trim().length >= config.minChunkLength) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

async function processFile(filePath) {
  const pathMetadata = extractMetadataFromPath(filePath);
  const { text, metadata: frontmatterMetadata, success } = await extractContent(filePath);

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

async function processLocalDocuments() {
  if (!fs.existsSync(config.sourceDir)) {
    log(`Source directory does not exist: ${config.sourceDir}`, 'warn');
    return [];
  }

  log('Scanning for local document files...');
  const files = walkDirectory(config.sourceDir);

  if (files.length === 0) {
    log(`No document files found in ${config.sourceDir}`, 'warn');
    return [];
  }

  log(`Found ${files.length} document file(s)`, 'success');

  log('Processing local documents...');
  let totalChunks = 0;
  const allChunks = [];

  for (const filePath of files) {
    const relPath = path.relative(config.sourceDir, filePath);
    process.stdout.write(`  Processing: ${relPath}... `);

    try {
      const chunks = await processFile(filePath);
      allChunks.push(...chunks);
      totalChunks += chunks.length;
      process.stdout.write(`${chunks.length} chunks\n`);
    } catch (err) {
      process.stdout.write(`ERROR\n`);
      log(`  Error processing ${relPath}: ${err.message}`, 'error');
    }
  }

  log(`Generated ${totalChunks} chunks from local documents`, 'success');
  return allChunks;
}

// ============================================================================
// Merge & Validate
// ============================================================================

function deduplicateChunks(chunks) {
  const seen = new Set();
  const unique = [];

  for (const chunk of chunks) {
    const key = chunk.text.substring(0, 100);

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(chunk);
    }
  }

  return unique;
}

function validateChunks(chunks) {
  const required = ['id', 'title', 'text', 'length'];
  const invalid = chunks.filter(
    (c) => !required.every((field) => field in c && c[field])
  );

  if (invalid.length > 0) {
    log(`Found ${invalid.length} invalid chunks (missing required fields)`, 'warn');
  }

  return chunks.filter((c) => required.every((field) => field in c && c[field]));
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  log('====================================================');
  log('Unified Content Ingestion Pipeline');
  log('====================================================');
  log(`Source directory: ${config.sourceDir}`);
  log(`Output file: ${config.outputPath}`);
  log('');

  // Process local documents
  const localChunks = await processLocalDocuments();
  log('');

  // Process Builder content
  const builderChunks = await fetchFromBuilder();
  log('');

  // Merge all chunks
  log('Merging all content...');
  const allChunks = [...localChunks, ...builderChunks];
  log(`Total chunks before processing: ${allChunks.length}`);

  // Validate and deduplicate
  log('Validating chunks...');
  let validated = validateChunks(allChunks);
  log(`Valid chunks: ${validated.length}/${allChunks.length}`);

  log('Deduplicating chunks...');
  const deduped = deduplicateChunks(validated);
  log(`Unique chunks: ${deduped.length}/${validated.length}`);
  log('');

  // Write output
  log('Writing output file...');
  const outputDir = path.dirname(config.outputPath);

  try {
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(config.outputPath, JSON.stringify(deduped, null, 2), 'utf8');
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
  log(`Local documents: ${localChunks.length} chunks`);
  log(`Builder content: ${builderChunks.length} chunks`);
  log(`Final output: ${deduped.length} unique chunks`);
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
