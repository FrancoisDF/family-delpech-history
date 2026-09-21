import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	fetchBuilderPersonByIdServer,
	fetchAllBuilderPeopleServer,
	fetchResolvedChroniqueByHandleServer,
	fetchChroniquesReferencingArticleServer,
	normalizeBuilderReference,
	normalizeChronique
} from './builder';

// Mock the Builder SDK
vi.mock('@builder.io/sdk-svelte', () => ({
	fetchEntries: vi.fn(),
	fetchOneEntry: vi.fn()
}));

describe('fetchBuilderPersonByIdServer', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should fetch a person by ID from Builder.io', async () => {
		const mockPerson = {
			id: 'person-123',
			data: {
				personId: 'pierre-delpech',
				givenName: 'Pierre',
				familyName: 'Delpech',
				displayName: 'Pierre Delpech',
				tagId: 'tag-123'
			}
		};

		const { fetchEntries } = await import('@builder.io/sdk-svelte');
		vi.mocked(fetchEntries).mockResolvedValue([mockPerson]);

		const result = await fetchBuilderPersonByIdServer('pierre-delpech');

		expect(result).toBeDefined();
		expect(result?.data?.personId).toBe('pierre-delpech');
		expect(fetchEntries).toHaveBeenCalledWith(
			expect.objectContaining({
				model: 'person',
				limit: 1,
				query: { 'data.personId': 'pierre-delpech' }
			})
		);
	});

	it('should return null when person is not found', async () => {
		const { fetchEntries } = await import('@builder.io/sdk-svelte');
		vi.mocked(fetchEntries).mockResolvedValue([]);

		const result = await fetchBuilderPersonByIdServer('non-existent-person');

		expect(result).toBeNull();
	});

	it('should handle errors gracefully', async () => {
		const { fetchEntries } = await import('@builder.io/sdk-svelte');
		vi.mocked(fetchEntries).mockRejectedValue(new Error('API Error'));

		const result = await fetchBuilderPersonByIdServer('pierre-delpech');

		expect(result).toBeNull();
	});
});

describe('fetchAllBuilderPeopleServer', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should fetch all people from Builder.io', async () => {
		const mockPeople = [
			{
				id: 'person-1',
				data: { personId: 'pierre-delpech', displayName: 'Pierre Delpech', tagId: 'tag-1' }
			},
			{
				id: 'person-2',
				data: {
					personId: 'marie-antoinette-delpech',
					displayName: 'Marie-Antoinette Delpech',
					tagId: 'tag-2'
				}
			}
		];

		const { fetchEntries } = await import('@builder.io/sdk-svelte');
		vi.mocked(fetchEntries).mockResolvedValue(mockPeople);

		const result = await fetchAllBuilderPeopleServer();

		expect(result).toHaveLength(2);
		expect(result[0].data?.personId).toBe('pierre-delpech');
		expect(result[1].data?.personId).toBe('marie-antoinette-delpech');
		expect(fetchEntries).toHaveBeenCalledWith(
			expect.objectContaining({
				model: 'person',
				limit: 100
			})
		);
	});

	it('should return empty array on error', async () => {
		const { fetchEntries } = await import('@builder.io/sdk-svelte');
		vi.mocked(fetchEntries).mockRejectedValue(new Error('API Error'));

		const result = await fetchAllBuilderPeopleServer();

		expect(result).toEqual([]);
	});

	it('should return empty array when no people are found', async () => {
		const { fetchEntries } = await import('@builder.io/sdk-svelte');
		vi.mocked(fetchEntries).mockResolvedValue([]);

		const result = await fetchAllBuilderPeopleServer();

		expect(result).toEqual([]);
	});
});

