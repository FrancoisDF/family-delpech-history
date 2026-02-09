#!/usr/bin/env node
/**
 * Generate book/section summaries for hierarchical RAG
 * Provider-agnostic version using Vercel AI SDK
 * Supports both Anthropic and OpenAI-compatible providers
 *
 * Usage:
 *   AI_PROVIDER=anthropic ANTHROPIC_API_KEY=sk-xxx node scripts/generate-summaries-generic.mjs
 *   AI_PROVIDER=openai OPENAI_API_KEY=sk-xxx OPENAI_MODEL=gpt-3.5-turbo OPENAI_API_BASE=http://localhost:8000/v1 node scripts/generate-summaries-generic.mjs
 *
 * Input:
 *   - static/family-data.json (chunked document data)
 *
 * Output:
 *   - static/book-summaries.json (summaries grouped by title/section)
 *
 * Cost estimate: ~$50-100 for 50 books (using Claude 3.5 Haiku or equivalent)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_PATH = path.resolve(process.cwd(), 'static', 'family-data.json');
const OUT_SUMMARIES = path.resolve(process.cwd(), 'static', 'book-summaries.json');

const BATCH_SIZE = 5; // Summarize 5 books/sections in parallel
const SUMMARY_MAX_TOKENS = 200; // Target ~100-150 tokens per summary

/**
 * Get provider configuration from environment variables
 */
function getProviderConfig() {
	const provider = (process.env.AI_PROVIDER || 'anthropic').toLowerCase();

	if (provider === 'openai') {
		const apiKey = process.env.OPENAI_API_KEY;
		if (!apiKey) {
			throw new Error('OPENAI_API_KEY environment variable is required when AI_PROVIDER=openai');
		}

		const modelName = process.env.OPENAI_MODEL;
		if (!modelName) {
			throw new Error('OPENAI_MODEL environment variable is required when AI_PROVIDER=openai');
		}

		const baseUrl = process.env.OPENAI_API_BASE;

		return {
			provider: 'openai',
			apiKey,
			modelName,
			baseUrl
		};
	}

	// Default to Anthropic
	const apiKey = process.env.ANTHROPIC_API_KEY;
	if (!apiKey) {
		throw new Error(
			'ANTHROPIC_API_KEY environment variable is required when AI_PROVIDER=anthropic'
		);
	}

	const modelName = process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022';

	return {
		provider: 'anthropic',
		apiKey,
		modelName
	};
}

/**
 * Create a model based on provider configuration
 */
function createModel(config) {
	if (config.provider === 'openai') {
		const openaiClient = createOpenAI({
			apiKey: config.apiKey,
			baseURL: config.baseUrl
		});
		return openaiClient(config.modelName);
	}

	// Anthropic
	const anthropicClient = createAnthropic({
		apiKey: config.apiKey
	});
	return anthropicClient(config.modelName);
}

/**
 * Group chunks by title to identify logical sections/books
 */
function groupChunksByTitle(chunks) {
	const groups = new Map();

	for (const chunk of chunks) {
		const title = chunk.title || 'Unknown';
		if (!groups.has(title)) {
			groups.set(title, []);
		}
		groups.get(title).push(chunk);
	}

	return groups;
}

/**
 * Create a combined text from all chunks in a group
 * (Limit to prevent token explosion)
 */
function createSourceText(chunks, maxChars = 4000) {
	let text = chunks.map((c) => c.text).join('\n\n');

	if (text.length > maxChars) {
		text = text.substring(0, maxChars) + '...';
	}

	return text;
}

/**
 * Generate summary for a single title group using Vercel AI SDK
 */
async function generateSummary(model, title, sourceText) {
	const prompt = `You are a genealogist and family historian. Summarize the following family history or biographical document in 2-3 clear sentences. Focus on key facts, names, dates, and relationships.

DOCUMENT: "${title}"

---
${sourceText}
---

SUMMARY (2-3 sentences, genealogy-focused):`;

	try {
		const { text, usage } = await generateText({
			model,
			prompt,
			temperature: 0.7,
			maxTokens: SUMMARY_MAX_TOKENS
		});

		return {
			title,
			summary: text.trim(),
			inputTokens: usage.promptTokens,
			outputTokens: usage.completionTokens
		};
	} catch (err) {
		console.error(`Failed to summarize "${title}":`, err.message);
		return {
			title,
			summary: `[Summary failed] Document: ${title}`,
			inputTokens: 0,
			outputTokens: 0,
			error: err.message
		};
	}
}

