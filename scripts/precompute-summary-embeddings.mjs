#!/usr/bin/env node
/**
 * Precompute TF-IDF embeddings for book summaries
 * Enables fast semantic search without vector DB
 *
 * Usage: node scripts/precompute-summary-embeddings.mjs
 * Input: static/book-summaries.json
 * Output: static/summary-embeddings.json and static/summary-vocab.json
 */

import fs from 'fs';
import path from 'path';

const SUMMARIES_PATH = path.resolve(process.cwd(), 'static', 'book-summaries.json');
const OUT_EMB = path.resolve(process.cwd(), 'static', 'summary-embeddings.json');
const OUT_VOCAB = path.resolve(process.cwd(), 'static', 'summary-vocab.json');

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
  if (!fs.existsSync(SUMMARIES_PATH)) {
    console.error('❌ Missing book-summaries.json. Run scripts/generate-book-summaries.mjs first.');
    process.exit(1);
  }

  console.log('📚 Loading summaries...');
  const raw = JSON.parse(fs.readFileSync(SUMMARIES_PATH, 'utf8'));
  const docs = raw.map((d) => ({ id: d.id, text: d.summary }));
  const N = docs.length;

  console.log(`✓ Loaded ${N} summaries`);

  // Build document frequencies
  const df = new Map();
  const docTokens = [];

  console.log('📊 Computing TF-IDF...');
  for (const d of docs) {
    const tokens = tokenize(d.text);
    docTokens.push(tokens);
    const seen = new Set(tokens);
    for (const t of seen) df.set(t, (df.get(t) || 0) + 1);
  }

  console.log(`✓ Built vocabulary of ${df.size} unique terms`);

  // Compute IDF
  const idf = new Map();
  for (const [t, count] of df.entries()) {
    idf.set(t, Math.log((N + 1) / (count + 1)) + 1);
  }

  // Build sparse vectors
  const embeddings = [];
  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    const tokens = docTokens[i];
    const L = tokens.length || 1;

    // Build a dense vector: term → (TF * IDF)
    const termCounts = new Map();
    for (const t of tokens) {
      termCounts.set(t, (termCounts.get(t) || 0) + 1);
    }

    // Collect vocabulary
    if (!df.has('__VOCAB__')) df.set('__VOCAB__', 0);
  }

  // Create final vocabulary
  const vocabList = Array.from(df.keys()).filter((t) => t !== '__VOCAB__');
  const vocabIndex = Object.create(null);
  for (let i = 0; i < vocabList.length; i++) {
    vocabIndex[vocabList[i]] = i;
  }

  console.log(`✓ Created vocabulary with ${vocabList.length} terms`);

  // Create dense embeddings
  console.log('📝 Creating dense embedding vectors...');
  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    const tokens = docTokens[i];
    const L = tokens.length || 1;

    // TF-IDF vector (dense)
    const vec = new Array(vocabList.length).fill(0);
    const termCounts = new Map();
    for (const t of tokens) {
      termCounts.set(t, (termCounts.get(t) || 0) + 1);
    }

    for (const [term, count] of termCounts.entries()) {
      const idx = vocabIndex[term];
      if (idx !== undefined) {
        const tf = count / L;
        const idfVal = idf.get(term) || 1;
        vec[idx] = clamp(tf * idfVal);
      }
    }

    // Normalize
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
    const normalized = vec.map((v) => v / norm);

    embeddings.push({
      id: doc.id,
      vector: normalized
    });
  }

  console.log(`✓ Created ${embeddings.length} embedding vectors`);

  // Save embeddings
  fs.writeFileSync(OUT_EMB, JSON.stringify(embeddings, null, 2));
  console.log(`✅ Embeddings saved to ${OUT_EMB}`);

  // Save vocabulary with IDF
  const vocabOutput = {
    vocab: vocabList,
    idf: vocabList.map((t) => idf.get(t) || 1)
  };

  fs.writeFileSync(OUT_VOCAB, JSON.stringify(vocabOutput, null, 2));
  console.log(`✅ Vocabulary saved to ${OUT_VOCAB}`);
  console.log(`   ${vocabList.length} unique terms with IDF scores`);

  console.log('\n📈 Summary Embedding Generation Complete!');
  console.log(`   - ${embeddings.length} summaries embedded`);
  console.log(`   - ${vocabList.length} unique terms`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
