#!/usr/bin/env node
/**
 * Ingest documents from Supabase `source_documents` table into `documents` table
 * with pgvector embeddings. This is the standalone document ingestion pipeline.
 *
 * Flow:
 * 1. Read all source_documents from Supabase
 * 2. Chunk each document's content
 * 3. Generate embeddings with Xenova/all-MiniLM-L6-v2
 * 4. Insert into `documents` table with content_type='document' and source_document_id
 *
 * Usage:
 *   node scripts/ingest-documents.mjs
 *   node scripts/ingest-documents.mjs --clear   # Clear existing document chunks first
 *
 * Environment variables required:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const BATCH_SIZE = 50;
const CHUNK_SIZE = 900;
const CHUNK_OVERLAP = 250;
const MIN_CHUNK_LENGTH = 50;

if (!SUPABASE_URL || !SUPABASE_KEY) {
	console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
	process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================================
// CLI args
// ============================================================================

function parseArgs() {
	const args = process.argv.slice(2);
	return { clear: args.includes('--clear') };
}

// ============================================================================
// Chunking
// ============================================================================

function chunkText(text, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
	const chunks = [];
	const paragraphs = String(text || '')
		.split(/\n\n+/)
		.map((p) => p.trim())
		.filter(Boolean);

	let currentChunk = '';

	for (const para of paragraphs) {
		if (currentChunk.length > 0 && currentChunk.length + para.length + 2 > size) {
			if (currentChunk.trim().length >= MIN_CHUNK_LENGTH) {
				chunks.push(currentChunk.trim());
			}
			const overlapStart = Math.max(0, currentChunk.length - overlap);
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

// ============================================================================
// Embedding generation
// ============================================================================

let embeddingPipeline = null;

async function getEmbeddingPipeline() {
	if (embeddingPipeline) return embeddingPipeline;

	console.log('Loading embedding model (Xenova/all-MiniLM-L6-v2)...');
	const { pipeline } = await import('@xenova/transformers');
	embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
	console.log('Embedding model loaded.');
	return embeddingPipeline;
}

async function generateEmbedding(text) {
	const pipe = await getEmbeddingPipeline();
	const output = await pipe(text, { pooling: 'mean', normalize: true });
	return Array.from(output.data);
}

// ============================================================================
// Logging
// ============================================================================

function log(msg, level = 'info') {
	const timestamp = new Date().toISOString().substring(11, 19);
	const prefix = {
		info: `[${timestamp}] `,
		success: `[${timestamp}] OK `,
		warn: `[${timestamp}] WARN `,
		error: `[${timestamp}] ERR `
	}[level] || `[${timestamp}] `;
	console.log(prefix + msg);
}

// ============================================================================
// Main
// ============================================================================

async function main() {
	const opts = parseArgs();

	log('====================================================');
	log('Document Ingestion Pipeline (from source_documents)');
	log('====================================================');
	log(`Supabase: ${SUPABASE_URL}`);
	log('');

	// Fetch all source_documents
	const { data: sourceDocs, error: fetchError } = await supabase
		.from('source_documents')
		.select('*')
		.order('created_at', { ascending: true });

	if (fetchError) {
		log(`Failed to fetch source_documents: ${fetchError.message}`, 'error');
		process.exit(1);
	}

	if (!sourceDocs || sourceDocs.length === 0) {
		log('No source documents found. Upload documents first via /admin/documents.', 'warn');
		process.exit(0);
	}

	log(`Found ${sourceDocs.length} source document(s)`);

	// Optionally clear existing document chunks
	if (opts.clear) {
		log('Clearing existing document chunks...');
		const { error } = await supabase.from('documents').delete().eq('content_type', 'document');
		if (error) {
			log(`Failed to clear: ${error.message}`, 'error');
		} else {
			log('Existing document chunks cleared', 'success');
		}
	}

	let totalChunks = 0;
	let inserted = 0;
	let errors = 0;

	for (const doc of sourceDocs) {
		log(`Processing: "${doc.title}" (${doc.content.length} chars)`);

		const chunks = chunkText(doc.content);
		log(`  Chunked into ${chunks.length} pieces`);

		for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
			const batch = chunks.slice(i, i + BATCH_SIZE);

			// Generate embeddings
			let embeddings;
			try {
				const textsToEmbed = batch.map((text) => {
					const prefix = doc.title ? `${doc.title}: ` : '';
					return prefix + text;
				});
				embeddings = await Promise.all(textsToEmbed.map((t) => generateEmbedding(t)));
			} catch (err) {
				log(`  Embedding failed for batch ${i}: ${err.message}`, 'error');
				errors += batch.length;
				continue;
			}

			// Prepare rows
			const rows = batch.map((text, j) => ({
				source_id: doc.id,
				source_model: 'source-documents',
				title: doc.title,
				author: doc.author || null,
				year: doc.year || null,
				category: doc.category || null,
				url: null,
				chunk_index: i + j,
				content: text,
				embedding: embeddings[j],
				content_type: 'document',
				source_document_id: doc.id,
				metadata: JSON.stringify({
					tags: doc.tags || [],
					sourceType: 'document'
				})
			}));

			const { error } = await supabase.from('documents').insert(rows);

			if (error) {
				log(`  Insert failed: ${error.message}`, 'error');
				errors += batch.length;
			} else {
				inserted += batch.length;
			}
		}

		totalChunks += chunks.length;
	}

	log('');
	log('====================================================');
	log('Document Ingestion Complete', 'success');
	log('====================================================');
	log(`Source documents: ${sourceDocs.length}`);
	log(`Total chunks:    ${totalChunks}`);
	log(`Inserted:        ${inserted}`, 'success');
	log(`Errors:          ${errors}`, errors > 0 ? 'warn' : 'info');
	log('');
}

main().catch((err) => {
	log(err.message, 'error');
	console.error(err.stack);
	process.exit(1);
});
