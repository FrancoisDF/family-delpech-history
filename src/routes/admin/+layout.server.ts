import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { isAdminEnabled, hasValidAdminSession } from '$lib/server/admin-auth';

export const load: LayoutServerLoad = async ({ cookies, url }) => {
	// Kill switch: if admin is disabled, return 404 for everything
	if (!isAdminEnabled()) {
		throw error(404, 'Not found');
	}

	// Allow the login page through without a session
	if (url.pathname === '/admin/login') {
		return { authenticated: false };
	}

	// Check session cookie
	if (!hasValidAdminSession(cookies)) {
		throw redirect(303, '/admin/login');
	}

	return { authenticated: true };
};
