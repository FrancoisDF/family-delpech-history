import { fetchBuilderContentByHandleServer, fetchBuilderContentServer } from '$lib/server/builder';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	try {
		// Fetch the main post and the list of articles concurrently
		const [post, relatedArticles] = await Promise.all([
			fetchBuilderContentByHandleServer('blog-articles', params.handle),
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