describe('chronique normalization and resolution', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('normalizes Builder reference variants and preserves labels', () => {
		expect(
			normalizeBuilderReference({
				article: { id: 'article-1' },
				navigationLabel: 'Premier article'
			})
		).toEqual({
			articleId: 'article-1',
			label: 'Premier article'
		});
		expect(
			normalizeBuilderReference({ value: { id: 'article-2', data: { title: 'Deuxième article' } } })
		).toEqual({
			articleId: 'article-2',
			label: 'Deuxième article'
		});
	});

	it('normalizes chronique metadata and removes duplicate references', () => {
		const chronique = normalizeChronique({
			id: 'chronique-1',
			data: {
				title: 'Une chronique',
				handle: 'une-chronique',
				introBlocks: [{ component: { name: 'RichTextBlock' } }],
				referencedArticles: [{ id: 'article-1' }, { id: 'article-1' }, { id: 'article-2' }]
			}
		});

		expect(chronique?.referencedArticles.map((reference) => reference.articleId)).toEqual([
			'article-1',
			'article-2'
		]);
		expect(chronique?.introBlocks).toHaveLength(1);
	});

	it('resolves canonical articles in configured reference order', async () => {
		const { fetchEntries, fetchOneEntry } = await import('@builder.io/sdk-svelte');
		vi.mocked(fetchEntries).mockResolvedValue([
			{
				id: 'chronique-1',
				data: {
					title: 'Une chronique',
					handle: 'une-chronique',
					referencedArticles: [{ id: 'article-2' }, { id: 'article-1' }]
				}
			}
		]);
		vi.mocked(fetchOneEntry)
			.mockResolvedValueOnce({ id: 'article-2', data: { title: 'Deux' } })
			.mockResolvedValueOnce({ id: 'article-1', data: { title: 'Un' } });

		const result = await fetchResolvedChroniqueByHandleServer('une-chronique');

		expect(result?.articles.map((entry) => entry.article.id)).toEqual(['article-2', 'article-1']);
	});

	it('keeps references aligned when a referenced article is missing', async () => {
		const { fetchEntries, fetchOneEntry } = await import('@builder.io/sdk-svelte');
		vi.mocked(fetchEntries).mockResolvedValue([
			{
				id: 'chronique-1',
				data: {
					title: 'Une chronique',
					handle: 'une-chronique',
					referencedArticles: [
						{ id: 'missing', navigationLabel: 'Manquant' },
						{ id: 'article-1', navigationLabel: 'Premier' }
					]
				}
			}
		]);
		vi.mocked(fetchOneEntry)
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce({ id: 'article-1', data: { title: 'Un' } });

		const missingReferenceResult = await fetchResolvedChroniqueByHandleServer('une-chronique');

		expect(missingReferenceResult?.articles).toHaveLength(1);
		expect(missingReferenceResult?.articles[0].article.id).toBe('article-1');
		expect(missingReferenceResult?.articles[0].reference.label).toBe('Premier');
	});

	it('finds the single chronique containing an article', async () => {
		const { fetchEntries } = await import('@builder.io/sdk-svelte');
		vi.mocked(fetchEntries).mockResolvedValue([
			{
				id: 'chronique-1',
				data: {
					title: 'Une chronique',
					handle: 'une-chronique',
					referencedArticles: [{ id: 'article-1' }]
				}
			}
		]);

		const result = await fetchChroniquesReferencingArticleServer('article-1');

		expect(result).toHaveLength(1);
		expect(result[0].handle).toBe('une-chronique');
	});

	it('returns every chronique containing an article', async () => {
		const { fetchEntries } = await import('@builder.io/sdk-svelte');
		vi.mocked(fetchEntries).mockResolvedValue([
			{
				id: 'chronique-1',
				data: { referencedArticles: [{ id: 'article-1' }] }
			},
			{
				id: 'chronique-2',
				data: { referencedArticles: [{ id: 'article-1' }] }
			}
		]);

		const result = await fetchChroniquesReferencingArticleServer('article-1');

		expect(result.map((chronique) => chronique.id)).toEqual(['chronique-1', 'chronique-2']);
	});

	it('returns no chroniques when an article is not referenced', async () => {
		const { fetchEntries } = await import('@builder.io/sdk-svelte');
		vi.mocked(fetchEntries).mockResolvedValue([
			{
				id: 'chronique-1',
				data: { referencedArticles: [{ id: 'article-2' }] }
			}
		]);

		expect(await fetchChroniquesReferencingArticleServer('article-1')).toEqual([]);
	});
});
