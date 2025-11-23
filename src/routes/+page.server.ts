import { fetchBuilderContentServer } from '$lib/server/builder';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	try {
		const landingPageContent = await fetchBuilderContentServer('landing-page', {
			limit: 1
		});

		const storySections = await fetchBuilderContentServer('story-section', {
			limit: 100
		});

		return {
			landingPage: landingPageContent[0] || null,
			storySections: storySections.map((section: any) => ({
				id: section.id,
				title: section.data?.title || '',
				description: section.data?.description || '',
				audioUrl: section.data?.audioUrl || '',
				year: section.data?.year || 1800
			}))
		};
	} catch (error) {
		console.error('Error loading page data:', error);
		return {
			landingPage: null,
			storySections: []
		};
	}
};
