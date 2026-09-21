import {
	fetchBuilderContentServer,
	fetchChroniquesServer,
	type DiscoveryItem
} from '#lib/server/builder.js';
import {
	buildDiscoveryItems,
	getDiscoveryFacets,
	matchesDiscoveryFilters,
	sortDiscoveryItems,
	type DiscoveryFilters
} from '#lib/server/discovery.js';
import type { PageServerLoad } from './$types';

export function _matchesFilters(item: DiscoveryItem, filters: DiscoveryFilters): boolean {
	return matchesDiscoveryFilters(item, filters);
}

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim() || '';
	const tagsParam = url.searchParams.get('tags');
	const selectedTags = tagsParam ? tagsParam.split(',').filter(Boolean) : [];
	const dateFrom = url.searchParams.get('dateFrom') || '';
	const dateTo = url.searchParams.get('dateTo') || '';
	const category = url.searchParams.get('category') || '';
	const type = url.searchParams.get('type') || 'all';

	const [articlesRaw, chroniques] = await Promise.all([
		fetchBuilderContentServer('blog-articles', {
			limit: 100,
			omit: 'data.blocks, meta, folders, variations'
		}),
		fetchChroniquesServer()
	]);

	const allItems = buildDiscoveryItems(articlesRaw, chroniques);
	const facets = getDiscoveryFacets(allItems);
	const items = sortDiscoveryItems(
		allItems.filter((item) =>
			matchesDiscoveryFilters(item, { q, selectedTags, category, dateFrom, dateTo, type })
		)
	);

	return {
		items,
		articles: items,
		...facets,
		params: { q, tags: selectedTags, category, dateFrom, dateTo, type }
	};
};
