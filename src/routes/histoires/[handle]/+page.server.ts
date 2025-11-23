import { fetchBuilderContentByHandleServer, fetchBuilderContentServer } from '$lib/server/builder';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const post = await fetchBuilderContentByHandleServer('blog-articles', params.handle);

		let relatedArticles: any[] = [];

		if (post) {
			const allPosts = await fetchBuilderContentServer('blog-articles', {
				limit: 100,
				preview: true
			});

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
				post,
				relatedArticles
			};
		}

		return {
			post: null,
			relatedArticles: []
		};
	} catch (error) {
		console.error('Error loading blog post:', error);
		return {
			post: null,
			relatedArticles: []
		};
	}
};
