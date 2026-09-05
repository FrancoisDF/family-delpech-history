import { describe, expect, it } from 'vitest';
import { _matchesFilters } from './+page.server';
import type { DiscoveryItem } from '#lib/server/builder.js';

describe('history discovery filters', () => {
	const filters = { q: '', selectedTags: [], category: '', dateFrom: '', dateTo: '' };

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
});
