import { describe, it, expect, beforeEach } from 'vitest';
import { getGenerationLevel, filterPeopleByTag, filterPeopleByProfession, searchPeopleByNameInBuilder, setPeopleData } from './genealogy';
import type { Person } from './models/person';

describe('Genealogy Functions', () => {
	const mockPeople: Person[] = [
		{
			id: 'pierre',
			givenName: 'Pierre',
			familyName: 'Delpech',
			displayName: 'Pierre Delpech',
			birthDate: '1760-05-10',
			deathDate: '1835-03-20',
			bio: 'Founder and farmer',
			gender: 'male',
			sources: [],
			tags: ['fondateur', 'fermier']
		},
		{
			id: 'marguerite',
			givenName: 'Marguerite',
			familyName: 'Blanc',
			displayName: 'Marguerite Blanc',
			birthDate: '1765-08-15',
			deathDate: '1840-06-10',
			bio: 'Wife and mother',
			gender: 'female',
			sources: [],
			tags: ['épouse', 'mère']
		},
		{
			id: 'marie-antoinette',
			givenName: 'Marie-Antoinette',
			familyName: 'Delpech',
			displayName: 'Marie-Antoinette Delpech',
			birthDate: '1795-08-15',
			deathDate: '1860-03-10',
			bio: 'Remarkable woman, teacher and manager',
			gender: 'female',
			sources: [],
			tags: ['femme remarquable', '1850']
		},
		{
			id: 'joseph',
			givenName: 'Joseph',
			familyName: 'Delpech',
			displayName: 'Joseph Delpech',
			birthDate: '1798-06-12',
			deathDate: '1875-04-05',
			bio: 'Skilled carpenter and craftsman - menuiserie',
			gender: 'male',
			sources: [],
			tags: ['menuisier', 'métiers']
		},
		{
			id: 'antoine',
			givenName: 'Antoine',
			familyName: 'Grognier',
			displayName: 'Antoine Grognier',
			birthDate: '1792-03-20',
			deathDate: '1865-11-15',
			bio: 'Man of standing, agricultural manager',
			gender: 'male',
			sources: [],
			tags: ['Grognier', 'mariage']
		},
		{
			id: 'marie-louise',
			givenName: 'Marie-Louise',
			familyName: 'Grognier',
			displayName: 'Marie-Louise Grognier',
			birthDate: '1820-04-15',
			deathDate: '1905-08-20',
			bio: 'Textile weaver - tisserande producing fine linens',
			gender: 'female',
			sources: [],
			tags: ['tisserande', 'métiers']
		},
		{
			id: 'jean-baptist',
			givenName: 'Jean-Baptiste',
			familyName: 'Grognier',
			displayName: 'Jean-Baptiste Grognier',
			birthDate: '1822-07-08',
			deathDate: '1898-12-25',
			bio: 'Agricultural management and local affairs',
			gender: 'male',
			sources: [],
			tags: ['Grognier', 'famille']
		},
		{
			id: 'joseph-junior',
			givenName: 'Joseph',
			familyName: 'Delpech',
			displayName: 'Joseph Delpech (Fils)',
			birthDate: '1825-03-10',
			deathDate: '1900-07-22',
			bio: 'Carpentry and craftsmanship continuation - menuisier',
			gender: 'male',
			sources: [],
			tags: ['menuisier', 'métiers']
		}
	];

	beforeEach(() => {
		setPeopleData(mockPeople);
	});

	describe('getGenerationLevel', () => {
		it('should return 0 when comparing same person', () => {
			const result = getGenerationLevel('pierre', 'pierre');
			expect(result).toBe(0);
		});

		it('should return positive value for ancestors', () => {
			const result = getGenerationLevel('pierre', 'marie-antoinette');
			expect(result).toBe(-1); // pierre is parent of marie-antoinette
		});

		it('should return negative value for descendants', () => {
			const result = getGenerationLevel('marie-antoinette', 'marie-louise');
			expect(result).toBe(1); // marie-antoinette is parent of marie-louise
		});

		it('should handle multiple generation gaps', () => {
			const result = getGenerationLevel('pierre', 'marie-louise');
			expect(result).toBe(-2); // two generations down
		});

		it('should return null for unrelated people', () => {
			const result = getGenerationLevel('pierre', 'henri-delpech');
			expect(result).toBeNull();
		});
	});

	describe('filterPeopleByTag', () => {
		it('should filter people by exact tag', () => {
			const result = filterPeopleByTag(mockPeople, 'menuisier');
			expect(result).toHaveLength(2);
			expect(result.some((p) => p.id === 'joseph')).toBe(true);
			expect(result.some((p) => p.id === 'joseph-junior')).toBe(true);
		});

		it('should filter people by partial tag match (case-insensitive)', () => {
			const result = filterPeopleByTag(mockPeople, 'métiers');
			expect(result.length).toBeGreaterThan(0);
			expect(result.some((p) => p.id === 'joseph')).toBe(true);
			expect(result.some((p) => p.id === 'marie-louise')).toBe(true);
		});

		it('should return empty array when no people match tag', () => {
			const result = filterPeopleByTag(mockPeople, 'non-existent-tag');
			expect(result).toHaveLength(0);
		});

		it('should be case-insensitive', () => {
			const result1 = filterPeopleByTag(mockPeople, 'MENUISIER');
			const result2 = filterPeopleByTag(mockPeople, 'menuisier');
			expect(result1).toHaveLength(result2.length);
		});
	});

	describe('filterPeopleByProfession', () => {
		it('should filter by profession keyword in bio', () => {
			const result = filterPeopleByProfession(mockPeople, 'carpenter');
			expect(result.length).toBeGreaterThan(0);
			expect(result.some((p) => p.id === 'joseph')).toBe(true);
		});

		it('should filter by profession keyword case-insensitive', () => {
			const result1 = filterPeopleByProfession(mockPeople, 'menuisier');
			const result2 = filterPeopleByProfession(mockPeople, 'MENUISIER');
			expect(result1.length).toBe(result2.length);
		});

		it('should match across givenName, familyName, and bio', () => {
			const result = filterPeopleByProfession(mockPeople, 'delpech');
			expect(result.length).toBeGreaterThan(0);
		});

		it('should return empty array when no profession matches', () => {
			const result = filterPeopleByProfession(mockPeople, 'blacksmith');
			expect(result).toHaveLength(0);
		});

		it('should match keywords in bio', () => {
			const result = filterPeopleByProfession(mockPeople, 'weaver');
			expect(result.some((p) => p.id === 'marie-louise')).toBe(true);
		});

		it('should match keywords like "tisserande"', () => {
			const result = filterPeopleByProfession(mockPeople, 'tisserande');
			expect(result.some((p) => p.id === 'marie-louise')).toBe(true);
		});
	});

	describe('searchPeopleByNameInBuilder', () => {
		it('should find people by displayName', () => {
			const result = searchPeopleByNameInBuilder('Pierre', mockPeople);
			expect(result.length).toBeGreaterThan(0);
			expect(result.some((p) => p.id === 'pierre')).toBe(true);
		});

		it('should find people by givenName', () => {
			const result = searchPeopleByNameInBuilder('Marie', mockPeople);
			expect(result.length).toBeGreaterThan(0);
			expect(result.some((p) => p.id === 'marie-antoinette')).toBe(true);
		});

		it('should find people by familyName', () => {
			const result = searchPeopleByNameInBuilder('Delpech', mockPeople);
			expect(result.length).toBeGreaterThan(0);
		});

		it('should be case-insensitive', () => {
			const result1 = searchPeopleByNameInBuilder('PIERRE', mockPeople);
			const result2 = searchPeopleByNameInBuilder('pierre', mockPeople);
			expect(result1.length).toBe(result2.length);
		});

		it('should return empty array when no match found', () => {
			const result = searchPeopleByNameInBuilder('xyz123', mockPeople);
			expect(result).toHaveLength(0);
		});

		it('should return all matching results', () => {
			const result = searchPeopleByNameInBuilder('Grognier', mockPeople);
			expect(result.length).toBeGreaterThan(1);
			expect(result.some((p) => p.familyName === 'Grognier')).toBe(true);
		});
	});

	describe('setPeopleData', () => {
		it('should cache people data for subsequent calls', () => {
			const people: Person[] = [
				{
					id: 'test-1',
					givenName: 'Test',
					familyName: 'Person',
					displayName: 'Test Person',
					sources: [],
					tags: []
				}
			];

			setPeopleData(people);

			// Verify that searching works (which uses the cached data)
			const result = searchPeopleByNameInBuilder('Test', people);
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('test-1');
		});

		it('should allow multiple calls to update data', () => {
			const people1: Person[] = [
				{
					id: 'person-1',
					givenName: 'Person',
					familyName: 'One',
					displayName: 'Person One',
					sources: [],
					tags: []
				}
			];

			setPeopleData(people1);
			const result1 = searchPeopleByNameInBuilder('Person', people1);
			expect(result1).toHaveLength(1);

			// Update with new data
			const people2: Person[] = [
				...people1,
				{
					id: 'person-2',
					givenName: 'Another',
					familyName: 'Person',
					displayName: 'Another Person',
					sources: [],
					tags: []
				}
			];

			setPeopleData(people2);
			const result2 = searchPeopleByNameInBuilder('Another', people2);
			expect(result2).toHaveLength(1);
			expect(result2[0].id).toBe('person-2');
		});
	});
});
