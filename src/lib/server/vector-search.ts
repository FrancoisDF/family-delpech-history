/**
 * Server-side vector search using Supabase + pgvector
 * Supports decoupled document/blog retrieval with content_type filtering
 * and blog link resolution for document-first RAG.
 */

import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from './embeddings';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '$env/static/private';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface DocumentMatch {
	id: number;
	content: string;
	title: string;
	source_id: string;
	source_model: string;
	url: string;
	author: string;
	year: string;
	category: string;
	chunk_index: number;
	metadata: Record<string, unknown>;
	similarity: number;
	content_type: string;
	source_document_id: string | null;
}

export interface LinkedBlogPost {
	builder_blog_id: string;
	builder_blog_title: string | null;
	builder_blog_url: string | null;
}

export interface DocumentsWithBlogLinks {
	documentResults: DocumentMatch[];
	linkedBlogPosts: LinkedBlogPost[];
}

/**
 * Search documents by semantic similarity using pgvector
 * Supports optional content_type filtering: 'document', 'blog_post', or null (all)
 */
export async function searchDocuments(
	query: string,
	opts?: {
		topK?: number;
		threshold?: number;
		sourceModel?: string;
		contentType?: string | null;
	}
): Promise<DocumentMatch[]> {
	const topK = opts?.topK ?? 5;
	const threshold = opts?.threshold ?? 0.3;

	try {
		const queryEmbedding = await generateEmbedding(query);

		const { data, error } = await supabase.rpc('match_documents', {
			query_embedding: queryEmbedding,
			match_threshold: threshold,
			match_count: topK,
			filter_content_type: opts?.contentType ?? null
		});

		if (error) {
			console.error('Supabase vector search error:', error);
			return [];
		}

		let results = (data as DocumentMatch[]) || [];

		// Optionally filter by source model (legacy compat)
		if (opts?.sourceModel) {
			results = results.filter((d) => d.source_model === opts.sourceModel);
		}

		return results;
	} catch (err) {
		console.error('Vector search failed:', err);
		return [];
	}
}

/**
 * Search document chunks first, then resolve linked blog posts.
 * This implements the retrieval-first architecture:
 * 1. Search documents (ground truth) via vector similarity
 * 2. Collect source_document_ids from results
 * 3. Query document_blog_links for associated blog posts
 * 4. Return both for the caller to build a grounded response with blog enrichment
 */
export async function searchDocumentsWithBlogLinks(
	query: string,
	opts?: { topK?: number; threshold?: number }
): Promise<DocumentsWithBlogLinks> {
	const topK = opts?.topK ?? 5;
	const threshold = opts?.threshold ?? 0.3;

	try {
		// Step 1: Search document chunks only
		const documentResults = await searchDocuments(query, {
			topK,
			threshold,
			contentType: 'document'
		});

		// Step 2: Collect unique source_document_ids
		const sourceDocIds = [
			...new Set(
				documentResults
					.map((r) => r.source_document_id)
					.filter((id): id is string => id !== null)
			)
		];

		// Step 3: Resolve linked blog posts
		let linkedBlogPosts: LinkedBlogPost[] = [];

		if (sourceDocIds.length > 0) {
			const { data, error } = await supabase
				.from('document_blog_links')
				.select('builder_blog_id, builder_blog_title, builder_blog_url')
				.in('source_document_id', sourceDocIds);

			if (!error && data) {
				// Deduplicate by builder_blog_id
				const seen = new Set<string>();
				linkedBlogPosts = data.filter((link) => {
					if (seen.has(link.builder_blog_id)) return false;
					seen.add(link.builder_blog_id);
					return true;
				});
			}
		}

		return { documentResults, linkedBlogPosts };
	} catch (err) {
		console.error('Document search with blog links failed:', err);
		return { documentResults: [], linkedBlogPosts: [] };
	}
}

/**
 * Format search results into context summaries compatible with the existing prompt builder
 */
export function formatAsContextSummaries(results: DocumentMatch[]) {
	return results.map((r) => ({
		id: r.source_id,
		title: r.title || 'Unknown',
		summary: r.content,
		sourceType: r.content_type || r.source_model || 'document',
		url: r.url || '',
		originalChunkCount: 1,
		metadata: {
			author: r.author,
			year: r.year,
			category: r.category,
			similarity: r.similarity,
			contentType: r.content_type
		}
	}));
}
