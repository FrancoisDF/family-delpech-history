/**
 * Admin API: GET documents that have no links to any blog post
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '$env/static/private';
import { requireAdminApi } from '$lib/server/admin-auth';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const GET: RequestHandler = async ({ cookies }) => {
	const authError = requireAdminApi(cookies);
	if (authError) return authError;

	// Get all source documents
	const { data: allDocs, error: docsErr } = await supabase
		.from('source_documents')
		.select('id, title, created_at')
		.order('created_at', { ascending: false });

	if (docsErr) {
		return json({ error: docsErr.message }, { status: 500 });
	}

	// Get all linked document IDs
	const { data: linkedRows, error: linksErr } = await supabase
		.from('document_blog_links')
		.select('source_document_id');

	if (linksErr) {
		return json({ error: linksErr.message }, { status: 500 });
	}

	const linkedIds = new Set((linkedRows || []).map((r) => r.source_document_id));

	// Filter to unlinked
	const unlinked = (allDocs || []).filter((d) => !linkedIds.has(d.id));

	return json({ documents: unlinked });
};
