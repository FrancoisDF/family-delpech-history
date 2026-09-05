import { fetchResolvedChroniqueByHandleServer } from '$lib/server/builder';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => ({
	chronique: await fetchResolvedChroniqueByHandleServer(params.handle)
});
