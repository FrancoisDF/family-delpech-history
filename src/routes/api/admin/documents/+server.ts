/**
 * Admin API: CRUD for source_documents
 * GET  — list all source documents
 * POST — create a new source document (+ auto-chunk into documents table)
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '$env/static/private';
import { generateEmbedding } from '$lib/server/embeddings';
import { requireAdminApi } from '$lib/server/admin-auth';
import { parseFile, FileParseError, MAX_FILE_SIZE } from '$lib/server/file-parser';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CHUNK_SIZE = 900;
const CHUNK_OVERLAP = 250;
const MIN_CHUNK_LENGTH = 50;

function splitIntoParagraphs(text: string): string[] {
	// Try double-newline split first (standard paragraph separator)
	let paragraphs = text
		.split(/\n\n+/)
		.map((p) => p.trim())
		.filter(Boolean);

	// If the text has very few paragraph breaks (e.g. .txt from Google Docs
	// uses single newlines), fall back to single-newline splitting
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

function chunkText(text: string): string[] {
	const chunks: string[] = [];
	const paragraphs = splitIntoParagraphs(text);

	let currentChunk = '';

	for (const para of paragraphs) {
		// If a single paragraph exceeds chunk size, split it further
		if (para.length > CHUNK_SIZE) {
			// Flush current chunk first
			if (currentChunk.trim().length >= MIN_CHUNK_LENGTH) {
				chunks.push(currentChunk.trim());
			}
			// Split the long paragraph by sentences
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
			// Carry over remainder with overlap
			const overlapStart = Math.max(0, subChunk.length - CHUNK_OVERLAP);
			currentChunk = subChunk.substring(overlapStart);
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

export const GET: RequestHandler = async ({ cookies }) => {
	const authError = requireAdminApi(cookies);
	if (authError) return authError;
	const { data, error: fetchError } = await supabase
		.from('source_documents')
		.select('id, title, author, year, category, tags, created_at, updated_at')
		.order('created_at', { ascending: false });

	if (fetchError) {
		return error(500, fetchError.message);
	}

	return json({ documents: data });
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	const authError = requireAdminApi(cookies);
	if (authError) return authError;

	let title: string;
	let content: string;
	let author: string | null = null;
	let year: string | null = null;
	let category: string | null = null;
	let tags: string[] = [];
	let originalFilename: string | null = null;

	const contentType = request.headers.get('content-type') || '';

	if (contentType.includes('multipart/form-data')) {
		// --- File upload path ---
		const formData = await request.formData();
		const file = formData.get('file') as File | null;

		title = (formData.get('title') as string)?.trim() || '';
		author = (formData.get('author') as string)?.trim() || null;
		year = (formData.get('year') as string)?.trim() || null;
		category = (formData.get('category') as string)?.trim() || null;
		const tagsRaw = (formData.get('tags') as string) || '';
		tags = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean);

		if (!file || file.size === 0) {
			return error(400, 'Un fichier est requis.');
		}

		if (file.size > MAX_FILE_SIZE) {
			return error(400, `Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} Mo). Maximum: 10 Mo.`);
		}

		originalFilename = file.name;

		// Auto-fill title from filename if not provided
		if (!title) {
			title = file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ');
		}

		try {
			const buffer = Buffer.from(await file.arrayBuffer());
			content = await parseFile(buffer, file.type, file.name);
		} catch (err: any) {
			if (err instanceof FileParseError) {
				return error(400, err.message);
			}
			console.error('File parse error:', err);
			return error(500, 'Erreur lors de l\'extraction du texte du fichier.');
		}
	} else {
		// --- JSON paste path (existing behaviour) ---
		const body = await request.json();
		title = body.title?.trim() || '';
		content = body.content?.trim() || '';
		author = body.author?.trim() || null;
		year = body.year?.trim() || null;
		category = body.category?.trim() || null;
		tags = body.tags || [];
	}

	if (!title || !content) {
		return error(400, 'title and content are required');
	}

	// 1. Insert into source_documents
	const { data: sourceDoc, error: insertError } = await supabase
		.from('source_documents')
		.insert({
			title,
			content,
			author: author || null,
			year: year || null,
			category: category || null,
			tags: tags || []
		})
		.select()
		.single();

	if (insertError || !sourceDoc) {
		return error(500, insertError?.message || 'Failed to create source document');
	}

	// 2. Chunk the content
	const chunks = chunkText(content);

	// 3. Generate embeddings and insert document chunks
	let insertedChunks = 0;
	let chunkErrors = 0;

	for (let i = 0; i < chunks.length; i++) {
		try {
			const textToEmbed = title ? `${title}: ${chunks[i]}` : chunks[i];
			const embedding = await generateEmbedding(textToEmbed);

			const { error: chunkInsertError } = await supabase.from('documents').insert({
				source_id: sourceDoc.id,
				source_model: 'source-documents',
				title,
				author: author || null,
				year: year || null,
				category: category || null,
				url: null,
				chunk_index: i,
				content: chunks[i],
				embedding,
				content_type: 'document',
				source_document_id: sourceDoc.id,
				metadata: JSON.stringify({
					tags: tags || [],
					sourceType: 'document',
					...(originalFilename ? { originalFilename } : {})
				})
			});

			if (chunkInsertError) {
				console.error(`Chunk ${i} insert error:`, chunkInsertError.message);
				chunkErrors++;
			} else {
				insertedChunks++;
			}
		} catch (err: any) {
			console.error(`Embedding/insert error for chunk ${i}:`, err.message);
			chunkErrors++;
		}
	}

	return json({
		document: sourceDoc,
		chunksCreated: insertedChunks,
		chunkErrors
	});
};
