/**
 * Vercel AI integration for server-side Claude chat with Anthropic
 * Uses hierarchical summarization for token-efficient RAG
 * Supports dual-source retrieval: documents (ground truth) + blog posts (enrichment)
 */

import type { FamilyChunk } from './data';
import type { BookSummary } from './search';
import { searchFamilyData, searchSummaries } from './search';

export interface LinkedBlogRef {
	id: string;
	title: string;
	url: string;
}

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
	linkedBlogPosts?: LinkedBlogRef[];
}

/**
 * Estimate tokens for a message using rough heuristic (1 token ≈ 4 characters)
 */
export function estimateTokens(text: string): number {
	return Math.ceil(text.length / 4);
}

/**
 * Build system prompt with dual-source context:
 * - Document summaries as ground truth (primary)
 * - Blog post summaries as contextual enrichment (secondary)
 */
export function buildSystemPrompt(
	contextSummaries: BookSummary[],
	linkedBlogPosts?: LinkedBlogRef[]
): string {
	const maxContextTokens = 500;
	let contextText = '';
	let tokenCount = 0;

	// Primary source: documents (ground truth)
	const documentSummaries = contextSummaries.filter(
		(s) => s.sourceType === 'document' || s.sourceType === 'local-document'
	);
	const blogSummaries = contextSummaries.filter((s) => s.sourceType === 'blog_post');

	// Include document summaries first (they are authoritative)
	for (const summary of documentSummaries) {
		const summaryTokens = estimateTokens(summary.summary);
		if (tokenCount + summaryTokens > maxContextTokens) break;

		const sourceInfo = summary.title ? `[Document: ${summary.title}]` : '[Archive familiale]';
		contextText += `${sourceInfo}\n${summary.summary}\n\n`;
		tokenCount += summaryTokens;
	}

	// Then include blog post summaries as enrichment if budget allows
	for (const summary of blogSummaries) {
		const summaryTokens = estimateTokens(summary.summary);
		if (tokenCount + summaryTokens > maxContextTokens) break;

		const sourceInfo = summary.title
			? `[Article: ${summary.title}]`
			: '[Article de blog]';
		contextText += `${sourceInfo}\n${summary.summary}\n\n`;
		tokenCount += summaryTokens;
	}

	// If no document summaries were found, use all summaries as fallback
	if (documentSummaries.length === 0) {
		for (const summary of contextSummaries) {
			const summaryTokens = estimateTokens(summary.summary);
			if (tokenCount + summaryTokens > maxContextTokens) break;

			const sourceInfo = summary.title ? `[${summary.title}]` : '[Archive familiale]';
			contextText += `${sourceInfo}\n${summary.summary}\n\n`;
			tokenCount += summaryTokens;
		}
	}

	let blogLinksSection = '';
	if (linkedBlogPosts && linkedBlogPosts.length > 0) {
		blogLinksSection = `\nRELATED BLOG ARTICLES (for additional context, mention these when relevant):
${linkedBlogPosts.map((bp) => `- "${bp.title}" (${bp.url})`).join('\n')}
`;
	}

	const prompt = `Tu es une assistante bienveillante spécialisée dans l'histoire familiale et la généalogie. Tu réponds UNIQUEMENT en français, avec un ton chaleureux, nostalgique et attentionné.

RÈGLES IMPORTANTES :
1. Utilise uniquement les informations des documents et résumés fournis ci-dessous pour répondre.
2. Les documents sont la source primaire et font autorité.
3. Les articles de blog apportent un contexte et une interprétation supplémentaires.
4. Si une question ne peut pas être répondue à partir du contexte, dis poliment : « Je n'ai pas cette information dans mes documents. »
5. N'utilise PAS de connaissances externes et n'invente rien.
6. Donne des réponses détaillées et complètes en plusieurs paragraphes pour rendre la lecture intéressante et enrichissante.
7. Cite les documents sources quand c'est pertinent.
8. Maintiens un ton chaleureux, nostalgique et bienveillant lorsque tu évoques l'histoire familiale.
9. Quand c'est pertinent, mentionne les articles de blog connexes que l'utilisateur peut lire pour plus de détails.

CONTEXTE DES DOCUMENTS FAMILIAUX (Source Primaire) :
${contextText || 'Aucun document pertinent trouvé.'}
${blogLinksSection}
Réponds à la question de l'utilisateur en te basant UNIQUEMENT sur le contexte ci-dessus. Si l'information n'est pas dans les documents, indique-le clairement.`;

	return prompt;
}

/**
 * Get relevant context summaries for a query
 */
export async function getSummarySummaries(
	query: string,
	opts?: { topK?: number }
): Promise<BookSummary[]> {
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
		.slice(0, 3)
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
