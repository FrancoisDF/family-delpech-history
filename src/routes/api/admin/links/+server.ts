/**
 * Admin API: CRUD for document_blog_links
 * GET  — list all links
 * POST — create a new link
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '$env/static/private';
import { requireAdminApi } from '$lib/server/admin-auth';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const GET: RequestHandler = async ({ cookies }) => {
	const authError = requireAdminApi(cookies);
	if (authError) return authError;
	const { data, error: fetchError } = await supabase
		.from('document_blog_links')
		.select(`
			id,
			source_document_id,
			builder_blog_id,
			builder_blog_title,
			builder_blog_url,
			created_at,
			source_documents (id, title)
		`)
		.order('created_at', { ascending: false });

	if (fetchError) {
		return error(500, fetchError.message);
	}

	return json({ links: data });
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	const authError = requireAdminApi(cookies);
	if (authError) return authError;
	const body = await request.json();
	const { source_document_id, builder_blog_id, builder_blog_title, builder_blog_url } = body;

	if (!source_document_id || !builder_blog_id) {
		return error(400, 'source_document_id and builder_blog_id are required');
	}

	const { data, error: insertError } = await supabase
		.from('document_blog_links')
		.insert({
			source_document_id,
			builder_blog_id,
			builder_blog_title: builder_blog_title || null,
			builder_blog_url: builder_blog_url || null
		})
		.select()
		.single();

	if (insertError) {
		if (insertError.code === '23505') {
			return error(409, 'This link already exists');
		}
		return error(500, insertError.message);
	}

	return json({ link: data });
};
