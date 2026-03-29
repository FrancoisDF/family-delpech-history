/**
 * Server-side blog post ingestion: text extraction, chunking, embedding.
 * Ported from scripts/ingest-builder-content.mjs for use in API routes.
 */

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '$env/static/private';
import { generateEmbedding } from '$lib/server/embeddings';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------------------------------------------------------------------------
// Text helpers (ported from scripts/ingest-builder-content.mjs)
// ---------------------------------------------------------------------------

function toKebabCase(str: string): string {
	return String(str || '')
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^\w\s-]/g, '')
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-');
}

function stripHtml(html: string): string {
	return String(html || '')
		.replace(/<script[\s\S]*?<\/script>/gi, ' ')
		.replace(/<style[\s\S]*?<\/style>/gi, ' ')
		.replace(/<[^>]*>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/\s+/g, ' ')
		.trim();
}

function markdownToText(md: string): string {
	return String(md || '')
		.replace(/\[(.*?)\]\((.*?)\)/g, '$1')
		.replace(/^#{1,6}\s+/gm, '')
		.replace(/\*\*(.*?)\*\*/g, '$1')
		.replace(/\*(.*?)\*/g, '$1')
		.replace(/`(.*?)`/g, '$1')
		.replace(/^\s*[-*+]\s+/gm, '')
		.replace(/^\s*\d+\.\s+/gm, '')
		.replace(/\s+/g, ' ')
		.trim();
}

function normalizeReadableText(raw: string): string {
	const s = String(raw || '').trim();
	if (!s) return '';
	if (/<[a-z][\s\S]*>/i.test(s)) return stripHtml(s);
	return markdownToText(s);
}

const NON_TEXT_KEYS = new Set([
	'url', 'href', 'src', 'file', 'pdfFile', 'featuredImage', 'image',
	'imageUrl', 'backgroundImage', 'buttonLink', 'link', 'videoUrl', 'path'
]);

function collectTextDeep(value: unknown, pieces: string[], visited: Set<unknown>): void {
	if (value == null) return;

	if (typeof value === 'string') {
		const t = normalizeReadableText(value);
		if (t && t.length > 2) pieces.push(t);
		return;
	}

	if (typeof value === 'number' || typeof value === 'boolean') return;

	if (Array.isArray(value)) {
		for (const item of value) collectTextDeep(item, pieces, visited);
		return;
	}

	if (typeof value === 'object') {
		if (visited.has(value)) return;
		visited.add(value);
		for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
			if (NON_TEXT_KEYS.has(k)) continue;
			collectTextDeep(v, pieces, visited);
		}
	}
}

// Header field names from component-extraction-helpers.mjs
const HEADER_FIELDS = [
	'title', 'excerpt', 'author', 'date', 'readTime', 'category',
	'featuredImage', 'pdfFile', 'content'
];

/**
 * Extract readable text from a Builder.io blog entry (data + blocks).
 */
