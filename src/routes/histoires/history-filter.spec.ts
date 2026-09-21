import { describe, expect, it } from 'vitest';
import { _matchesFilters } from './+page.server';
import type { DiscoveryItem } from '#lib/server/builder.js';
import { getYear, sortDiscoveryItems } from '#lib/server/discovery.js';

describe('history discovery filters', () => {
	const filters = { q: '', selectedTags: [], category: '', dateFrom: '', dateTo: '', type: 'all' };

	it('can restrict the combined feed to chroniques', () => {
		const article = {
			id: 'article-1',
			title: 'Article',
			type: 'article' as const
		} as DiscoveryItem;
		const chronique = {
			id: 'chronique-1',
			title: 'Chronique',
			handle: 'chronique',
			introBlocks: [],
			referencedArticles: [],
			type: 'chronique' as const,
			articleCount: 0
		} as DiscoveryItem;

		expect(_matchesFilters(article, { ...filters, type: 'chroniques' })).toBe(false);
		expect(_matchesFilters(chronique, { ...filters, type: 'chroniques' })).toBe(true);
	});

	it('searches fields shared by articles and chroniques', () => {
		const chronique = {
			id: 'chronique-1',
			title: 'Chronique',
			handle: 'famille-delpech',
			excerpt: 'Un récit',
			author: 'Marie',
			referencedArticles: [{ articleId: 'article-1', label: 'Le départ' }],
			introBlocks: [],
			type: 'chronique' as const,
			articleCount: 1
		} as DiscoveryItem;

		expect(_matchesFilters(chronique, { ...filters, q: 'famille-delpech' })).toBe(true);
		expect(_matchesFilters(chronique, { ...filters, q: 'départ' })).toBe(true);
		expect(_matchesFilters(chronique, { ...filters, q: 'marie' })).toBe(true);
	});

	it('supports French editorial years in ranges and facets', () => {
		const article = {
			id: 'article-1',
			title: 'Article',
			date: '12 juin 1904',
			type: 'article'
		} as DiscoveryItem;

		expect(getYear(article.date)).toBe('1904');
		expect(_matchesFilters(article, { ...filters, dateFrom: '1900', dateTo: '1910' })).toBe(true);
	});

	it('sorts dated mixed results before undated results with title tie breaks', () => {
		const items = [
			{ id: 'undated', title: 'Zèbre', type: 'article' },
			{ id: 'old', title: 'Ancien', date: '1900', type: 'article' },
			{ id: 'new', title: 'Nouveau', date: '1910', type: 'chronique', articleCount: 0 },
			{ id: 'same', title: 'Alpha', date: '1910', type: 'article' }
		] as DiscoveryItem[];

		expect(sortDiscoveryItems(items).map((item) => item.id)).toEqual([
			'same',
			'new',
			'old',
			'undated'
		]);
	});
});
