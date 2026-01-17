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
import 'dotenv/config';
import { fetchEntries } from '@builder.io/sdk-svelte';

// Create require for CommonJS modules
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_BUILDER_API_KEY = process.env.PUBLIC_BUILDER_API_KEY || '6c20c92cc5704aba88edd4187fbfd8f0';
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

import { createHash } from 'crypto';

const DOCUMENT_EXTENSIONS = new Set(['.pdf', '.docx', '.md', '.txt']);
const DOCUMENT_MIME_PREFIXES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown'];

function toKebabCase(str) {
  return String(str || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function stripHtml(html) {
  const text = String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  return text.replace(/\s+/g, ' ').trim();
}

function markdownToText(md) {
  const s = String(md || '');
  // keep link labels, drop URLs
  const noLinks = s.replace(/\[(.*?)\]\((.*?)\)/g, '$1');
  const noFormatting = noLinks
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '');

  return noFormatting.replace(/\s+/g, ' ').trim();
}

function normalizeReadableText(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';

  // Heuristic: if it looks like HTML, strip tags. Otherwise treat as markdown-like.
  if (/<[a-z][\s\S]*>/i.test(s)) return stripHtml(s);
  return markdownToText(s);
}

function resolveFileUrl(fileField) {
  if (!fileField) return '';
  if (typeof fileField === 'string') return fileField;
  if (typeof fileField === 'object') {
    if (typeof fileField.url === 'string') return fileField.url;
    if (fileField.file && typeof fileField.file.url === 'string') return fileField.file.url;
    if (typeof fileField.path === 'string') return fileField.path;
  }
  return '';
}

function isProbablyDocumentUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (!/^https?:\/\//i.test(url)) return false;

  try {
    const u = new URL(url);
    const ext = path.extname(u.pathname).toLowerCase();
    return DOCUMENT_EXTENSIONS.has(ext);
  } catch {
    return false;
  }
}

function extractLinksFromText(raw) {
  const s = String(raw || '');
  const out = [];

  // markdown-style links
  for (const match of s.matchAll(/\[(.*?)\]\((.*?)\)/g)) {
    const label = match[1];
    const url = match[2];
    if (isProbablyDocumentUrl(url)) out.push({ url, label });
  }

  // html anchors
  for (const match of s.matchAll(/href=["']([^"']+)["']/g)) {
    const url = match[1];
    if (isProbablyDocumentUrl(url)) out.push({ url, label: undefined });
  }

  return out;
}

function collectTextDeep(value, pieces, visited, parentKey = '') {
  if (value == null) return;

  const nonTextKeys = new Set([
    'url',
    'href',
    'src',
    'file',
    'pdfFile',
    'featuredImage',
    'image',
    'imageUrl',
    'backgroundImage',
    'buttonLink',
    'link',
    'videoUrl',
    'path'
  ]);

  if (typeof value === 'string') {
    const t = normalizeReadableText(value);
    if (t && t.length > 2) pieces.push(t);
    return;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) collectTextDeep(item, pieces, visited, parentKey);
    return;
  }

  if (typeof value === 'object') {
    if (visited.has(value)) return;
    visited.add(value);

    for (const [k, v] of Object.entries(value)) {
      if (nonTextKeys.has(k)) continue;
      collectTextDeep(v, pieces, visited, k);
    }
  }
}

function extractBuilderPostText(entry) {
  const pieces = [];
  const visited = new Set();

  if (entry?.name) pieces.push(normalizeReadableText(entry.name));

  const d = entry?.data && typeof entry.data === 'object' ? entry.data : null;
  if (!d) return pieces.filter(Boolean).join('\n\n');

  // Common article fields
  const headerFields = ['title', 'excerpt', 'description', 'heading', 'subtitle', 'author', 'date', 'readTime', 'category'];
  for (const f of headerFields) {
    if (typeof d[f] === 'string' && d[f].trim()) {
      pieces.push(normalizeReadableText(d[f]));
    }
  }

  // Blocks: try to collect readable text fields deeply (but skip file/url fields)
  if (Array.isArray(d.blocks)) {
    for (const b of d.blocks) {
      collectTextDeep(b, pieces, visited);

      // Also capture inline document links from block text-ish fields
      for (const candidate of [b?.text, b?.content]) {
        if (typeof candidate === 'string') {
          for (const link of extractLinksFromText(candidate)) {
            // keep label + url in a separate step; we only gather text here
          }
        }
      }
    }
  }

  // As a last resort, collect text deep from the data object itself (still skipping URLs/files)
  collectTextDeep(d, pieces, visited);

  const joined = pieces
    .map((p) => String(p || '').trim())
    .filter(Boolean)
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return joined;
}

