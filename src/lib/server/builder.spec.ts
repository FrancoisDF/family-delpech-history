import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchBuilderPersonByIdServer, fetchAllBuilderPeopleServer } from './builder';

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
				data: { personId: 'marie-antoinette-delpech', displayName: 'Marie-Antoinette Delpech', tagId: 'tag-2' }
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
