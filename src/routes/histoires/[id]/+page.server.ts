import { fetchBuilderContentByIdServer, fetchBuilderContentServer } from '$lib/server/builder';
import { extractIdFromUrl } from '$lib/url-utils';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	try {
		// Extract the ID from the URL parameter (first 6 characters)
		const id = extractIdFromUrl(params.id);

		// Fetch the main post and the list of articles concurrently
		const [post, relatedArticles] = await Promise.all([
			fetchBuilderContentByIdServer('blog-articles', id),
			fetchBuilderContentServer('blog-articles', { limit: 6, omit: 'data.blocks' })
		]);

		return {
			post: post ?? null,
			relatedArticles
		};
	} catch (error) {
		console.error('Error loading blog post:', error);
		return {
			post: null,
			relatedArticles: []
		};
	}
};
