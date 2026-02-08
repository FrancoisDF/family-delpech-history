import type { PageServerLoad } from './$types';
import { fetchBuilderContentServer } from '$lib/server/builder';

interface BlogArticle {
	id: string;
	title: string;
	excerpt: string;
	date: string;
	readTime: string;
	featuredImage?: string;
	category?: string;
	slug: string;
	content?: unknown;
	author?: string;
	tags?: any[];
}

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q')?.toLowerCase() || '';
	const tagsParam = url.searchParams.get('tags');
	const selectedTags = tagsParam ? tagsParam.split(',') : [];
	const dateFromParam = url.searchParams.get('dateFrom');
	const dateToParam = url.searchParams.get('dateTo');
	const categoryParam = url.searchParams.get('category');

	// Fetch all articles
	const articlesRaw = await fetchBuilderContentServer('blog-articles', {
		limit: 100,
		omit: 'data.blocks, meta, folders, variations'
	});

	const articles: BlogArticle[] = articlesRaw.map((post: any) => ({
		id: post.id,
		...post.data
	}));

	// Extract all available tags, categories, and years
	const allTagsMap = new Map<string, string>();
	const allCategoriesSet = new Set<string>();
	const allYearsSet = new Set<string>();
	
	articles.forEach((article) => {
		// Collect categories
		if (article.category) {
			allCategoriesSet.add(article.category);
		}

		// Collect years from dates
		if (article.date) {
			try {
				const year = new Date(article.date).getFullYear().toString();
				if (!isNaN(parseInt(year))) {
					allYearsSet.add(year);
				}
			} catch (e) {
				// Skip invalid dates
			}
		}

		// Collect tags
		if (Array.isArray(article.tags)) {
			article.tags.forEach((tagItem: any) => {
				// Structure is typically { tag: { id: "...", value: { data: { label: "..." }, ... } } }
				const tagRef = tagItem.tag;
				if (tagRef && tagRef.id) {
					// Try to find a label
					const label = 
						tagRef.value?.data?.label || 
						tagRef.value?.name || 
						tagRef.label || // sometimes directly on ref if customized
						'Unknown Tag'; 
					
					// Only add if we have a valid ID. 
					// Note: If multiple tags have same ID but different labels (unlikely), we overwrite.
					// We prefer the one with a label.
					if (!allTagsMap.has(tagRef.id) || allTagsMap.get(tagRef.id) === 'Unknown Tag') {
                         if (label !== 'Unknown Tag' || !allTagsMap.has(tagRef.id)) {
                             allTagsMap.set(tagRef.id, label);
                         }
					}
				}
			});
		}
	});

	const allTags = Array.from(allTagsMap.entries())
        .map(([id, label]) => ({ id, label }))
        .sort((a, b) => a.label.localeCompare(b.label));

	const allCategories = Array.from(allCategoriesSet).sort();
	const allYears = Array.from(allYearsSet).sort().reverse(); // Newest first

	// Filter articles
	const filteredArticles = articles.filter((article) => {
		// Text Search
		const matchesSearch = !q || (
			(article.title?.toLowerCase().includes(q)) ||
			(article.excerpt?.toLowerCase().includes(q)) ||
			(article.tags?.some((t: any) => {
				const label = t.tag?.value?.data?.label || t.tag?.value?.name;
				return label?.toLowerCase().includes(q);
			}))
		);

		// Tag Filter
		const matchesTags = selectedTags.length === 0 || (
			article.tags?.some((t: any) => selectedTags.includes(t.tag?.id))
		);

		// Category Filter
		const matchesCategory = !categoryParam || article.category === categoryParam;

		// Date Range Filter (year only)
		let matchesDateRange = true;
		if (dateFromParam || dateToParam) {
			try {
				const articleYear = new Date(article.date).getFullYear();
				const fromYear = dateFromParam ? parseInt(dateFromParam) : null;
				const toYear = dateToParam ? parseInt(dateToParam) : null;

				if (fromYear && articleYear < fromYear) {
					matchesDateRange = false;
				}
				if (toYear && articleYear > toYear) {
					matchesDateRange = false;
				}
			} catch (e) {
				matchesDateRange = false;
			}
		}

		return matchesSearch && matchesTags && matchesCategory && matchesDateRange;
	});

	return {
		articles: filteredArticles,
		allTags,
		allCategories,
		allYears,
		params: {
			q,
			tags: selectedTags,
			category: categoryParam || '',
			dateFrom: dateFromParam || '',
			dateTo: dateToParam || ''
		}
	};
};
