import { fetchChroniquesServer } from '$lib/server/builder';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({
	chroniques: await fetchChroniquesServer()
});
