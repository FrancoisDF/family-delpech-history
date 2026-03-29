import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	searchDocumentsWithBlogLinks,
	formatAsContextSummaries
} from '$lib/server/vector-search';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { message } = body;

		if (!message || typeof message !== 'string') {
			return json({ error: 'Missing or invalid "message" field' }, { status: 400 });
		}

		// Search documents first, then resolve linked blog posts
		const { documentResults, linkedBlogPosts } = await searchDocumentsWithBlogLinks(message, {
			topK: 5,
			threshold: 0.3
		});

		// Format as context summaries for the client
		const summaries = formatAsContextSummaries(documentResults);

		// Map to FamilyChunk shape for the local LLM
		const chunks = documentResults.map((r) => ({
			id: String(r.id),
			sourceId: r.source_id,
			sourceModel: r.source_model,
			title: r.title || 'Unknown',
			url: r.url || '',
			index: r.chunk_index,
			text: r.content,
			length: r.content.length,
			author: r.author,
			year: r.year,
			category: r.category,
			contentType: r.content_type,
			sourceType:
				r.content_type === 'blog_post' ? ('post' as const) : ('local-document' as const),
			isBuilderContent: r.content_type === 'blog_post',
			similarity: r.similarity
		}));

		return json({
			chunks,
			summaries,
			linkedBlogPosts: linkedBlogPosts.map((bp) => ({
				id: bp.builder_blog_id,
				title: bp.builder_blog_title || 'Article lié',
				url: bp.builder_blog_url || ''
			}))
		});
	} catch (err) {
		console.error('RAG search failed:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