export function extractBuilderPostText(entry: Record<string, unknown>): string {
	const pieces: string[] = [];
	const visited = new Set<unknown>();

	if (entry?.name && typeof entry.name === 'string') {
		pieces.push(normalizeReadableText(entry.name));
	}

	const d = entry?.data && typeof entry.data === 'object' ? (entry.data as Record<string, unknown>) : null;
	if (!d) return pieces.filter(Boolean).join('\n\n');

	// Header-level fields
	for (const f of HEADER_FIELDS) {
		if (typeof d[f] === 'string' && (d[f] as string).trim()) {
			pieces.push(normalizeReadableText(d[f] as string));
		}
	}

	// Blocks
	if (Array.isArray(d.blocks)) {
		for (const b of d.blocks) {
			collectTextDeep(b, pieces, visited);
		}
	}

	// Anything else
	collectTextDeep(d, pieces, visited);

	return pieces
		.map((p) => String(p || '').trim())
		.filter(Boolean)
		.join('\n\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

// ---------------------------------------------------------------------------
// Chunking (same parameters as the script)
// ---------------------------------------------------------------------------

const CHUNK_SIZE = 900;
const CHUNK_OVERLAP = 250;
const MIN_CHUNK_LENGTH = 50;

function splitIntoParagraphs(text: string): string[] {
	// Try double-newline split first (standard paragraph separator)
	let paragraphs = text
		.split(/\n\n+/)
		.map((p) => p.trim())
		.filter(Boolean);

	// If the text has very few paragraph breaks (e.g. .txt exports with single
	// newlines), fall back to single-newline splitting
	if (paragraphs.length <= 1 && text.length > CHUNK_SIZE) {
		paragraphs = text
			.split(/\n/)
			.map((p) => p.trim())
			.filter(Boolean);
	}

	// If still a single huge block (no newlines at all), split by sentences
	if (paragraphs.length <= 1 && text.length > CHUNK_SIZE) {
		paragraphs = text
			.split(/(?<=[.!?])\s+/)
			.map((s) => s.trim())
			.filter(Boolean);
	}

	return paragraphs;
}

export function chunkText(text: string): string[] {
	const chunks: string[] = [];
	const paragraphs = splitIntoParagraphs(text);

	let currentChunk = '';

	for (const para of paragraphs) {
		// If a single paragraph exceeds chunk size, split it further
		if (para.length > CHUNK_SIZE) {
			if (currentChunk.trim().length >= MIN_CHUNK_LENGTH) {
				chunks.push(currentChunk.trim());
			}
			const sentences = para.split(/(?<=[.!?])\s+/).filter(Boolean);
			let subChunk = '';
			for (const sentence of sentences) {
				if (subChunk.length > 0 && subChunk.length + sentence.length + 1 > CHUNK_SIZE) {
					if (subChunk.trim().length >= MIN_CHUNK_LENGTH) {
						chunks.push(subChunk.trim());
					}
					const overlapStart = Math.max(0, subChunk.length - CHUNK_OVERLAP);
					subChunk = subChunk.substring(overlapStart);
				}
				if (subChunk.length > 0) subChunk += ' ';
				subChunk += sentence;
			}
			const overlapStart = Math.max(0, subChunk.length - CHUNK_OVERLAP);
			if (subChunk.trim().length >= MIN_CHUNK_LENGTH && subChunk.length > CHUNK_OVERLAP) {
				chunks.push(subChunk.trim());
				currentChunk = subChunk.substring(overlapStart);
			} else {
				currentChunk = subChunk;
			}
			continue;
		}

		if (currentChunk.length > 0 && currentChunk.length + para.length + 2 > CHUNK_SIZE) {
			if (currentChunk.trim().length >= MIN_CHUNK_LENGTH) {
				chunks.push(currentChunk.trim());
			}
			const overlapStart = Math.max(0, currentChunk.length - CHUNK_OVERLAP);
			currentChunk = currentChunk.substring(overlapStart);
		}

		if (currentChunk.length > 0) currentChunk += '\n\n';
		currentChunk += para;
	}

	if (currentChunk.trim().length >= MIN_CHUNK_LENGTH) {
		chunks.push(currentChunk.trim());
	}

	return chunks;
}

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

function ensureInternalPostHandle(entryId: string, title: string, handleCandidate: string): string {
	const handle = String(handleCandidate || '').trim();
	if (handle && (handle === entryId || handle.startsWith(`${entryId}-`))) return handle;
	const slug = toKebabCase(title || '');
	return slug ? `${entryId}-${slug}` : entryId;
}

export function getBuilderEntryUrl(entry: Record<string, unknown>, entryId: string, title: string): string {
	const d = (entry?.data || {}) as Record<string, unknown>;
	const handle = ensureInternalPostHandle(
		entryId,
		title,
		(d.handle || d.slug || '') as string
	);
	return `/histoires/${handle}`;
}

// ---------------------------------------------------------------------------
// Ingestion / Removal
// ---------------------------------------------------------------------------

export interface IngestResult {
	chunksCreated: number;
	chunkErrors: number;
}

/**
 * Ingest a single Builder.io blog post into the documents table.
 * Extracts text, chunks it, generates embeddings, and inserts rows
 * with content_type = 'blog_post'.
 */
export async function ingestBlogPost(entry: Record<string, unknown>): Promise<IngestResult> {
	const entryId = (entry.id as string) || '';
	const title = ((entry.data as any)?.title as string) || (entry.name as string) || '';
	const postUrl = getBuilderEntryUrl(entry, entryId, title);

	const text = extractBuilderPostText(entry);
	if (!text || text.length < 10) {
		return { chunksCreated: 0, chunkErrors: 0 };
	}

	const chunks = chunkText(text);
	let chunksCreated = 0;
	let chunkErrors = 0;

	for (let i = 0; i < chunks.length; i++) {
		try {
			const textToEmbed = title ? `${title}: ${chunks[i]}` : chunks[i];
			const embedding = await generateEmbedding(textToEmbed);

			const { error: insertErr } = await supabase.from('documents').insert({
				source_id: entryId,
				source_model: 'blog-articles',
				title,
				url: postUrl,
				chunk_index: i,
				content: chunks[i],
				embedding,
				content_type: 'blog_post',
				metadata: JSON.stringify({
					sourceType: 'post',
					originPostId: entryId,
					originPostTitle: title,
					originPostUrl: postUrl,
					originPostModel: 'blog-articles'
				})
			});

			if (insertErr) {
				console.error(`Chunk ${i} insert error:`, insertErr.message);
				chunkErrors++;
			} else {
				chunksCreated++;
			}
		} catch (err: any) {
			console.error(`Embedding/insert error for chunk ${i}:`, err.message);
			chunkErrors++;
		}
	}

	return { chunksCreated, chunkErrors };
}

/**
 * Remove all ingested chunks for a given Builder blog post source ID.
 */
export async function removeBlogPostIngestion(sourceId: string): Promise<{ deletedCount: number }> {
	const { data, error: delErr } = await supabase
		.from('documents')
		.delete()
		.eq('source_id', sourceId)
		.eq('content_type', 'blog_post')
		.select('id');

	if (delErr) {
		throw new Error(`Failed to remove ingestion: ${delErr.message}`);
	}

	return { deletedCount: data?.length || 0 };
}
