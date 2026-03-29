/**
 * Admin API: POST = ingest a blog post, DELETE = remove ingestion
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PUBLIC_BUILDER_API_KEY } from '$env/static/public';
import { requireAdminApi } from '$lib/server/admin-auth';
import { ingestBlogPost, removeBlogPostIngestion } from '$lib/server/blog-ingest';

/**
 * POST: Fetch the Builder blog post by ID, extract text, chunk, embed, insert.
 */
export const POST: RequestHandler = async ({ params, cookies }) => {
	const authError = requireAdminApi(cookies);
	if (authError) return authError;

	const { id } = params;

	// Fetch the full Builder entry
	const url = new URL(`https://cdn.builder.io/api/v3/content/blog-articles/${id}`);
	url.searchParams.set('apiKey', PUBLIC_BUILDER_API_KEY);
	url.searchParams.set('includeRefs', 'true');

	let entry: any;
	try {
		const res = await fetch(url.toString());
		if (!res.ok) throw new Error(`Builder API returned ${res.status}`);
		entry = await res.json();
	} catch (err: any) {
		return json({ error: `Failed to fetch Builder post: ${err.message}` }, { status: 500 });
	}

	if (!entry || !entry.id) {
		return json({ error: 'Blog post not found in Builder' }, { status: 404 });
	}

	// Remove existing ingestion first (re-ingest scenario)
	try {
		await removeBlogPostIngestion(id);
	} catch {
		// Ignore — may not exist yet
	}

	// Ingest
	try {
		const result = await ingestBlogPost(entry);
		return json(result);
	} catch (err: any) {
		return json({ error: `Ingestion failed: ${err.message}` }, { status: 500 });
	}
};

/**
 * DELETE: Remove all ingested chunks for this blog post.
 */
export const DELETE: RequestHandler = async ({ params, cookies }) => {
	const authError = requireAdminApi(cookies);
	if (authError) return authError;

	const { id } = params;

	try {
		const result = await removeBlogPostIngestion(id);
		return json(result);
	} catch (err: any) {
		return json({ error: err.message }, { status: 500 });
	}
};
