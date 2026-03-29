/**
 * Admin API: DELETE a source document and its chunks
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '$env/static/private';
import { requireAdminApi } from '$lib/server/admin-auth';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const DELETE: RequestHandler = async ({ params, cookies }) => {
	const authError = requireAdminApi(cookies);
	if (authError) return authError;
	const { id } = params;

	// 1. Delete associated links
	const { error: linksError } = await supabase
		.from('document_blog_links')
		.delete()
		.eq('source_document_id', id);

	if (linksError) {
		console.error('Failed to delete links:', linksError.message);
	}

	// 2. Delete chunks (they reference source_document_id)
	const { error: chunksError } = await supabase
		.from('documents')
		.delete()
		.eq('source_document_id', id);

	if (chunksError) {
		console.error('Failed to delete chunks:', chunksError.message);
	}

	// 3. Delete the source document
	const { error: docError } = await supabase
		.from('source_documents')
		.delete()
		.eq('id', id);

	if (docError) {
		return error(500, docError.message);
	}

	return json({ success: true });
};
