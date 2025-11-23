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
				urlPath: '/'
			}
		});

		// Helper: inspect the landing page content for a TimelineBlock component

		const blocks = pageContent?.data?.blocks ?? [];

		const hasTimeline =
			Array.isArray(blocks) && blocks.some((b: any) => b?.component?.name === 'TimelineBlock');

		// Only fetch `stories` when the page actually includes a TimelineBlock
		const storySectionsRaw = hasTimeline
			? await fetchBuilderContentServer('stories', { limit: 100 })
			: [];

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
			storySections
		};
	} catch (error) {
		console.error('Error loading page data:', error);
		return {
			pageContent: null,
			storySections: []
		};
	}
};
