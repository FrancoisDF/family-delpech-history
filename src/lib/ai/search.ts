import type { FamilyChunk } from './data';
import { loadFamilyData } from './data';
import { computeQueryEmbedding, loadEmbeddings, findTopKByEmbedding } from './embeddings';

export interface BookSummary {
  id: string;
  title: string;
  summary: string;
  sourceType: string;
  url: string;
  originalChunkCount: number;
  metadata: {
    author?: string;
    year?: string;
    category?: string;
    tags?: string[];
  };
}

let _summariesCache: BookSummary[] | null = null;

export async function loadBookSummaries(
  fetchFn?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
): Promise<BookSummary[]> {
  if (_summariesCache) return _summariesCache;
  try {
    const fetchToUse = fetchFn || fetch;
    const res = await fetchToUse('/book-summaries.json');
    if (!res.ok) throw new Error('Failed to load book-summaries.json');
    const data = (await res.json()) as BookSummary[];
    _summariesCache = data;
    return data;
  } catch (err) {
    console.warn('Unable to load book summaries:', err);
    return [];
  }
}

export function clearBookSummariesCache() {
  _summariesCache = null;
}

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

function scoreSummaryByQuery(summary: BookSummary, qTokens: string[]) {
  const text = (summary.summary + ' ' + summary.title).toLowerCase();
  const tokens = tokenize(summary.summary + ' ' + summary.title);

  let matches = 0;
  for (const t of qTokens) {
    const freq = tokens.filter((x) => x === t).length;
    if (freq > 0) matches += Math.min(freq, 3);
  }

  // Boost if query tokens appear in the title
  const title = summary.title.toLowerCase();
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

export type SummarySearchResult = {
  summary: BookSummary;
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

/**
 * Search book summaries for relevant sections
 * This is the primary search method in Phase 1 (token-efficient RAG)
 */
export async function searchSummaries(query: string, opts?: { topK?: number; threshold?: number }) {
  const topK = opts?.topK ?? 5;
  const threshold = opts?.threshold ?? 0.05; // slightly lower threshold for summaries

  if (!query || !query.trim()) return [];

  const qTokens = tokenize(query);
  if (qTokens.length === 0) return [];

  // Try embedding-based search first (if available)
  const qVec = await computeSummaryQueryEmbedding(query);
  if (qVec) {
    try {
      const emb = await loadSummaryEmbeddings();
      if (emb && emb.length > 0) {
        const summaries = await loadBookSummaries();
        const summaryMap = new Map(summaries.map((s) => [s.id, s]));

        // Score all summaries
        const scored: SummarySearchResult[] = [];
        for (const embedding of emb) {
          const summary = summaryMap.get(embedding.id);
          if (!summary) continue;

          const score = dotProductForSummary(qVec, embedding.vector);
          if (score >= (opts?.threshold ?? 0.03)) {
            scored.push({ summary, score });
          }
        }

        return scored
          .sort((a, b) => b.score - a.score)
          .slice(0, topK);
      }
    } catch (err) {
      console.warn('Summary embeddings search failed, falling back to token search', err);
    }
  }

  // Fallback to lexical search
  const summaries = await loadBookSummaries();
  if (!summaries || summaries.length === 0) return [];

  const scored: SummarySearchResult[] = summaries
    .map((s) => ({ summary: s, score: scoreSummaryByQuery(s, qTokens) }))
    .filter((s) => s.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored;
}

// ============================================================================
// Summary Embeddings Support
// ============================================================================

interface SummaryEmbedding {
  id: string;
  vector: Float32Array;
}

let summaryEmbeddingsCache: SummaryEmbedding[] | null = null;
let summaryVocabCache: { vocab: string[]; idf: number[] } | null = null;
let summaryVocabIndexCache: Record<string, number> | null = null;

export async function loadSummaryEmbeddings(): Promise<SummaryEmbedding[] | null> {
  if (summaryEmbeddingsCache) return summaryEmbeddingsCache;
  try {
    const res = await fetch('/summary-embeddings.json');
    if (!res.ok) throw new Error('no summary embeddings');
    const rawData = (await res.json()) as { id: string; vector: number[] }[];

    summaryEmbeddingsCache = rawData.map((item) => ({
      id: item.id,
      vector: new Float32Array(item.vector)
    }));

    return summaryEmbeddingsCache;
  } catch (err) {
    console.warn('Failed to load summary embeddings:', err);
    return null;
  }
}

export async function loadSummaryVocab() {
  if (summaryVocabCache) return summaryVocabCache;
  try {
    const res = await fetch('/summary-vocab.json');
    if (!res.ok) throw new Error('no summary vocab');
    summaryVocabCache = (await res.json()) as { vocab: string[]; idf: number[] };

    summaryVocabIndexCache = Object.create(null);
    for (let i = 0; i < summaryVocabCache.vocab.length; i++) {
      summaryVocabIndexCache![summaryVocabCache.vocab[i]] = i;
    }

    return summaryVocabCache;
  } catch (err) {
    console.warn('Failed to load summary vocab:', err);
    return null;
  }
}

/**
 * Compute query embedding using summary vocabulary
 */
export async function computeSummaryQueryEmbedding(query: string): Promise<Float32Array | null> {
  const vocabObj = await loadSummaryVocab();
  if (!vocabObj || !summaryVocabIndexCache) return null;

  const tokens = tokenize(query);
  const counts: Record<number, number> = {};
  for (const t of tokens) {
    const idx = summaryVocabIndexCache[t];
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

  return normalizeSummaryVector(vec);
}

function normalizeSummaryVector(array: Float32Array) {
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

function dotProductForSummary(a: Float32Array, b: Float32Array) {
  let s = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    s += a[i] * b[i];
  }
  return s;
}
