import { extractIdFromUrl } from '$lib/url-utils';
import type { PageServerLoad } from './$types';
import { fetchArticleById, fetchRelatedArticles } from '../article.remote';

export const load: PageServerLoad = async ({ params }) => {
	try {
		// Extract the ID from the URL parameter (first 6 characters)
		const id = extractIdFromUrl(params.id);

		// Fetch the main post and the list of articles concurrently
		const [post, relatedArticles] = await Promise.all([
			fetchArticleById(id),
			fetchRelatedArticles(6)
		]);

		return {
			post,
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
