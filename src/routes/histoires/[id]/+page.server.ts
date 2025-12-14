import { fetchArticleById, fetchArticles } from '$lib/components/article.remote';
import { extractIdFromUrl } from '$lib/url-utils';
import type { PageServerLoad } from './$types';


function extractTagsId(tags: any[]) {
	return tags.map((item) => { 
		return item.tag.id;
	});
}


export const load: PageServerLoad = async ({ params }) => {
	try {
		// Extract the ID from the URL parameter (first 6 characters)
		const id: string = extractIdFromUrl(params.id);

		// Fetch the main post and the list of articles concurrently
		const [post, relatedArticlesAll] = await Promise.all([
			fetchArticleById(id),
			fetchArticles()
		]);

		const tags = extractTagsId(post?.data?.tags || []);
		const relatedArticles = relatedArticlesAll.filter((article) => {
				if (article.id === post?.id) return false;
				const articleTags = extractTagsId(article.tags || []);
				return tags.some((tag) => articleTags.includes(tag));
			})

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
