/**
 * Admin API: GET impact preview before deleting a document
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '$env/static/private';
import { requireAdminApi } from '$lib/server/admin-auth';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const GET: RequestHandler = async ({ params, cookies }) => {
	const authError = requireAdminApi(cookies);
	if (authError) return authError;

	const { id } = params;

	// Count chunks
	const { count: chunksCount, error: chunksErr } = await supabase
		.from('documents')
		.select('id', { count: 'exact', head: true })
		.eq('source_document_id', id);

	if (chunksErr) {
		return json({ error: chunksErr.message }, { status: 500 });
	}

	// Get linked blog posts
	const { data: links, error: linksErr } = await supabase
		.from('document_blog_links')
		.select('id, builder_blog_id, builder_blog_title, builder_blog_url')
		.eq('source_document_id', id);

	if (linksErr) {
		return json({ error: linksErr.message }, { status: 500 });
	}

	return json({
		chunksCount: chunksCount || 0,
		links: links || []
	});
};
