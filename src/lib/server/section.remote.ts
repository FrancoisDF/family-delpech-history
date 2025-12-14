import { fetchBuilderContentServer, type BuilderContent } from '$lib/server/builder';
import { query } from '$app/server';

export const fetchSections = query( async(): Promise<BuilderContent[] | undefined> => {
	try {
		return await fetchBuilderContentServer('stories', { limit: 100 });
	} catch (error) {
		console.error('Error fetching sections:', error);
		return;
	}
})
