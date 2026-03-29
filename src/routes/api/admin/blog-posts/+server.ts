/**
 * Admin API: GET all Builder.io blog posts with ingestion status
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '$env/static/private';
import { PUBLIC_BUILDER_API_KEY } from '$env/static/public';
import { requireAdminApi } from '$lib/server/admin-auth';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const GET: RequestHandler = async ({ cookies }) => {
	const authError = requireAdminApi(cookies);
	if (authError) return authError;

	// 1. Fetch all published blog posts from Builder.io
	const builderUrl = new URL('https://cdn.builder.io/api/v3/content/blog-articles');
	builderUrl.searchParams.set('apiKey', PUBLIC_BUILDER_API_KEY);
	builderUrl.searchParams.set('limit', '200');
	builderUrl.searchParams.set(
		'fields',
		'id,name,data.title,data.handle,data.slug,createdDate,lastUpdated,published'
	);

	let builderPosts: any[] = [];
	try {
		const res = await fetch(builderUrl.toString());
		if (!res.ok) throw new Error(`Builder API error: ${res.status}`);
		const data = await res.json();
		builderPosts = data.results || [];
	} catch (err: any) {
		return json({ error: `Failed to fetch Builder posts: ${err.message}` }, { status: 500 });
	}

	// 2. Get ingestion status from documents table (non-blocking)
	const ingestionMap = new Map<string, { date: string; chunks: number; title: string }>();
	try {
		const { data: ingestedRows, error: ingErr } = await supabase
			.from('documents')
			.select('source_id, title, created_at')
			.eq('content_type', 'blog_post')
			.eq('source_model', 'blog-articles');

		if (ingErr) {
			console.error('Supabase ingestion query failed:', ingErr.message);
		} else {
			for (const row of ingestedRows || []) {
				const existing = ingestionMap.get(row.source_id);
				if (!existing) {
					ingestionMap.set(row.source_id, { date: row.created_at, chunks: 1, title: row.title || '' });
				} else {
					existing.chunks++;
					if (row.created_at < existing.date) existing.date = row.created_at;
					if (!existing.title && row.title) existing.title = row.title;
				}
			}
		}
	} catch (err: any) {
		console.error('Supabase ingestion query exception:', err.message);
	}

	// 3. Get link counts from document_blog_links (non-blocking)
	const linkCountMap = new Map<string, number>();
	try {
		const { data: linkRows, error: linkErr } = await supabase
			.from('document_blog_links')
			.select('builder_blog_id');

		if (linkErr) {
			console.error('Supabase links query failed:', linkErr.message);
		} else {
			for (const row of linkRows || []) {
				linkCountMap.set(row.builder_blog_id, (linkCountMap.get(row.builder_blog_id) || 0) + 1);
			}
		}
	} catch (err: any) {
		console.error('Supabase links query exception:', err.message);
	}

	// 4. Merge everything
	const builderPostIds = new Set<string>();
	const posts = builderPosts.map((entry: any) => {
		const id = entry.id;
		builderPostIds.add(id);
		const title = entry.data?.title || entry.name || 'Sans titre';
		const handle = entry.data?.handle || entry.data?.slug || id;
		const ingestion = ingestionMap.get(id);

		return {
			id,
			title,
			url: `/histoires/${handle}`,
			publishedDate: entry.lastUpdated || entry.createdDate || null,
			ingested: !!ingestion,
			ingestedDate: ingestion?.date || null,
			ingestedChunks: ingestion?.chunks || 0,
			linkedDocuments: linkCountMap.get(id) || 0
		};
	});

	// 5. Detect orphaned ingested articles (ingested but no longer in Builder)
	const orphanedPosts: { sourceId: string; title: string; chunks: number; ingestedDate: string }[] = [];
	for (const [sourceId, info] of ingestionMap) {
		if (!builderPostIds.has(sourceId)) {
			orphanedPosts.push({
				sourceId,
				title: info.title || `Article inconnu (${sourceId.slice(0, 8)}...)`,
				chunks: info.chunks,
				ingestedDate: info.date
			});
		}
	}

	return json({ posts, orphanedPosts });
};
