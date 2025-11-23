import { fetchBuilderContentByHandleServer, fetchBuilderContentServer } from '$lib/server/builder';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	try {
		// Fetch the main post and the list of articles concurrently
		const [post, allPosts] = await Promise.all([
			fetchBuilderContentByHandleServer('blog-articles', params.handle),
			fetchBuilderContentServer('blog-articles', { limit: 100, preview: true })
		]);

		let relatedArticles: any[] = [];

		relatedArticles = allPosts
			.filter((article: any) => article.data?.handle !== params.handle)
			.slice(0, 6)
			.map((article: any) => ({
				id: article.id,
				title: article.data?.title || '',
				excerpt: article.data?.excerpt || '',
				date: article.data?.date || '',
				readTime: article.data?.readTime || '',
				featuredImage: article.data?.featuredImage,
				category: article.data?.category
			}));

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
