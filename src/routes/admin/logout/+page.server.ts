import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { clearAdminCookie } from '$lib/server/admin-auth';

export const load: PageServerLoad = async ({ cookies }) => {
	clearAdminCookie(cookies);
	// Also clear legacy cookie that was scoped to /admin
	cookies.delete('admin_session', { path: '/admin' });
	throw redirect(303, '/admin/login');
};
