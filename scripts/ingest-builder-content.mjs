#!/usr/bin/env node
/**
 * Ingest Builder.io content and write chunked JSON to static/family-data.json
 * Usage: PUBLIC_BUILDER_API_KEY=your_key node scripts/ingest-builder-content.mjs
 */
import fs from 'fs';
import path from 'path';
import { fetchEntries } from '@builder.io/sdk';

const OUT = path.resolve(process.cwd(), 'static', 'family-data.json');

if (!process.env.PUBLIC_BUILDER_API_KEY) {
  console.error('Please set PUBLIC_BUILDER_API_KEY in your environment and rerun.');
  process.exit(1);
}

async function fetchModel(model, limit = 100) {
  try {
    const results = await fetchEntries({ model, apiKey: process.env.PUBLIC_BUILDER_API_KEY, limit });
    return results || [];
  } catch (err) {
    console.error('Error fetching model', model, err);
    return [];
  }
}

function extractTextFromEntry(entry) {
  // Heuristic: gather strings from title, description and any nested data blocks
  const pieces = [];

  if (entry.name) pieces.push(String(entry.name));
  if (entry.data && typeof entry.data === 'object') {
    // Pull common fields
    const d = entry.data;
    if (d.title) pieces.push(String(d.title));
    if (d.heading) pieces.push(String(d.heading));
    if (d.subtitle) pieces.push(String(d.subtitle));
    if (d.description) pieces.push(String(d.description));
    // Walk blocks recursively
    if (Array.isArray(d.blocks)) {
      for (const b of d.blocks) {
        pieces.push(JSON.stringify(b));
      }
    }
    // Fallback - stringify object
    pieces.push(JSON.stringify(d));
  }

  return pieces.join('\n\n');
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
  const models = ['stories', 'blog-articles'];

  const out = [];

  for (const model of models) {
    const entries = await fetchModel(model, 200);
    console.log(`Fetched ${entries.length} items for model '${model}'`);

    for (const entry of entries) {
      const id = entry.id || entry.data?.id || `${model}-${Math.random().toString(36).slice(2, 9)}`;
      const title = entry.data?.title || entry.name || `${model} ${id}`;
      const url = entry.data?.slug || entry.data?.handle || `/`;

      const text = extractTextFromEntry(entry);

      if (!text || text.length < 10) continue;

      const chunks = chunkText(text, 900, 250);

      for (let i = 0; i < chunks.length; i++) {
        out.push({
          id: `${id}::${i}`,
          sourceId: id,
          sourceModel: model,
          title: title,
          url: url,
          index: i,
          text: chunks[i],
          length: chunks[i].length
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
