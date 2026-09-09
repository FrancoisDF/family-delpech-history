import { fetchChroniquesServer } from '#lib/server/builder.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({
	chroniques: await fetchChroniquesServer()
});
