import { fetchBuilderContentServer } from '$lib/server/builder';
import type { PageServerLoad } from './$types';
import { fetchOneEntry, getBuilderSearchParams } from '@builder.io/sdk-svelte';
import { PUBLIC_BUILDER_API_KEY } from '$env/static/public';

export const load: PageServerLoad = async (event) => {
	try {
		// Fetch landing page first so we can decide whether to load stories
		const pageContent = await fetchOneEntry({
			model: 'page',
			apiKey: PUBLIC_BUILDER_API_KEY,
			options: getBuilderSearchParams(event.url.searchParams),
			userAttributes: {
				urlPath: event.params.catchall ? `/${event.params.catchall}` : '/'
			}
		});

		// Helper: inspect the landing page content for a TimelineBlock component
		const blocks = pageContent?.data?.blocks ?? [];

		const hasTimeline =
			Array.isArray(blocks) && blocks.some((b: any) => b?.component?.name === 'TimelineBlock');
		const hasBlogGrid =
			Array.isArray(blocks) && blocks.some((b: any) => b?.component?.name === 'BlogGridBlock');

		// Only fetch `stories` when the page actually includes a TimelineBlock
		const [storySectionsRaw, blogArticles] = await Promise.all([
			hasTimeline ? fetchBuilderContentServer('stories', { limit: 100 }) : Promise.resolve([]),
			hasBlogGrid ? fetchBuilderContentServer('blog-articles', { limit: 100 }) : Promise.resolve([])
		]);

		const storySections = storySectionsRaw
			.map((section: any) => ({
				id: section.id,
				title: section.data?.title || '',
				description: section.data?.description || '',
				audioUrl: section.data?.audioUrl || '',
				year: Number(section.data?.year ?? 1800)
			}))
			.sort((a, b) => a.year - b.year);

		return {
			pageContent,
			storySections,
			blogArticles: blogArticles.map((post: any) => ({
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
			}))
		};
	} catch (error) {
		console.error('Error loading page data:', error);
		return {
			pageContent: null,
			storySections: [],
			blogArticles: []
		};
	}
};
