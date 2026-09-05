import {
	fetchBuilderContentServer,
	fetchChroniquesServer,
	normalizeBlogArticle,
	type DiscoveryItem
} from '$lib/server/builder';
import type { PageServerLoad } from './$types';

function getTagValue(tagItem: unknown): { id?: string; label?: string } {
	if (!tagItem || typeof tagItem !== 'object') return {};
	const tag = (tagItem as Record<string, unknown>).tag;
	if (!tag || typeof tag !== 'object') return {};
	const rawTag = tag as Record<string, unknown>;
	const value = rawTag.value && typeof rawTag.value === 'object' ? (rawTag.value as Record<string, unknown>) : null;
	const valueData = value?.data && typeof value.data === 'object' ? (value.data as Record<string, unknown>) : null;
	return {
		id: typeof rawTag.id === 'string' ? rawTag.id : undefined,
		label:
			(typeof valueData?.label === 'string' && valueData.label) ||
			(typeof value?.name === 'string' && value.name) ||
			(typeof rawTag.label === 'string' && rawTag.label) ||
			undefined
	};
}

function getYear(date?: string): string | undefined {
	if (!date) return undefined;
	const timestamp = Date.parse(date);
	if (Number.isNaN(timestamp)) return undefined;
	return new Date(timestamp).getFullYear().toString();
}

function matchesFilters(
	item: DiscoveryItem,
	filters: { q: string; selectedTags: string[]; category: string; dateFrom: string; dateTo: string; type: string }
): boolean {
	if (filters.type === 'articles' && item.type !== 'article') return false;
	if (filters.type === 'chroniques' && item.type !== 'chronique') return false;

	const tagItems = Array.isArray(item.tags) ? item.tags : [];
	const tagValues = tagItems.map(getTagValue);
	const matchesSearch =
		!filters.q ||
		item.title.toLowerCase().includes(filters.q) ||
		(item.excerpt || '').toLowerCase().includes(filters.q) ||
		tagValues.some((tag) => tag.label?.toLowerCase().includes(filters.q));
	const matchesTags =
		filters.selectedTags.length === 0 ||
		tagValues.some((tag) => tag.id && filters.selectedTags.includes(tag.id));
	const matchesCategory = !filters.category || item.category === filters.category;

	const itemYear = getYear(item.date);
	const matchesDateRange =
		(!filters.dateFrom || (itemYear !== undefined && itemYear >= filters.dateFrom)) &&
		(!filters.dateTo || (itemYear !== undefined && itemYear <= filters.dateTo));

	return matchesSearch && matchesTags && matchesCategory && matchesDateRange;
}

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q')?.toLowerCase() || '';
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

	const articleItems: DiscoveryItem[] = articlesRaw.flatMap((entry) => {
		const article = normalizeBlogArticle(entry);
		return article ? [{ ...article, type: 'article' as const }] : [];
	});
	const chroniqueItems: DiscoveryItem[] = chroniques.map((chronique) => ({
		...chronique,
		type: 'chronique' as const,
		articleCount: chronique.referencedArticles.length
	}));
	const allItems = [...articleItems, ...chroniqueItems];

	const allTagsMap = new Map<string, string>();
	const allCategoriesSet = new Set<string>();
	const allYearsSet = new Set<string>();
	for (const item of allItems) {
		if (item.category) allCategoriesSet.add(item.category);
		const year = getYear(item.date);
		if (year) allYearsSet.add(year);
		for (const tag of Array.isArray(item.tags) ? item.tags.map(getTagValue) : []) {
			if (tag.id && tag.label && (!allTagsMap.has(tag.id) || allTagsMap.get(tag.id) === 'Unknown Tag')) {
				allTagsMap.set(tag.id, tag.label);
			}
		}
	}

	const allTags = Array.from(allTagsMap.entries())
		.map(([id, label]) => ({ id, label }))
		.sort((a, b) => a.label.localeCompare(b.label));
	const allCategories = Array.from(allCategoriesSet).sort();
	const allYears = Array.from(allYearsSet).sort().reverse();
	const items = allItems.filter((item) =>
		matchesFilters(item, { q, selectedTags, category, dateFrom, dateTo, type })
	);

	return {
		items,
		articles: items,
		allTags,
		allCategories,
		allYears,
		params: { q, tags: selectedTags, category, dateFrom, dateTo, type }
	};
};
