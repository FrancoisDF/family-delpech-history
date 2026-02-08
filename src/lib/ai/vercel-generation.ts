/**
 * Vercel AI integration for server-side Claude chat with Anthropic
 * Uses hierarchical summarization for token-efficient RAG
 */

import type { FamilyChunk } from './data';
import type { BookSummary } from './search';
import { searchFamilyData, searchSummaries } from './search';

export interface VercelChatRequest {
	message: string;
	tokensUsed: number;
	reuseContext?: boolean;
	sessionContext?: {
		summariesUsed?: string[];
		lastQueryTokens?: number;
	};
}

export interface VercelChatResponse {
	response: string;
	inputTokens: number;
	outputTokens: number;
	totalTokens: number;
	sourcesUsed: Array<{ title: string; sourceType: string }>;
	summariesUsed?: string[];
	usedCachedContext?: boolean;
}

/**
 * Estimate tokens for a message using rough heuristic (1 token ≈ 4 characters)
 */
export function estimateTokens(text: string): number {
	return Math.ceil(text.length / 4);
}

/**
 * Build system prompt with context from family document summaries
 * Uses summaries for token efficiency (Phase 1 optimization)
 */
export function buildSystemPrompt(contextSummaries: BookSummary[]): string {
	const maxContextTokens = 500; // Reduced from 2000 for token efficiency
	let contextText = '';
	let tokenCount = 0;

	// Include top summaries up to token limit
	for (const summary of contextSummaries) {
		const summaryTokens = estimateTokens(summary.summary);
		if (tokenCount + summaryTokens > maxContextTokens) break;

		const sourceInfo = summary.title ? `[${summary.title}]` : '[Archive familiale]';
		const summaryText = `${sourceInfo}\n${summary.summary}\n`;
		contextText += summaryText;
		tokenCount += summaryTokens;
	}

	const prompt = `You are a helpful assistant that answers questions ONLY based on the provided context about family history and genealogy.

IMPORTANT RULES:
1. Only use information from the summaries below to answer.
2. If a question cannot be answered from the context, politely say: "Je n'ai pas cette information dans mes documents."
3. Do NOT use external knowledge or make up information.
4. Keep responses concise (2-3 sentences in French when appropriate).
5. Cite source documents when relevant.
6. Maintain a warm, nostalgic, and kind tone when discussing family history.

CONTEXT FROM FAMILY DOCUMENTS (Summaries):
${contextText || 'No relevant documents found.'}

Answer the user's question based ONLY on the above summaries. If the information is not in the summaries, clearly state that.`;

	return prompt;
}

/**
 * Get relevant context summaries for a query
 * This is the primary context retrieval in Phase 1 (token-efficient RAG)
 */
export async function getSummarySummaries(query: string, opts?: { topK?: number }): Promise<BookSummary[]> {
	try {
		const results = await searchSummaries(query, { topK: opts?.topK ?? 5 });
		return results.map((r) => r.summary);
	} catch (err) {
		console.error('Failed to search summaries:', err);
		return [];
	}
}

/**
 * Get relevant context chunks for a query (legacy - for fallback)
 */
export async function getContextChunks(query: string): Promise<FamilyChunk[]> {
	try {
		const results = await searchFamilyData(query, { topK: 5 });
		return results.map((r) => r.chunk);
	} catch (err) {
		console.error('Failed to search family data:', err);
		return [];
	}
}

/**
 * Format sources for response (works with both chunks and summaries)
 */
export function formatSources(
	summaries: BookSummary[]
): Array<{ title: string; sourceType: string }> {
	return summaries
		.slice(0, 2) // Limit to 2 sources
		.map((summary) => ({
			title: summary.title || 'Unknown Source',
			sourceType: summary.sourceType || 'document'
		}))
		.filter((source) => source.title !== 'Unknown Source');
}

/**
 * Extract summary IDs for caching
 */
export function extractSummaryIds(summaries: BookSummary[]): string[] {
	return summaries.map((s) => s.id);
}
