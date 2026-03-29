#!/usr/bin/env node
/**
 * Ingest chunks from family-data.json into Supabase with pgvector embeddings.
 *
 * This script:
 * 1. Reads the existing family-data.json (produced by ingest-builder-content or ingest-documents)
 * 2. Generates semantic embeddings using Xenova/all-MiniLM-L6-v2
 * 3. Upserts chunks + embeddings into the Supabase `documents` table
 *
 * Usage:
 *   node scripts/ingest-to-supabase.mjs
 *   node scripts/ingest-to-supabase.mjs --input static/family-data.json
 *   node scripts/ingest-to-supabase.mjs --clear                  # Clear ALL data first
 *   node scripts/ingest-to-supabase.mjs --clear-type blog_post   # Clear only blog_post chunks
 *   node scripts/ingest-to-supabase.mjs --clear-type document    # Clear only document chunks
 *   node scripts/ingest-to-supabase.mjs --type blog_post         # Only ingest chunks with contentType=blog_post
 *
 * Environment variables required:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (or SUPABASE_ANON_KEY for insert if RLS allows)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const DEFAULT_INPUT = path.resolve(process.cwd(), 'static', 'family-data.json');
const BATCH_SIZE = 50;

if (!SUPABASE_URL || !SUPABASE_KEY) {
	console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) must be set.');
	process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================================
// CLI args
// ============================================================================

function parseArgs() {
	const args = process.argv.slice(2);
	const options = { input: DEFAULT_INPUT, clear: false, clearType: null, filterType: null };

	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--input' && args[i + 1]) {
			options.input = path.resolve(args[++i]);
		} else if (args[i] === '--clear') {
			options.clear = true;
		} else if (args[i] === '--clear-type' && args[i + 1]) {
			options.clearType = args[++i]; // 'document' or 'blog_post'
		} else if (args[i] === '--type' && args[i + 1]) {
			options.filterType = args[++i]; // only ingest chunks of this type
		}
	}

	return options;
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
	log('Supabase Vector Ingestion Pipeline');
	log('====================================================');
	log(`Input:     ${opts.input}`);
	log(`Supabase:  ${SUPABASE_URL}`);
	if (opts.filterType) log(`Filter:    content_type = ${opts.filterType}`);
	log('');

	// Read source chunks
	if (!fs.existsSync(opts.input)) {
		log(`Input file not found: ${opts.input}`, 'error');
		log('Run the ingestion pipeline first: npm run ingest', 'error');
		process.exit(1);
	}

	let rawData = JSON.parse(fs.readFileSync(opts.input, 'utf8'));
	log(`Loaded ${rawData.length} chunks from ${path.basename(opts.input)}`);

	// Filter by type if specified
	if (opts.filterType) {
		rawData = rawData.filter((chunk) => chunk.contentType === opts.filterType);
		log(`Filtered to ${rawData.length} chunks with contentType=${opts.filterType}`);
	}

	// Optionally clear existing data (all or by type)
	if (opts.clear) {
		log('Clearing ALL existing documents...');
		const { error } = await supabase.from('documents').delete().neq('id', 0);
		if (error) {
			log(`Failed to clear: ${error.message}`, 'error');
		} else {
			log('All documents cleared', 'success');
		}
	} else if (opts.clearType) {
		log(`Clearing documents with content_type = '${opts.clearType}'...`);
		const { error } = await supabase.from('documents').delete().eq('content_type', opts.clearType);
		if (error) {
			log(`Failed to clear: ${error.message}`, 'error');
		} else {
			log(`Documents with content_type='${opts.clearType}' cleared`, 'success');
		}
	}

	// Generate embeddings and insert in batches
	let processed = 0;
	let inserted = 0;
	let errors = 0;

	for (let i = 0; i < rawData.length; i += BATCH_SIZE) {
		const batch = rawData.slice(i, i + BATCH_SIZE);

		// Generate embeddings for this batch
		const textsToEmbed = batch.map((chunk) => {
			const prefix = chunk.title ? `${chunk.title}: ` : '';
			return prefix + chunk.text;
		});

		let embeddings;
		try {
			embeddings = await Promise.all(textsToEmbed.map((t) => generateEmbedding(t)));
		} catch (err) {
			log(`Embedding generation failed for batch ${i}: ${err.message}`, 'error');
			errors += batch.length;
			continue;
		}

		// Prepare rows for Supabase
		const rows = batch.map((chunk, j) => ({
			source_id: chunk.sourceId || chunk.id,
			source_model: chunk.sourceModel || 'documents',
			title: chunk.title || null,
			author: chunk.author || null,
			year: chunk.year || null,
			category: chunk.category || null,
			url: chunk.url || null,
			chunk_index: chunk.index ?? j,
			content: chunk.text,
			embedding: embeddings[j],
			content_type: chunk.contentType || 'document',
			source_document_id: chunk.sourceDocumentId || null,
			metadata: JSON.stringify({
				original_id: chunk.id,
				tags: chunk.tags || [],
				sourceType: chunk.sourceType || null,
				originPostId: chunk.originPostId || null,
				originPostTitle: chunk.originPostTitle || null,
				originPostUrl: chunk.originPostUrl || null,
				attachmentUrl: chunk.attachmentUrl || null,
				attachmentFileName: chunk.attachmentFileName || null
			})
		}));

		const { error } = await supabase.from('documents').insert(rows);

		if (error) {
			log(`Insert failed for batch starting at ${i}: ${error.message}`, 'error');
			errors += batch.length;
		} else {
			inserted += batch.length;
		}

		processed += batch.length;
		const pct = ((processed / rawData.length) * 100).toFixed(1);
		process.stdout.write(`\r  Progress: ${processed}/${rawData.length} (${pct}%) -- ${inserted} inserted, ${errors} errors`);
	}

	console.log('');
	log('');
	log('====================================================');
	log('Ingestion Complete', 'success');
	log('====================================================');
	log(`Total chunks:    ${rawData.length}`);
	log(`Inserted:        ${inserted}`, 'success');
	log(`Errors:          ${errors}`, errors > 0 ? 'warn' : 'info');
	log('');
}

main().catch((err) => {
	log(err.message, 'error');
	console.error(err.stack);
	process.exit(1);
});
