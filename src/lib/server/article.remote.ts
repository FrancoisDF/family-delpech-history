import { query } from '$app/server';
import { fetchBuilderContentServer, fetchBuilderContentByIdServer } from '$lib/server/builder';

interface BlogArticle {
	id: string;
	title: string;
	excerpt: string;
	date: string;
	readTime: string;
	featuredImage?: string;
	category?: string;
	slug: string;
	content?: unknown;
	author?: string;
}

function formatArticles(articles: any[]): BlogArticle[] {
	return articles.map((post: any) => ({
		id: post.id,
		title: post.data?.title || '',
		excerpt: post.data?.excerpt || '',
		date: post.data?.date || '',
		readTime: post.data?.readTime || '',
		featuredImage: post.data?.featuredImage,
		category: post.data?.category,
		slug: post.name,
		content: post.data?.content,
		author: post.data?.author
	}));
}

export const fetchArticles = query(async (limit: number = 100): Promise<BlogArticle[]> => {
	try {
		const articlesRaw = await fetchBuilderContentServer('blog-articles', { limit });
		return formatArticles(articlesRaw);
	} catch (error) {
		console.error('Error fetching articles:', error);
		return [];
	}
})

export const fetchArticleById = query(async (id: string): Promise<BlogArticle | null> => {
	try {
		const post = await fetchBuilderContentByIdServer('blog-articles', id);
		if (!post) return null;
		const formatted = formatArticles([post]);
		return formatted[0] || null;
	} catch (error) {
		console.error('Error fetching article by id:', error);
		return null;
	}
})

export const fetchRelatedArticles = query(async (limit: number = 6): Promise<BlogArticle[]> => {
	try {
		const articlesRaw = await fetchBuilderContentServer('blog-articles', {
			limit,
			omit: 'data.blocks'
		});
		return formatArticles(articlesRaw);
	} catch (error) {
		console.error('Error fetching related articles:', error);
		return [];
	}
})
