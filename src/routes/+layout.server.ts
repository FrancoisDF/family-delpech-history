import { fetchBuilderContentServer } from '$lib/server/builder';
import type { LayoutServerLoad } from './$types';

// Ensure all routes use trailing slashes (e.g. `/about/`)
export const trailingSlash = 'always';

export const load: LayoutServerLoad = async () => {
	try {
		const siteConfigContent = await fetchBuilderContentServer('site-config', {
			limit: 1
		});

		const config = siteConfigContent[0]?.data || null;

		return {
			siteConfig: config
		};
	} catch (error) {
		console.error('Error loading site configuration:', error);
		return {
			siteConfig: null
		};
	}
};
