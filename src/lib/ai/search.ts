import type { FamilyChunk } from './data';
import { loadFamilyData } from './data';
import { computeQueryEmbedding, loadEmbeddings, findTopKByEmbedding } from './embeddings';

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[\p{P}$+<=>^`|~]/gu, ' ') // remove punctuation
    .split(/\s+/)
    .filter(Boolean);
}

function scoreChunkByQuery(chunk: FamilyChunk, qTokens: string[]) {
  const text = chunk.text.toLowerCase();
  const tokens = tokenize(chunk.text);

  let matches = 0;
  for (const t of qTokens) {
    // presence weighted by frequency
    const freq = tokens.filter((x) => x === t).length;
    if (freq > 0) matches += Math.min(freq, 3); // cap
  }

  // Boost if query tokens appear in the title
  const title = chunk.title?.toLowerCase() || '';
  let titleBoost = 0;
  for (const t of qTokens) {
    if (title.includes(t)) titleBoost += 2;
  }

  const norm = Math.sqrt(tokens.length) || 1;
  return (matches + titleBoost) / norm;
}

export type SearchResult = {
  chunk: FamilyChunk;
  score: number;
};

export async function searchFamilyData(query: string, opts?: { topK?: number; threshold?: number }) {
  const topK = opts?.topK ?? 5;
  const threshold = opts?.threshold ?? 0.08; // conservative by default

  if (!query || !query.trim()) return [];

  const qTokens = tokenize(query);
  if (qTokens.length === 0) return [];

  // Try using precomputed embeddings (TF-IDF vectors) if available
  const qVec = await computeQueryEmbedding(query);
  if (qVec) {
    try {
      const emb = await loadEmbeddings();
      if (emb && emb.length > 0) {
        const hits = await findTopKByEmbedding(qVec, topK);
        // Filter by a score threshold (conservative — since tfidf is scaled arbitrarily) => use score > 0.03
        return hits.filter((h) => h.score >= (opts?.threshold ?? 0.03)).map((h) => ({ chunk: h.chunk, score: h.score }));
      }
    } catch (err) {
      // fall back to lexical if embeddings fail
      console.warn('Embeddings search failed, falling back to token search', err);
    }
  }

  const data = await loadFamilyData();
  if (!data || data.length === 0) return [];

  const scored: SearchResult[] = data
    .map((c) => ({ chunk: c, score: scoreChunkByQuery(c, qTokens) }))
    .filter((s) => s.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored;
}
