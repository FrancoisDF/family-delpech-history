#!/usr/bin/env node
/**
 * Precompute simple TF-IDF embeddings (dense) for static/family-data.json
 * Usage: node scripts/precompute-embeddings.mjs
 * Output: static/family-embeddings.json and static/family-vocab.json
 */
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.resolve(process.cwd(), 'static', 'family-data.json');
const OUT_EMB = path.resolve(process.cwd(), 'static', 'family-embeddings.json');
const OUT_VOCAB = path.resolve(process.cwd(), 'static', 'family-vocab.json');

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[\p{P}$+<=>^`|~]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function clamp(n) {
  return Math.max(-1e9, Math.min(1e9, n));
}

function normalize(array) {
  const norm = Math.sqrt(array.reduce((s, v) => s + v * v, 0)) || 1;
  return array.map((v) => v / norm);
}

async function main() {
  if (!fs.existsSync(DATA_PATH)) {
    console.error('Missing family-data.json. Run scripts/ingest-builder-content.mjs first.');
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const docs = raw.map((d) => ({ id: d.id, text: d.text }));
  const N = docs.length;

  // Build document frequencies
  const df = new Map();
  const docTokens = [];

  for (const d of docs) {
    const tokens = tokenize(d.text);
    docTokens.push(tokens);
    const seen = new Set(tokens);
    for (const t of seen) df.set(t, (df.get(t) || 0) + 1);
  }

  // Vocabulary: take all tokens sorted by df descending (limit to 5000)
  const vocab = Array.from(df.entries()).sort((a, b) => b[1] - a[1]).map((x) => x[0]).slice(0, 5000);
  const tokenToIndex = Object.fromEntries(vocab.map((t, i) => [t, i]));

  // Compute idf
  const idf = vocab.map((t) => Math.log((N + 1) / (1 + (df.get(t) || 0))) + 1);

  // Compute TF-IDF vectors
  const embeddings = [];
  for (let i = 0; i < docs.length; i++) {
    const tokens = docTokens[i];
    const vec = new Array(vocab.length).fill(0);
    const counts = {};
    for (const t of tokens) {
      if (tokenToIndex[t] !== undefined) counts[t] = (counts[t] || 0) + 1;
    }
    const L = tokens.length || 1;
    for (const [t, c] of Object.entries(counts)) {
      const idx = tokenToIndex[t];
      if (idx === undefined) continue;
      const tf = c / L;
      vec[idx] = clamp(tf * idf[idx]);
    }
    const normed = normalize(vec);
    embeddings.push({ id: docs[i].id, vector: normed });
  }

  // Write outputs
  fs.writeFileSync(OUT_EMB, JSON.stringify(embeddings), 'utf8');
  fs.writeFileSync(OUT_VOCAB, JSON.stringify({ vocab, idf }), 'utf8');

  console.log(`Wrote ${embeddings.length} embeddings to ${OUT_EMB} and vocab to ${OUT_VOCAB}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