function ensureInternalPostHandle(entryId, title, handleCandidate) {
  const handle = String(handleCandidate || '').trim();

  // If Builder already stores a handle that starts with the id (e.g. "<id>-slug"), keep it.
  if (handle && (handle === entryId || handle.startsWith(`${entryId}-`))) return handle;

  const slug = toKebabCase(title || '');
  return slug ? `${entryId}-${slug}` : entryId;
}

function getBuilderEntryInternalUrl(entry, model, entryId, title) {
  const d = entry?.data || {};
  if (model === 'blog-articles') {
    const handle = ensureInternalPostHandle(entryId, title, d.handle || d.slug);
    return `/histoires/${handle}`;
  }
  return `/${model}/${entryId}`;
}

async function fetchFromBuilder() {
  if (!PUBLIC_BUILDER_API_KEY) {
    log('PUBLIC_BUILDER_API_KEY not set — skipping Builder.io content', 'warn');
    return [];
  }

  try {

    log('Fetching content from Builder.io...');
    const models = ['blog-articles'];
    const allChunks = [];

    for (const model of models) {
      try {
        const entries = await fetchEntries({
          model,
          apiKey: PUBLIC_BUILDER_API_KEY,
          limit: 200
        });

        log(`Fetched ${entries.length} items from Builder model '${model}'`);

        for (const entry of entries) {
          const chunks = await processBuilderEntry(entry, model);
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

const downloadCache = new Map();
const downloadInFlight = new Map();

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;

  const workers = new Array(Math.max(1, limit)).fill(0).map(async () => {
    while (i < items.length) {
      const idx = i++;
      try {
        results[idx] = await fn(items[idx], idx);
      } catch (err) {
        results[idx] = null;
      }
    }
  });

  await Promise.all(workers);
  return results;
}

function guessFileTypeFromUrl(url, contentType) {
  try {
    const u = new URL(url);
    const ext = path.extname(u.pathname).toLowerCase();
    if (DOCUMENT_EXTENSIONS.has(ext)) return ext;
  } catch {
    // ignore
  }

  const ct = String(contentType || '').toLowerCase();
  if (ct.includes('pdf')) return '.pdf';
  if (ct.includes('wordprocessingml.document')) return '.docx';
  if (ct.includes('markdown')) return '.md';
  if (ct.startsWith('text/')) return '.txt';
  return '';
}

function fileNameFromUrl(url) {
  try {
    const u = new URL(url);
    const base = path.basename(u.pathname);
    return base || 'document';
  } catch {
    return 'document';
  }
}

async function downloadAndExtractDocument(url) {
  if (downloadCache.has(url)) return downloadCache.get(url);
  if (downloadInFlight.has(url)) return downloadInFlight.get(url);

  const promise = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);

    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const contentType = res.headers.get('content-type') || '';
      const ext = guessFileTypeFromUrl(url, contentType);
      const buffer = Buffer.from(await res.arrayBuffer());

      if (ext === '.pdf') {
        const data = await pdfParse(buffer);
        const text = String(data?.text || '').trim();
        return { text, fileName: fileNameFromUrl(url), fileType: 'pdf' };
      }

      if (ext === '.docx') {
        const result = await mammoth.extractRawText({ buffer });
        const text = String(result?.value || '').trim();
        return { text, fileName: fileNameFromUrl(url), fileType: 'docx' };
      }

      if (ext === '.md' || ext === '.txt') {
        const text = new TextDecoder('utf-8').decode(buffer).trim();
        return { text, fileName: fileNameFromUrl(url), fileType: ext === '.md' ? 'md' : 'txt' };
      }

      // If content-type is text/*, still try to decode
      if (String(contentType).toLowerCase().startsWith('text/')) {
        const text = new TextDecoder('utf-8').decode(buffer).trim();
        return { text, fileName: fileNameFromUrl(url), fileType: 'txt' };
      }

      return { text: '', fileName: fileNameFromUrl(url), fileType: 'unknown' };
    } finally {
      clearTimeout(timeout);
    }
  })();

  downloadInFlight.set(url, promise);

  try {
    const result = await promise;
    downloadCache.set(url, result);
    return result;
  } finally {
    downloadInFlight.delete(url);
  }
}

