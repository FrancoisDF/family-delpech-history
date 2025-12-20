import { PUBLIC_BUILDER_API_KEY } from '$env/static/public';
import { fetchArticleById, fetchArticlesByTags } from '$lib/components/article.remote';
import { extractIdFromUrl } from '$lib/url-utils';
import { fetchOneEntry, getBuilderSearchParams } from '@builder.io/sdk-svelte';
import type { PageServerLoad } from './$types';


export const load: PageServerLoad = async ({ params, url }) => {
	try {
		// Extract the ID from the URL parameter (first 6 characters)
		const id = extractIdFromUrl(params.id);
		const post = await fetchOneEntry({
			model: 'blog-articles',
			apiKey: PUBLIC_BUILDER_API_KEY,
			options: {
				...getBuilderSearchParams(url.searchParams),
				query: {
					id: id
				}
			}
		});
		
		return {
			post
		};
	} catch (error) {
		console.error('Error loading blog post:', error);
		return {
			post: null,
		};
	}
};
