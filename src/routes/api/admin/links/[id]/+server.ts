/**
 * Admin API: DELETE a document-blog link
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

	const { error: deleteError } = await supabase
		.from('document_blog_links')
		.delete()
		.eq('id', id);

	if (deleteError) {
		return error(500, deleteError.message);
	}

	return json({ success: true });
};
