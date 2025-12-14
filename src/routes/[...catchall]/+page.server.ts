import type { PageServerLoad } from './$types';
import { fetchOneEntry, getBuilderSearchParams } from '@builder.io/sdk-svelte';
import { PUBLIC_BUILDER_API_KEY } from '$env/static/public';

export const load: PageServerLoad = async (event) => {
	try {
		// Fetch landing page first so we can decide whether to load stories
		const pageContent = await fetchOneEntry({
			model: 'page',
			apiKey: PUBLIC_BUILDER_API_KEY,
			options: getBuilderSearchParams(event.url.searchParams),
			userAttributes: {
				urlPath: event.params.catchall ? `/${event.params.catchall}` : '/'
			}
		});

		return {
			pageContent
		};
		
	} catch (error) {
		console.error('Error loading page data:', error);
		return {
			pageContent: null,
		};
	}
};
