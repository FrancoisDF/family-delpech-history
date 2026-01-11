#!/usr/bin/env node
/**
 * Ingest Builder.io content and write chunked JSON to static/family-data.json
 * Usage: PUBLIC_BUILDER_API_KEY=your_key node scripts/ingest-builder-content.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

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

function extractTextFromEntry(entry) {
  // Heuristic: gather only readable text, avoid JSON serialization
  const pieces = [];

  if (entry.name) pieces.push(String(entry.name));

  if (entry.data && typeof entry.data === 'object') {
    const d = entry.data;

    // Extract readable text fields only
    if (d.title) pieces.push(String(d.title));
    if (d.heading) pieces.push(String(d.heading));
    if (d.subtitle) pieces.push(String(d.subtitle));
    if (d.description) pieces.push(String(d.description));

    // Extract text from blocks recursively (not JSON)
    if (Array.isArray(d.blocks)) {
      for (const block of d.blocks) {
        if (block.text) pieces.push(String(block.text));
        if (block.children && Array.isArray(block.children)) {
          for (const child of block.children) {
            if (typeof child === 'string') {
              pieces.push(child);
            } else if (child.text) {
              pieces.push(String(child.text));
            }
          }
        }
      }
    }

    // Add author and date if available (but not as prefixed labels)
    if (d.author && typeof d.author === 'string' && !pieces.some(p => p.includes(d.author))) {
      pieces.push(d.author);
    }
  }

  return pieces.join('\n\n');
}

function getEntryUrl(entry, model) {
  // Extract URL from various possible locations
  if (entry.data?.slug) return entry.data.slug;
  if (entry.data?.handle) return entry.data.handle;
  if (entry.data?.url) return entry.data.url;
  if (entry.data?.path) return entry.data.path;
  // Fallback: generate URL from ID and model
  const id = entry.id || entry.data?.id || Math.random().toString(36).slice(2, 9);
  return `/${model}/${id}`;
}

function chunkText(text, size = 800, overlap = 200) {
  const chunks = [];
  let pos = 0;
  while (pos < text.length) {
    const chunk = text.slice(pos, pos + size).trim();
    if (chunk.length) chunks.push(chunk);
    pos += size - overlap;
  }
  return chunks;
}

async function main() {
  console.log('Fetching Builder.io content — this will read your PUBLIC_BUILDER_API_KEY from the environment.');

  // Models used in this site for stories / blog articles
  const models = ['blog-articles'];

  const out = [];

  for (const model of models) {
    const entries = await fetchModel(model, 200);
    console.log(`Fetched ${entries.length} items for model '${model}'`);

    for (const entry of entries) {
      const id = entry.id || entry.data?.id || `${model}-${Math.random().toString(36).slice(2, 9)}`;
      const title = entry.data?.title || entry.name || `${model} ${id}`;
      const url = getEntryUrl(entry, model);

      // Ensure URL is absolute for Builder content
      const absoluteUrl = url.startsWith('http') ? url : url.startsWith('/') ? url : `/${url}`;

      const text = extractTextFromEntry(entry);

      if (!text || text.length < 10) continue;

      const chunks = chunkText(text, 900, 250);

      for (let i = 0; i < chunks.length; i++) {
        out.push({
          id: `${id}::${i}`,
          sourceId: id,
          sourceModel: model,
          title: title,
          url: absoluteUrl,
          index: i,
          text: chunks[i],
          length: chunks[i].length,
          isBuilderContent: true
        });
      }
    }
  }

  // Write file
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
  console.log(`Wrote ${out.length} chunks to ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
