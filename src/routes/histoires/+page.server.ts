import { fetchBuilderContentServer } from '$lib/server/builder';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	try {
		// Fetch blog section configuration
		const blogSectionContent = await fetchBuilderContentServer('blog-section', {
			limit: 1
		});

		// Fetch blog posts from the blog-articles model
		const blogPosts = await fetchBuilderContentServer('blog-articles', {
			limit: 100,
			preview: true
		});

		return {
			blogSection: blogSectionContent[0] || null,
			blogPosts: blogPosts.map((post: any) => ({
				id: post.id,
				title: post.data?.title || '',
				excerpt: post.data?.excerpt || '',
				date: post.data?.date || '',
				readTime: post.data?.readTime || '',
				featuredImage: post.data?.featuredImage,
				category: post.data?.category,
				slug: post.name,
				handle: post.data?.handle || post.name,
				content: post.data?.content,
				author: post.data?.author
			}))
		};
	} catch (error) {
		console.error('Error loading blog posts:', error);
		return {
			blogSection: null,
			blogPosts: []
		};
	}
};