function extractDocumentRefsFromBuilderEntry(entry) {
  const refs = [];
  const seen = new Set();

  const d = entry?.data && typeof entry.data === 'object' ? entry.data : {};

  // Top-level PDF field
  const topPdf = resolveFileUrl(d.pdfFile);
  if (isProbablyDocumentUrl(topPdf) && !seen.has(topPdf)) {
    refs.push({ url: topPdf, label: d.title ? `${d.title} (PDF)` : undefined });
    seen.add(topPdf);
  }

  // Scan blocks for known shapes + inline links
  if (Array.isArray(d.blocks)) {
    for (const b of d.blocks) {
      // Known: PDFCarouselBlock style { pdfs: [{ title, pdfFile }] }
      if (Array.isArray(b?.pdfs)) {
        for (const item of b.pdfs) {
          const pdfUrl = resolveFileUrl(item?.pdfFile);
          if (isProbablyDocumentUrl(pdfUrl) && !seen.has(pdfUrl)) {
            refs.push({ url: pdfUrl, label: item?.title || item?.name });
            seen.add(pdfUrl);
          }
        }
      }

      // Known: AccordionBlock style { sections: [{ documents: [{ name, file }] }] }
      if (Array.isArray(b?.sections)) {
        for (const sec of b.sections) {
          if (!Array.isArray(sec?.documents)) continue;
          for (const doc of sec.documents) {
            const docUrl = resolveFileUrl(doc?.file);
            if (isProbablyDocumentUrl(docUrl) && !seen.has(docUrl)) {
              refs.push({ url: docUrl, label: doc?.name || doc?.title });
              seen.add(docUrl);
            }
          }
        }
      }

      // Inline links in rich text
      for (const candidate of [b?.text, b?.content]) {
        if (typeof candidate === 'string') {
          for (const link of extractLinksFromText(candidate)) {
            if (!seen.has(link.url)) {
              refs.push({ url: link.url, label: link.label });
              seen.add(link.url);
            }
          }
        }
      }

      // Generic deep scan for file-like keys
      const stack = [{ value: b, labelHint: undefined }];
      const visited = new Set();
      while (stack.length) {
        const { value } = stack.pop();
        if (!value || typeof value !== 'object') continue;
        if (visited.has(value)) continue;
        visited.add(value);

        if (Array.isArray(value)) {
          for (const v of value) stack.push({ value: v, labelHint: undefined });
          continue;
        }

        for (const [k, v] of Object.entries(value)) {
          if (k === 'pdfFile' || k === 'file') {
            const resolved = resolveFileUrl(v);
            if (isProbablyDocumentUrl(resolved) && !seen.has(resolved)) {
              const label = value?.title || value?.name || value?.label;
              refs.push({ url: resolved, label: typeof label === 'string' ? label : undefined });
              seen.add(resolved);
            }
          }
          if (typeof v === 'object' && v) stack.push({ value: v, labelHint: undefined });
        }
      }
    }
  }

  return refs;
}

async function processBuilderEntry(entry, model) {
  const id = entry?.id || entry?.data?.id || `${model}-${Math.random().toString(36).slice(2, 9)}`;
  const title = entry?.data?.title || entry?.name || `${model} ${id}`;
  const postUrl = getBuilderEntryInternalUrl(entry, model, id, title);

  const text = extractBuilderPostText(entry);
  if (!text || text.length < 10) {
    return [];
  }

  const postChunks = chunkText(text, config.chunkSize, config.chunkOverlap);
  const output = [];

  for (let i = 0; i < postChunks.length; i++) {
    output.push({
      id: `${id}::${i}`,
      sourceId: id,
      sourceModel: model,
      title,
      url: postUrl,
      index: i,
      text: postChunks[i],
      length: postChunks[i].length,
      isBuilderContent: true,
      sourceType: 'post',
      originPostId: id,
      originPostTitle: title,
      originPostUrl: postUrl,
      originPostModel: model
    });
  }

  const docRefs = extractDocumentRefsFromBuilderEntry(entry);
  if (!docRefs || docRefs.length === 0) {
    return output;
  }

  const extracted = await mapWithConcurrency(docRefs, 4, async (ref) => {
    try {
      const data = await downloadAndExtractDocument(ref.url);
      return { ref, data };
    } catch (err) {
      log(`Failed to download linked doc: ${ref.url} (${err.message || err})`, 'warn');
      return null;
    }
  });

  for (const item of extracted.filter(Boolean)) {
    const { ref, data } = item;
    const rawText = data?.text ? String(data.text) : '';
    if (!rawText || rawText.length < config.minChunkLength) continue;

    const docTitle = String(ref?.label || data?.fileName || fileNameFromUrl(ref.url)).replace(/\.[^.]+$/, '');
    const docSourceId = `${id}-${stableIdForUrl(ref.url)}`;

    const docChunks = chunkText(rawText, config.chunkSize, config.chunkOverlap);
    for (let i = 0; i < docChunks.length; i++) {
      output.push({
        id: `${docSourceId}::${i}`,
        sourceId: docSourceId,
        sourceModel: 'builder-attachments',
        title: docTitle,
        url: ref.url,
        index: i,
        text: docChunks[i],
        length: docChunks[i].length,
        sourceType: 'attachment',
        attachmentUrl: ref.url,
        attachmentFileName: data?.fileName,
        originPostId: id,
        originPostTitle: title,
        originPostUrl: postUrl,
        originPostModel: model
      });
    }
  }

  return output;
}

function stableIdForUrl(url) {
  try {
    const h = createHash('sha1').update(url).digest('hex').slice(0, 12);
    return h;
  } catch {
    return Math.random().toString(36).slice(2, 10);
  }
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
