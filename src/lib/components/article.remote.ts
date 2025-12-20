import * as v from 'valibot';
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
	tags?: any[];
}

function formatArticles(articles: any[]): BlogArticle[] {
	return articles.map((post: any) => ({
		id: post.id,
		...post.data
	}))
}

export const fetchArticleById = query(v.string(), async (id: string): Promise<BlogArticle | null> => {
	try {
		return await fetchBuilderContentByIdServer('blog-articles', id);
	} catch (error) {
		console.error('Error fetching article by id:', error);
		return null;
	}
})


export const fetchArticles = query( async (): Promise<BlogArticle[]> => {
	try {
		const articlesRaw = await fetchBuilderContentServer('blog-articles', {
			limit: 100,
			omit: 'data.blocks, meta, folders, variations',
		});
		return formatArticles(articlesRaw);
	} catch (error) {
		console.error('Error fetching articles:', error);
		return [];
	}
})

export const fetchArticlesByTags = query(v.array(v.string()), async (tagIds: string[]): Promise<BlogArticle[]> => {
	try {
		if (!tagIds || tagIds.length === 0) {
			return [];
		}

		const articlesRaw = await fetchBuilderContentServer('blog-articles', {
			limit: 100,
			omit: 'data.blocks, meta, folders, variations',
			query: {
				'data.tags.tag.id': { $in: tagIds }
			}
		});
		return formatArticles(articlesRaw);
	} catch (error) {
		console.error('Error fetching articles by tags:', error);
		return [];
	}
})

export const fetchRelatedArticles = query( async (): Promise<BlogArticle[]> => {
	try {
		const articlesRaw = await fetchBuilderContentServer('blog-articles', {
			limit: 100,
			omit: 'data.blocks, meta, folders, variations',
		});
		return formatArticles(articlesRaw);
	} catch (error) {
		console.error('Error fetching related articles:', error);
		return [];
	}
})
