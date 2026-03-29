/**
 * API route: POST /api/ai-vercel-chat
 * Server-side handler for Vercel AI chat with Claude
 * Uses document-first retrieval with blog post enrichment
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { generateText } from 'ai';
import { createModelForChat, getProviderInfo } from '$lib/ai/provider';
import {
	buildSystemPrompt,
	formatSources,
	extractSummaryIds,
	type VercelChatRequest,
	type VercelChatResponse,
	type LinkedBlogRef
} from '$lib/ai/vercel-generation';
import {
	searchDocumentsWithBlogLinks,
	formatAsContextSummaries
} from '$lib/server/vector-search';

const DAILY_TOKEN_BUDGET = 5000;

interface RequestBody extends VercelChatRequest {
	message: string;
	tokensUsed: number;
}

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

		const body: RequestBody = await request.json();
		const { message, tokensUsed, sessionContext, reuseContext } = body;

		if (!message || typeof message !== 'string' || !message.trim()) {
			return error(400, 'Message is required');
		}

		if (tokensUsed >= DAILY_TOKEN_BUDGET) {
			return error(429, 'Daily token budget exceeded');
		}

		// Document-first retrieval: search documents, then resolve linked blog posts
		const { documentResults, linkedBlogPosts } = await searchDocumentsWithBlogLinks(message, {
			topK: 5,
			threshold: 0.3
		});

		const contextSummaries = formatAsContextSummaries(documentResults);

		// Map linked blog posts to the format expected by the prompt builder
		const blogRefs: LinkedBlogRef[] = linkedBlogPosts.map((bp) => ({
			id: bp.builder_blog_id,
			title: bp.builder_blog_title || 'Article lié',
			url: bp.builder_blog_url || ''
		}));

		// Build system prompt with documents as ground truth + blog links as enrichment
		const systemPrompt = buildSystemPrompt(contextSummaries, blogRefs);

		const messages = [
			{
				role: 'user' as const,
				content: message
			}
		];

		const model = createModelForChat();

		const { text, usage } = await generateText({
			model,
			messages,
			system: systemPrompt,
			temperature: 0.7,
			maxTokens: 1000
		});

		const inputTokens = usage.promptTokens;
		const outputTokens = usage.completionTokens;
		const totalTokens = inputTokens + outputTokens;

		const projectedTotal = tokensUsed + totalTokens;
		if (projectedTotal > DAILY_TOKEN_BUDGET) {
			return error(429, 'Response would exceed daily token budget');
		}

		const summaryIds = extractSummaryIds(contextSummaries);

		const response: VercelChatResponse & { debugSystemPrompt?: string } = {
			response: text,
			inputTokens,
			outputTokens,
			totalTokens,
			sourcesUsed: formatSources(contextSummaries),
			summariesUsed: summaryIds,
			usedCachedContext: false,
			linkedBlogPosts: blogRefs,
			...(dev ? { debugSystemPrompt: systemPrompt } : {})
		};

		return json(response);
	} catch (err: any) {
		console.error('Error in chat API:', err);

		if (err.message?.includes('rate limit')) {
			return error(429, 'API rate limit exceeded. Please try again later.');
		}

		if (err.message?.includes('authentication')) {
			return error(401, 'Authentication failed');
		}

		return error(500, `Chat service error: ${err.message || 'Unknown error'}`);
	}
};
