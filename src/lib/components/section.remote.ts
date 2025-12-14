import { fetchBuilderContentServer } from '$lib/server/builder';
import { query } from '$app/server';

interface StorySection {
	id: string;
	title: string;
	description: string;
	audioUrl: string;
	year: number;
	tags: string[];
}

const loadSections = async (storySectionsRaw: any[]): Promise<StorySection[]> => {
	try {
		const storySections = storySectionsRaw
			.map((section: any) => ({
				id: section.id,
				title: section.data?.title || '',
				description: section.data?.description || '',
				audioUrl: section.data?.audioUrl || '',
				year: Number(section.data?.year ?? 1800),
				tags: section.data?.tags
			}))
			.sort((a, b) => a.year - b.year);

		return storySections;
	} catch (error) {
		console.error('Error processing sections:', error);
		return [];
	}
}

export const fetchSections = query( async(): Promise<StorySection[] | undefined> => {
	try {
		const storySectionsRaw = await fetchBuilderContentServer('stories', { limit: 100 });
		return loadSections(storySectionsRaw);
	} catch (error) {
		console.error('Error fetching sections:', error);
		return;
	}
})
