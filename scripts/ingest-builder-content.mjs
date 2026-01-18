#!/usr/bin/env node
/**
 * Ingest Builder.io content and write chunked JSON to static/family-data.json
 * Usage: PUBLIC_BUILDER_API_KEY=your_key node scripts/ingest-builder-content.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createHash } from 'crypto';
import { createRequire } from 'module';
import mammoth from 'mammoth';
import {
	getHeaderFieldNames,
	getComponentConfig,
	extractDocumentRefsFromBlock,
	extractFieldsFromBlock,
	getBlockComponentName,
	getBlockData,
	getBlockLevelExtractionComponents
} from './lib/component-extraction-helpers.mjs';

// Create require for CommonJS modules
const require = createRequire(import.meta.url);
const pdfParseModule = require('pdf-parse');
const pdfParse = typeof pdfParseModule === 'function' ? pdfParseModule : pdfParseModule?.default;
if (typeof pdfParse !== 'function') {
	throw new TypeError(
		`pdf-parse did not export a function. Got: ${Object.prototype.toString.call(pdfParseModule)}`
	);
}

// Load .env file from project root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const OUT = path.resolve(process.cwd(), 'static', 'family-data.json');

const PUBLIC_BUILDER_API_KEY = process.env.PUBLIC_BUILDER_API_KEY;

if (!PUBLIC_BUILDER_API_KEY) {
  console.error('Error: PUBLIC_BUILDER_API_KEY environment variable is not set');
  process.exit(1);
}

const DOCUMENT_EXTENSIONS = new Set(['.pdf', '.docx', '.md', '.txt']);

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
  if (/<[a-z][\s\S]*>/i.test(s)) return stripHtml(s);
  return markdownToText(s);
}

function resolveFileUrl(fileField) {
  if (!fileField) return '';

  const normalize = (url) => {
    const s = String(url || '').trim();
    if (!s) return '';
    if (s.startsWith('//')) return `https:${s}`;
    if (s.startsWith('/')) return `https://cdn.builder.io${s}`;
    return s;
  };

  if (typeof fileField === 'string') return normalize(fileField);
  if (typeof fileField === 'object') {
    if (typeof fileField.url === 'string') return normalize(fileField.url);
    if (fileField.file && typeof fileField.file.url === 'string') return normalize(fileField.file.url);
    if (typeof fileField.path === 'string') return normalize(fileField.path);
  }
  return '';
}

function isProbablyDocumentUrl(url) {
  if (!url || typeof url !== 'string') return false;

  // Accept Builder's own relative file URLs too
  if (url.startsWith('/')) return url.includes('/file/') || url.includes('/api/v1/file/');

  if (!/^https?:\/\//i.test(url)) return false;

  try {
    const u = new URL(url);
    const ext = path.extname(u.pathname).toLowerCase();
    if (DOCUMENT_EXTENSIONS.has(ext)) return true;

    // Builder file endpoints often don't carry the extension in the pathname
    if (u.hostname.endsWith('builder.io') && u.pathname.includes('/file/')) return true;

    return false;
  } catch {
    return false;
  }
}

function extractLinksFromText(raw) {
  const s = String(raw || '');
  const out = [];

  for (const match of s.matchAll(/\[(.*?)\]\((.*?)\)/g)) {
    const label = match[1];
    const url = match[2];
    if (isProbablyDocumentUrl(url)) out.push({ url, label });
  }

  for (const match of s.matchAll(/href=["']([^"']+)["']/g)) {
    const url = match[1];
    if (isProbablyDocumentUrl(url)) out.push({ url, label: undefined });
  }

  return out;
}

function collectTextDeep(value, pieces, visited) {
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

  if (typeof value === 'number' || typeof value === 'boolean') return;

  if (Array.isArray(value)) {
    for (const item of value) collectTextDeep(item, pieces, visited);
    return;
  }

  if (typeof value === 'object') {
    if (visited.has(value)) return;
    visited.add(value);

    for (const [k, v] of Object.entries(value)) {
      if (nonTextKeys.has(k)) continue;
      collectTextDeep(v, pieces, visited);
    }
  }
}

function extractBuilderPostText(entry) {
  const pieces = [];
  const visited = new Set();

  if (entry?.name) pieces.push(normalizeReadableText(entry.name));

  const d = entry?.data && typeof entry.data === 'object' ? entry.data : null;
  if (!d) return pieces.filter(Boolean).join('\n\n');

  // Use configuration-driven header field extraction
  const headerFields = getHeaderFieldNames();
  for (const f of headerFields) {
    if (typeof d[f] === 'string' && d[f].trim()) {
      pieces.push(normalizeReadableText(d[f]));
    }
  }

  if (Array.isArray(d.blocks)) {
    for (const b of d.blocks) {
      collectTextDeep(b, pieces, visited);
    }
  }

  collectTextDeep(d, pieces, visited);

  return pieces
    .map((p) => String(p || '').trim())
    .filter(Boolean)
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function ensureInternalPostHandle(entryId, title, handleCandidate) {
  const handle = String(handleCandidate || '').trim();
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

function stableIdForUrl(url) {
  try {
    return createHash('sha1').update(url).digest('hex').slice(0, 12);
  } catch {
    return Math.random().toString(36).slice(2, 10);
  }
}

function fileNameFromUrl(url) {
  try {
    const u = new URL(url);
    return path.basename(u.pathname) || 'document';
  } catch {
    return 'document';
  }
}

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;

  const workers = new Array(Math.max(1, limit)).fill(0).map(async () => {
    while (i < items.length) {
      const idx = i++;
      try {
        results[idx] = await fn(items[idx], idx);
      } catch {
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

async function downloadAndExtractDocument(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

    const contentType = res.headers.get('content-type') || '';
    const buffer = Buffer.from(await res.arrayBuffer());
    const ext = guessFileTypeFromUrl(url, contentType);

    if (ext === '.pdf') {
      const data = await pdfParse(buffer);
      return { text: String(data?.text || '').trim(), fileName: fileNameFromUrl(url) };
    }

    if (ext === '.docx') {
      const result = await mammoth.extractRawText({ buffer });
      return { text: String(result?.value || '').trim(), fileName: fileNameFromUrl(url) };
    }

    if (ext === '.md' || ext === '.txt') {
      return {
        text: new TextDecoder('utf-8').decode(buffer).trim(),
        fileName: fileNameFromUrl(url)
      };
    }

    // If content-type is text/*, still try to decode
    if (String(contentType).toLowerCase().startsWith('text/')) {
      return {
        text: new TextDecoder('utf-8').decode(buffer).trim(),
        fileName: fileNameFromUrl(url)
      };
    }

    return { text: '', fileName: fileNameFromUrl(url) };
  } finally {
    clearTimeout(timeout);
  }
}

function extractDocumentRefsFromBuilderEntry(entry) {
  const refs = [];
  const seen = new Set();

  const d = entry?.data && typeof entry.data === 'object' ? entry.data : {};

  // Extract top-level PDF if present
  const topPdf = resolveFileUrl(d.pdfFile);
  if (isProbablyDocumentUrl(topPdf) && !seen.has(topPdf)) {
    refs.push({ url: topPdf, label: d.title ? `${d.title} (PDF)` : undefined });
    seen.add(topPdf);
  }

  // Extract documents from blocks using component configuration
  if (Array.isArray(d.blocks)) {
    for (const b of d.blocks) {
      const componentName = getBlockComponentName(b);
      const config = componentName ? getComponentConfig(componentName) : null;
      const blockData = getBlockData(b);

      // Configuration-driven extraction for known components
      if (config && blockData) {
        const blockRefs = extractDocumentRefsFromBlock(b, config);
        for (const ref of blockRefs) {
          if (!seen.has(ref.url)) {
            refs.push(ref);
            seen.add(ref.url);
          }
        }
      }

      // Fallback: extract from text/content fields for inline document links
      for (const candidate of [blockData?.text, blockData?.content]) {
        if (typeof candidate === 'string') {
          for (const link of extractLinksFromText(candidate)) {
            if (!seen.has(link.url)) {
              refs.push({ url: link.url, label: link.label });
              seen.add(link.url);
            }
          }
        }
      }

      // Deep scan for any remaining file/pdfFile references (catches edge cases)
      const stack = [b];
      const visited = new Set();
      while (stack.length) {
        const value = stack.pop();
        if (!value || typeof value !== 'object') continue;
        if (visited.has(value)) continue;
        visited.add(value);

        if (Array.isArray(value)) {
          for (const v of value) stack.push(v);
          continue;
        }

        for (const [k, v] of Object.entries(value)) {
          if ((k === 'pdfFile' || k === 'file') && !refs.some((r) => r.url === resolveFileUrl(v))) {
            const resolved = resolveFileUrl(v);
            if (isProbablyDocumentUrl(resolved) && !seen.has(resolved)) {
              const label = value?.title || value?.name || value?.label;
              refs.push({ url: resolved, label: typeof label === 'string' ? label : undefined });
              seen.add(resolved);
            }
          }
          if (v && typeof v === 'object') stack.push(v);
        }
      }
    }
  }

  return refs;
}

function chunkText(text, size = 900, overlap = 250, minChunkLength = 50) {
  const chunks = [];
  const paragraphs = String(text || '')
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  let currentChunk = '';

  for (const para of paragraphs) {
    if (currentChunk.length > 0 && currentChunk.length + para.length + 2 > size) {
      if (currentChunk.trim().length >= minChunkLength) {
        chunks.push(currentChunk.trim());
      }
      const overlapStart = Math.max(0, currentChunk.length - overlap);
      currentChunk = currentChunk.substring(overlapStart);
    }

    if (currentChunk.length > 0) currentChunk += '\n\n';
    currentChunk += para;
  }

  if (currentChunk.trim().length >= minChunkLength) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

async function fetchModel(model, limit = 100) {
  try {
    const url = new URL(`https://cdn.builder.io/api/v3/content/${model}`);
    url.searchParams.set('apiKey', PUBLIC_BUILDER_API_KEY);
    url.searchParams.set('limit', limit.toString());

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (err) {
    console.error('Error fetching model', model, err.message);
    return [];
  }
}

async function main() {
  console.log('Fetching Builder.io content — this will read your PUBLIC_BUILDER_API_KEY from the environment.');

  const models = ['blog-articles'];
  const out = [];

  for (const model of models) {
    const entries = await fetchModel(model, 200);
    console.log(`Fetched ${entries.length} items for model '${model}'`);

    for (const entry of entries) {
      const id = entry?.id || entry?.data?.id || `${model}-${Math.random().toString(36).slice(2, 9)}`;
      const title = entry?.data?.title || entry?.name || `${model} ${id}`;
      const postUrl = getBuilderEntryInternalUrl(entry, model, id, title);

      const text = extractBuilderPostText(entry);
      if (!text || text.length < 10) continue;

      const postChunks = chunkText(text, 900, 250, 50);
      for (let i = 0; i < postChunks.length; i++) {
        out.push({
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
      if (docRefs.length > 0) {
        const extracted = await mapWithConcurrency(docRefs, 4, async (ref) => {
          try {
            const data = await downloadAndExtractDocument(ref.url);
            return { ref, data };
          } catch (err) {
            console.warn(`Failed to download linked doc: ${ref.url}`, err.message || err);
            return null;
          }
        });

        for (const item of extracted.filter(Boolean)) {
          const { ref, data } = item;
          const rawText = data?.text ? String(data.text) : '';
          if (!rawText || rawText.length < 50) continue;

          const docTitle = String(ref?.label || data?.fileName || fileNameFromUrl(ref.url)).replace(/\.[^.]+$/, '');
          const docSourceId = `${id}-${stableIdForUrl(ref.url)}`;

          const docChunks = chunkText(rawText, 900, 250, 50);
          for (let i = 0; i < docChunks.length; i++) {
            out.push({
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
      }
    }
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
  console.log(`Wrote ${out.length} chunks to ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
