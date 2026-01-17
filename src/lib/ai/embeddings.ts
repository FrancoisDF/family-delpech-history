import type { FamilyChunk } from './data';
import { loadFamilyData } from './data';

let embeddingsCache: { id: string; vector: Float32Array }[] | null = null;
let vocabCache: { vocab: string[]; idf: number[] } | null = null;
let vocabIndexCache: Record<string, number> | null = null;
let chunkMapCache: Map<string, FamilyChunk> | null = null;

export async function loadEmbeddings() {
  if (embeddingsCache) return embeddingsCache;
  try {
    const res = await fetch('/family-embeddings.json');
    if (!res.ok) throw new Error('no embeddings');
    const rawData = (await res.json()) as { id: string; vector: number[] }[];
    
    // Convert to Float32Array for better performance
    embeddingsCache = rawData.map(item => ({
      id: item.id,
      vector: new Float32Array(item.vector)
    }));
    
    return embeddingsCache;
  } catch (err) {
    console.warn('Failed to load embeddings:', err);
    return null;
  }
}

export async function loadVocab() {
  if (vocabCache) return vocabCache;
  try {
    const res = await fetch('/family-vocab.json');
    if (!res.ok) throw new Error('no vocab');
    vocabCache = (await res.json()) as { vocab: string[]; idf: number[] };
    
    // Build and cache the index for O(1) lookups
    vocabIndexCache = Object.create(null);
    for (let i = 0; i < vocabCache.vocab.length; i++) {
      vocabIndexCache![vocabCache.vocab[i]] = i;
    }
    
    return vocabCache;
  } catch (err) {
    console.warn('Failed to load vocab:', err);
    return null;
  }
}

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[\p{P}$+<=>^`|~]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function normalize(array: Float32Array) {
  let sumSq = 0;
  for (let i = 0; i < array.length; i++) {
    sumSq += array[i] * array[i];
  }
  const norm = Math.sqrt(sumSq) || 1;
  for (let i = 0; i < array.length; i++) {
    array[i] /= norm;
  }
  return array;
}

export async function computeQueryEmbedding(query: string) {
  // Returns a normalized vector matching the vocab length or null
  const vocabObj = await loadVocab();
  if (!vocabObj || !vocabIndexCache) return null;
  
  const tokens = tokenize(query);
  const counts: Record<number, number> = {};
  for (const t of tokens) {
    const idx = vocabIndexCache[t];
    if (idx === undefined) continue;
    counts[idx] = (counts[idx] || 0) + 1;
  }

  if (Object.keys(counts).length === 0) return null;

  const vec = new Float32Array(vocabObj.vocab.length);
  const L = tokens.length || 1;
  for (const [k, v] of Object.entries(counts)) {
    const idx = Number(k);
    vec[idx] = (v / L) * (vocabObj.idf[idx] || 1);
  }

  return normalize(vec);
}

export function dotProduct(a: Float32Array, b: Float32Array) {
  let s = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    s += a[i] * b[i];
  }
  return s;
}

export async function findTopKByEmbedding(queryVector: Float32Array, topK = 5) {
  const [embeddings, data] = await Promise.all([
    loadEmbeddings(),
    loadFamilyData()
  ]);
  
  if (!embeddings || embeddings.length === 0) return [];

  // Build/use cached map from id->chunk
  if (!chunkMapCache) {
    chunkMapCache = new Map<string, FamilyChunk>();
    for (const c of data) {
      chunkMapCache.set(c.id, c);
    }
  }

  const scored: { chunk: FamilyChunk; score: number }[] = [];
  for (let i = 0; i < embeddings.length; i++) {
    const e = embeddings[i];
    if (e.vector.length !== queryVector.length) continue;
    
    const score = dotProduct(queryVector, e.vector);
    const chunk = chunkMapCache.get(e.id);
    if (chunk) {
      scored.push({ chunk, score });
    }
  }

  // Sort and return top K
  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
}
