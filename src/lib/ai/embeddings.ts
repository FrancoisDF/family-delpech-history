import type { FamilyChunk } from './data';
import { loadFamilyData } from './data';

let embeddingsCache: { id: string; vector: number[] }[] | null = null;
let vocabCache: { vocab: string[]; idf: number[] } | null = null;

export async function loadEmbeddings() {
  if (embeddingsCache) return embeddingsCache;
  try {
    const res = await fetch('/family-embeddings.json');
    if (!res.ok) throw new Error('no embeddings');
    embeddingsCache = (await res.json()) as { id: string; vector: number[] }[];
    return embeddingsCache;
  } catch (err) {
    return null;
  }
}

export async function loadVocab() {
  if (vocabCache) return vocabCache;
  try {
    const res = await fetch('/family-vocab.json');
    if (!res.ok) throw new Error('no vocab');
    vocabCache = (await res.json()) as { vocab: string[]; idf: number[] };
    return vocabCache;
  } catch (err) {
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

function normalize(array: number[]) {
  const norm = Math.sqrt(array.reduce((s, v) => s + v * v, 0)) || 1;
  return array.map((v) => v / norm);
}

export async function computeQueryEmbedding(query: string) {
  // Returns a normalized vector matching the vocab length or null
  const vocabObj = await loadVocab();
  if (!vocabObj) return null;
  const { vocab, idf } = vocabObj;
  const index = Object.create(null) as Record<string, number>;
  for (let i = 0; i < vocab.length; i++) index[vocab[i]] = i;

  const tokens = tokenize(query);
  const counts: Record<number, number> = {};
  for (const t of tokens) {
    const idx = index[t];
    if (idx === undefined) continue;
    counts[idx] = (counts[idx] || 0) + 1;
  }

  if (Object.keys(counts).length === 0) return null;

  const vec = new Array(vocab.length).fill(0);
  const L = tokens.length || 1;
  for (const [k, v] of Object.entries(counts)) {
    const idx = Number(k);
    vec[idx] = (v / L) * (idf[idx] || 1);
  }

  return normalize(vec);
}

export function cosine(a: number[], b: number[]) {
  let s = 0;
  for (let i = 0; i < a.length && i < b.length; i++) s += a[i] * b[i];
  return s;
}

export async function findTopKByEmbedding(queryVector: number[], topK = 5) {
  const embeddings = await loadEmbeddings();
  const data = await loadFamilyData();
  if (!embeddings || embeddings.length === 0) return [];

  // Build map from id->chunk
  const map = new Map<string, FamilyChunk>();
  for (const c of data) map.set(c.id, c);

  const scored: { chunk: FamilyChunk; score: number }[] = [];
  for (const e of embeddings) {
    if (!e.vector || e.vector.length !== queryVector.length) continue;
    const score = cosine(queryVector, e.vector);
    const chunk = map.get(e.id);
    if (chunk) scored.push({ chunk, score });
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
}
