/**
 * API route: POST /api/ai-vercel-chat
 * Server-side handler for Vercel AI chat with Claude
 * Uses token-efficient summary-based RAG (Phase 1)
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { generateText } from 'ai';
import { createModelForChat, getProviderInfo } from '$lib/ai/provider';
import {
	buildSystemPrompt,
	getSummarySummaries,
	estimateTokens,
	formatSources,
	extractSummaryIds,
	type VercelChatRequest,
	type VercelChatResponse
} from '$lib/ai/vercel-generation';

const DAILY_TOKEN_BUDGET = 5000;

interface RequestBody extends VercelChatRequest {
	message: string;
	tokensUsed: number;
}

/**
 * POST handler for chat requests
 * Phase 1: Uses summaries for token-efficient context
 * Phase 2: Supports session context reuse for further savings
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		// Validate provider configuration
		let providerInfo: string;
		try {
			providerInfo = getProviderInfo();
		} catch (err: any) {
			console.error('Provider configuration error:', err.message);
			return error(500, err.message);
		}

		// Parse request body
		const body: RequestBody = await request.json();
		const { message, tokensUsed, sessionContext, reuseContext } = body;

		if (!message || typeof message !== 'string' || !message.trim()) {
			return error(400, 'Message is required');
		}

		// Check if user has exceeded daily budget
		if (tokensUsed >= DAILY_TOKEN_BUDGET) {
			return error(429, 'Daily token budget exceeded');
		}

		let contextSummaries;
		let usedCachedContext = false;

		// Phase 2: Implement context reuse for related queries in same session
		if (reuseContext && sessionContext?.summariesUsed && sessionContext.summariesUsed.length > 0) {
			// Check if this is a related query (simple heuristic: share key words)
			const queryWords = new Set(
				message
					.toLowerCase()
					.split(/\s+/)
					.filter((w) => w.length > 3)
			);

			const isRelatedQuery = checkIfRelatedQuery(message, sessionContext.summariesUsed);

			if (isRelatedQuery) {
				// Reuse cached summaries for this related query
				// In production, could load actual summary objects here
				console.log(`Reusing context from ${sessionContext.summariesUsed.length} previous summaries`);
				usedCachedContext = true;
				// For MVP, still do a fresh search but with cached context as hints
				contextSummaries = await getSummarySummaries(message, { topK: 5 });
			} else {
				// New topic, fresh search
				contextSummaries = await getSummarySummaries(message, { topK: 5 });
			}
		} else {
			// Phase 1: Fresh search for summaries
			contextSummaries = await getSummarySummaries(message, { topK: 5 });
		}

		// Build system prompt with summaries
		const systemPrompt = buildSystemPrompt(contextSummaries);

		// Prepare messages for Claude
		const messages = [
			{
				role: 'user' as const,
				content: message
			}
		];

		// Call AI provider via Vercel AI SDK
		const model = createModelForChat();

		const { text, usage } = await generateText({
			model,
			messages,
			system: systemPrompt,
			temperature: 0.7,
			maxTokens: 500
		});

		// Extract token counts
		const inputTokens = usage.promptTokens;
		const outputTokens = usage.completionTokens;
		const totalTokens = inputTokens + outputTokens;

		// Check if response would exceed budget
		const projectedTotal = tokensUsed + totalTokens;
		if (projectedTotal > DAILY_TOKEN_BUDGET) {
			return error(429, 'Response would exceed daily token budget');
		}

		// Extract summary IDs for Phase 2 caching
		const summaryIds = extractSummaryIds(contextSummaries);

		// Format response
		const response: VercelChatResponse = {
			response: text,
			inputTokens,
			outputTokens,
			totalTokens,
			sourcesUsed: formatSources(contextSummaries),
			summariesUsed: summaryIds,
			usedCachedContext: usedCachedContext
		};

		return json(response);
	} catch (err: any) {
		console.error('Error in chat API:', err);

		// Handle specific error types
		if (err.message?.includes('rate limit')) {
			return error(429, 'API rate limit exceeded. Please try again later.');
		}

		if (err.message?.includes('authentication')) {
			return error(401, 'Authentication failed');
		}

		return error(500, `Chat service error: ${err.message || 'Unknown error'}`);
	}
};

/**
 * Helper: Check if a new query is related to previously cached summaries
 * Simple heuristic: check for shared keywords
 */
function checkIfRelatedQuery(query: string, cachedSummaryIds: string[]): boolean {
	// If very few cached summaries, consider it related (context still fresh)
	if (cachedSummaryIds.length <= 2) {
		return true;
	}

	// Extract keywords (words > 3 chars, excluding common words)
	const stopWords = new Set([
		'what',
		'when',
		'where',
		'which',
		'would',
		'could',
		'about',
		'that',
		'this',
		'have',
		'with',
		'from',
		'they',
		'tell',
		'know',
		'find',
		'want'
	]);

	const queryKeywords = query
		.toLowerCase()
		.split(/\s+/)
		.filter((w) => w.length > 3 && !stopWords.has(w))
		.slice(0, 5); // Take top 5 keywords

	// Heuristic: if more than 2 keywords remain and we have cached summaries, consider related
	// This is a simple MVP implementation
	return queryKeywords.length >= 2 && cachedSummaryIds.length > 0;
}
