import { fetchChroniquesServer } from '#lib/server/builder.js';
import { sortChroniques } from '#lib/server/discovery.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({
	chroniques: sortChroniques(await fetchChroniquesServer())
});
