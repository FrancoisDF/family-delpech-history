#!/usr/bin/env node
/**
 * Ingest Builder.io blog content ONLY — no document/attachment downloading.
 * Produces chunked JSON with content_type: 'blog_post' for each chunk.
 *
 * Usage: PUBLIC_BUILDER_API_KEY=your_key node scripts/ingest-builder-content.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
	getHeaderFieldNames,
	getBlockComponentName,
	getBlockData
} from './lib/component-extraction-helpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const OUT = path.resolve(process.cwd(), 'static', 'family-data.json');
const PUBLIC_BUILDER_API_KEY = process.env.PUBLIC_BUILDER_API_KEY;

if (!PUBLIC_BUILDER_API_KEY) {
	console.error('Error: PUBLIC_BUILDER_API_KEY environment variable is not set');
	process.exit(1);
}

function toKebabCase(str) {
	return String(str || '')
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^\w\s-]/g, '')
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-');
}

function stripHtml(html) {
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

function markdownToText(md) {
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

function normalizeReadableText(raw) {
	const s = String(raw || '').trim();
	if (!s) return '';
	if (/<[a-z][\s\S]*>/i.test(s)) return stripHtml(s);
	return markdownToText(s);
}

function collectTextDeep(value, pieces, visited) {
	if (value == null) return;

	const nonTextKeys = new Set([
		'url', 'href', 'src', 'file', 'pdfFile', 'featuredImage', 'image',
		'imageUrl', 'backgroundImage', 'buttonLink', 'link', 'videoUrl', 'path'
	]);

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
		for (const [k, v] of Object.entries(value)) {
			if (nonTextKeys.has(k)) continue;
			collectTextDeep(v, pieces, visited);
		}
	}
}

function extractBuilderPostText(entry) {
	const pieces = [];
	const visited = new Set();

	if (entry?.name) pieces.push(normalizeReadableText(entry.name));

	const d = entry?.data && typeof entry.data === 'object' ? entry.data : null;
	if (!d) return pieces.filter(Boolean).join('\n\n');

	const headerFields = getHeaderFieldNames();
	for (const f of headerFields) {
		if (typeof d[f] === 'string' && d[f].trim()) {
			pieces.push(normalizeReadableText(d[f]));
		}
	}

	if (Array.isArray(d.blocks)) {
		for (const b of d.blocks) {
			collectTextDeep(b, pieces, visited);
		}
	}

	collectTextDeep(d, pieces, visited);

	return pieces
		.map((p) => String(p || '').trim())
		.filter(Boolean)
		.join('\n\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

function ensureInternalPostHandle(entryId, title, handleCandidate) {
	const handle = String(handleCandidate || '').trim();
	if (handle && (handle === entryId || handle.startsWith(`${entryId}-`))) return handle;
	const slug = toKebabCase(title || '');
	return slug ? `${entryId}-${slug}` : entryId;
}

function getBuilderEntryInternalUrl(entry, model, entryId, title) {
	const d = entry?.data || {};
	if (model === 'blog-articles') {
		const handle = ensureInternalPostHandle(entryId, title, d.handle || d.slug);
		return `/histoires/${handle}`;
	}
	return `/${model}/${entryId}`;
}

function chunkText(text, size = 900, overlap = 250, minChunkLength = 50) {
	const chunks = [];
	const paragraphs = String(text || '')
		.split(/\n\n+/)
		.map((p) => p.trim())
		.filter(Boolean);

	let currentChunk = '';

	for (const para of paragraphs) {
		if (currentChunk.length > 0 && currentChunk.length + para.length + 2 > size) {
			if (currentChunk.trim().length >= minChunkLength) {
				chunks.push(currentChunk.trim());
			}
			const overlapStart = Math.max(0, currentChunk.length - overlap);
			currentChunk = currentChunk.substring(overlapStart);
		}

		if (currentChunk.length > 0) currentChunk += '\n\n';
		currentChunk += para;
	}

	if (currentChunk.trim().length >= minChunkLength) {
		chunks.push(currentChunk.trim());
	}

	return chunks;
}

async function fetchModel(model, limit = 100) {
	try {
		const url = new URL(`https://cdn.builder.io/api/v3/content/${model}`);
		url.searchParams.set('apiKey', PUBLIC_BUILDER_API_KEY);
		url.searchParams.set('limit', limit.toString());

		const response = await fetch(url.toString());
		if (!response.ok) {
			throw new Error(`API returned ${response.status}: ${response.statusText}`);
		}

		const data = await response.json();
		return data.results || [];
	} catch (err) {
		console.error('Error fetching model', model, err.message);
		return [];
	}
}

async function main() {
	console.log('Fetching Builder.io blog content (blog posts only, no attachments)...');

	const models = ['blog-articles'];
	const out = [];

	for (const model of models) {
		const entries = await fetchModel(model, 200);
		console.log(`Fetched ${entries.length} items for model '${model}'`);

		for (const entry of entries) {
			const id =
				entry?.id || entry?.data?.id || `${model}-${Math.random().toString(36).slice(2, 9)}`;
			const title = entry?.data?.title || entry?.name || `${model} ${id}`;
			const postUrl = getBuilderEntryInternalUrl(entry, model, id, title);

			const text = extractBuilderPostText(entry);
			if (!text || text.length < 10) continue;

			const postChunks = chunkText(text, 900, 250, 50);
			for (let i = 0; i < postChunks.length; i++) {
				out.push({
					id: `${id}::${i}`,
					sourceId: id,
					sourceModel: model,
					title,
					url: postUrl,
					index: i,
					text: postChunks[i],
					length: postChunks[i].length,
					isBuilderContent: true,
					sourceType: 'post',
					contentType: 'blog_post',
					originPostId: id,
					originPostTitle: title,
					originPostUrl: postUrl,
					originPostModel: model
				});
			}

			// NOTE: Document/attachment downloading has been removed.
			// Documents are now ingested separately via scripts/ingest-documents.mjs
		}
	}

	fs.mkdirSync(path.dirname(OUT), { recursive: true });
	fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
	console.log(`Wrote ${out.length} blog post chunks to ${OUT}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
