import {
	normalizeBlogArticle,
	type BlogArticle,
	type Chronique,
	type DiscoveryItem
} from './builder.js';

export interface DiscoveryFilters {
	q: string;
	selectedTags: string[];
	category: string;
	dateFrom: string;
	dateTo: string;
	type: string;
}

export interface DiscoveryFacets {
	allTags: Array<{ id: string; label: string }>;
	allCategories: string[];
	allYears: string[];
}

interface TagValue {
	id?: string;
	label?: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
	return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function asText(value: unknown): string | undefined {
	return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function getTagValue(tagItem: unknown): TagValue {
	const item = asRecord(tagItem);
	const rawTag = asRecord(item?.tag) || item;
	const value = asRecord(rawTag?.value);
	const valueData = asRecord(value?.data);

	return {
		id: asText(rawTag?.id) || asText(value?.id) || asText(valueData?.id),
		label:
			asText(valueData?.label) ||
			asText(valueData?.name) ||
			asText(value?.name) ||
			asText(rawTag?.label) ||
			asText(rawTag?.name) ||
			asText(item?.label)
	};
}

export function getYear(date?: string): string | undefined {
	if (!date) return undefined;
	const explicitYear = date.match(/\b(1[5-9]\d{2}|20\d{2})\b/);
	if (explicitYear) return explicitYear[1];

	const timestamp = Date.parse(date);
	return Number.isNaN(timestamp) ? undefined : new Date(timestamp).getFullYear().toString();
}

function getDateValue(date?: string): number | undefined {
	const year = getYear(date);
	if (!year) return undefined;
	const timestamp = date ? Date.parse(date) : NaN;
	return Number.isNaN(timestamp) ? Number(year) : timestamp;
}

function getTagValues(item: DiscoveryItem): TagValue[] {
	return (Array.isArray(item.tags) ? item.tags : []).map(getTagValue);
}

function getSearchText(item: DiscoveryItem): string {
	const fields = [item.title, item.excerpt, item.category, item.author];
	if (item.type === 'chronique') {
		fields.push(item.handle);
		fields.push(
			...item.referencedArticles.flatMap((reference) => [reference.label, reference.articleId])
		);
	}
	fields.push(...getTagValues(item).map((tag) => tag.label));
	return fields.filter(Boolean).join(' ').toLocaleLowerCase();
}

export function buildDiscoveryItems(
	articlesRaw: Array<{ id?: string; name?: string; data?: Record<string, unknown> }>,
	chroniques: Chronique[]
): DiscoveryItem[] {
	const articleItems = articlesRaw.flatMap((entry) => {
		const article = normalizeBlogArticle(entry);
		return article ? [{ ...article, type: 'article' as const }] : [];
	});
	const chroniqueItems = chroniques.map((chronique) => ({
		...chronique,
		type: 'chronique' as const,
		articleCount: chronique.referencedArticles.length
	}));
	return [...articleItems, ...chroniqueItems];
}

export function getDiscoveryFacets(items: DiscoveryItem[]): DiscoveryFacets {
	const allTagsMap = new Map<string, string>();
	const allCategoriesSet = new Set<string>();
	const allYearsSet = new Set<string>();

	for (const item of items) {
		if (item.category) allCategoriesSet.add(item.category);
		const year = getYear(item.date);
		if (year) allYearsSet.add(year);
		for (const tag of getTagValues(item)) {
			if (tag.id && tag.label && !allTagsMap.has(tag.id)) allTagsMap.set(tag.id, tag.label);
		}
	}

	return {
		allTags: Array.from(allTagsMap.entries())
			.map(([id, label]) => ({ id, label }))
			.sort((a, b) => a.label.localeCompare(b.label)),
		allCategories: Array.from(allCategoriesSet).sort((a, b) => a.localeCompare(b)),
		allYears: Array.from(allYearsSet).sort().reverse()
	};
}

export function matchesDiscoveryFilters(item: DiscoveryItem, filters: DiscoveryFilters): boolean {
	if (filters.type === 'articles' && item.type !== 'article') return false;
	if (filters.type === 'chroniques' && item.type !== 'chronique') return false;

	const tagValues = getTagValues(item);
	const matchesSearch = !filters.q || getSearchText(item).includes(filters.q.toLocaleLowerCase());
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

export function sortChroniques(chroniques: Chronique[]): Chronique[] {
	return [...chroniques].sort((a, b) => {
		const yearA = getYear(a.date);
		const yearB = getYear(b.date);
		if (yearA && yearB && yearA !== yearB) return yearB.localeCompare(yearA);
		if (yearA && !yearB) return -1;
		if (!yearA && yearB) return 1;
		return a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' });
	});
}

export function sortDiscoveryItems(items: DiscoveryItem[]): DiscoveryItem[] {
	return [...items].sort((a, b) => {
		const dateA = getDateValue(a.date);
		const dateB = getDateValue(b.date);
		if (dateA !== undefined && dateB !== undefined && dateA !== dateB) return dateB - dateA;
		if (dateA !== undefined && dateB === undefined) return -1;
		if (dateA === undefined && dateB !== undefined) return 1;
		const titleComparison = a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' });
		return titleComparison || a.type.localeCompare(b.type);
	});
}
