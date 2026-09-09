import { PUBLIC_BUILDER_API_KEY } from '$app/env/public';
import { fetchChroniquesReferencingArticleServer } from '#lib/server/builder.js';
import { extractIdFromUrl } from '#lib/url-utils.js';
import { fetchOneEntry, getBuilderSearchParams } from '@builder.io/sdk-svelte';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
	try {
		const id = extractIdFromUrl(params.id);
		const post = await fetchOneEntry({
			model: 'blog-articles',
			apiKey: PUBLIC_BUILDER_API_KEY,
			options: {
				...getBuilderSearchParams(url.searchParams),
				query: { id }
			}
		});

		return {
			post,
			chroniques: post ? await fetchChroniquesReferencingArticleServer(id) : []
		};
	} catch (error) {
		console.error('Error loading blog post:', error);
		return {
			post: null,
			chroniques: []
		};
	}
};
