import { fetchResolvedChroniqueByHandleServer } from '#lib/server/builder.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => ({
	chronique: await fetchResolvedChroniqueByHandleServer(params.handle)
});
