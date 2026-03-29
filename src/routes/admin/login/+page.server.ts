import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { verifyAdminPassword, setAdminCookie, hasValidAdminSession } from '$lib/server/admin-auth';

export const load: PageServerLoad = async ({ cookies }) => {
	// If already authenticated, redirect to admin
	if (hasValidAdminSession(cookies)) {
		throw redirect(303, '/admin');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const password = formData.get('password');

		if (!password || typeof password !== 'string') {
			return fail(400, { error: 'Mot de passe requis.' });
		}

		if (!verifyAdminPassword(password)) {
			return fail(401, { error: 'Mot de passe incorrect.' });
		}

		setAdminCookie(cookies);
		throw redirect(303, '/admin');
	}
};