/**
 * Process summaries in batches
 */
async function generateSummariesBatch(model, groups) {
	const titles = Array.from(groups.keys());
	const results = [];
	let totalInputTokens = 0;
	let totalOutputTokens = 0;

	console.log(`\n📚 Generating summaries for ${titles.length} sections...`);
	console.log('─'.repeat(60));

	for (let i = 0; i < titles.length; i += BATCH_SIZE) {
		const batch = titles.slice(i, Math.min(i + BATCH_SIZE, titles.length));
		const batchPromises = batch.map((title) => {
			const chunks = groups.get(title);
			const sourceText = createSourceText(chunks);
			return generateSummary(model, title, sourceText);
		});

		const batchResults = await Promise.all(batchPromises);
		results.push(...batchResults);

		for (const result of batchResults) {
			totalInputTokens += result.inputTokens;
			totalOutputTokens += result.outputTokens;
			const status = result.error ? '❌' : '✓';
			console.log(`${status} ${result.title.substring(0, 50)}`);
			if (result.summary.length < 100) {
				console.log(`  Summary: ${result.summary.substring(0, 80)}...`);
			}
		}

		// Rate limiting: wait between batches
		if (i + BATCH_SIZE < titles.length) {
			console.log('⏳ Waiting before next batch (rate limiting)...');
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}

	console.log('─'.repeat(60));
	console.log(
		`\n📊 Summarization Complete:\n  Total sections: ${titles.length}\n  Input tokens: ${totalInputTokens}\n  Output tokens: ${totalOutputTokens}\n  Total tokens used: ${totalInputTokens + totalOutputTokens}`
	);

	return results;
}

/**
 * Convert summaries to searchable format with metadata
 */
function formatSummariesForStorage(summaryResults, groups) {
	return summaryResults.map((result) => {
		const chunks = groups.get(result.title) || [];
		const firstChunk = chunks[0] || {};

		return {
			id: `summary-${result.title.replace(/\s+/g, '-').toLowerCase()}`,
			title: result.title,
			summary: result.summary,
			sourceType: firstChunk.sourceType || 'document',
			url: firstChunk.url || '',
			originalChunkCount: chunks.length,
			metadata: {
				author: firstChunk.author || '',
				year: firstChunk.year || '',
				category: firstChunk.category || '',
				tags: firstChunk.tags || []
			}
		};
	});
}

/**
 * Main function
 */
async function main() {
	// Get provider configuration
	let config;
	try {
		config = getProviderConfig();
	} catch (err) {
		console.error(`❌ Configuration error: ${err.message}`);
		process.exit(1);
	}

	const providerInfo =
		config.provider === 'openai'
			? `OpenAI-compatible (${config.baseUrl || 'api.openai.com'}) with model ${config.modelName}`
			: `Anthropic with model ${config.modelName}`;

	console.log(`\n🤖 Using provider: ${providerInfo}`);

	// Load family data
	if (!fs.existsSync(DATA_PATH)) {
		console.error(`❌ Error: ${DATA_PATH} not found. Run data ingestion first.`);
		process.exit(1);
	}

	console.log('📖 Loading family data...');
	const chunks = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
	console.log(`✓ Loaded ${chunks.length} chunks`);

	// Group by title
	const groups = groupChunksByTitle(chunks);
	console.log(`✓ Found ${groups.size} unique sections/books`);

	// Create model using provider factory
	const model = createModel(config);

	// Generate summaries
	const summaryResults = await generateSummariesBatch(model, groups);

	// Format for storage
	const formattedSummaries = formatSummariesForStorage(summaryResults, groups);

	// Save to file
	fs.writeFileSync(OUT_SUMMARIES, JSON.stringify(formattedSummaries, null, 2));
	console.log(`\n✅ Summaries saved to ${OUT_SUMMARIES}`);
	console.log(`   Summaries available: ${formattedSummaries.length}`);
}

main().catch((err) => {
	console.error('Fatal error:', err);
	process.exit(1);
});
