import type { Person } from './models/person';

/**
 * GEDCOM data cache - stores pre-computed genealogy data
 * Data is generated at build time from static GEDCOM file
 */
let _peopleCached: Person[] | null = null;
let _loadingPromise: Promise<Person[]> | null = null;

/**
 * Load GEDCOM people data from static JSON
 * Cached in memory after first load
 */
async function loadGEDCOMData(): Promise<Person[]> {
	if (_peopleCached) {
		return _peopleCached;
	}

	// Return existing promise if already loading
	if (_loadingPromise) {
		return _loadingPromise;
	}

	_loadingPromise = (async () => {
		try {
			const response = await fetch('/genealogy-data.json');
			if (!response.ok) {
				console.warn('Failed to load genealogy data:', response.status);
				return [];
			}

			const data = (await response.json()) as { people: Person[] };
			_peopleCached = data.people || [];
			return _peopleCached;
		} catch (error) {
			console.warn('Error loading genealogy data:', error);
			return [];
		}
	})();

	return _loadingPromise;
}

/**
 * Get cached people data from GEDCOM
 * Loads from static JSON on first access
 */
export async function getGEDCOMPeople(): Promise<Person[]> {
	if (_peopleCached) {
		return _peopleCached;
	}
	return await loadGEDCOMData();
}

/**
 * Get cached people synchronously (if already loaded)
 * Used in server-side contexts where async isn't available
 */
export function getGEDCOMPeopleSync(): Person[] {
	if (!_peopleCached) {
		console.warn('GEDCOM people data not yet loaded. Call getGEDCOMPeople() first or use async version.');
		return [];
	}
	return _peopleCached;
}

/**
 * Set people data directly (for testing or alternative sources)
 */
export function setGEDCOMPeople(people: Person[]): void {
	_peopleCached = people;
}

/**
 * Check if GEDCOM data is loaded (synchronously)
 */
export function isGEDCOMLoaded(): boolean {
	return _peopleCached !== null && _peopleCached.length > 0;
}

/**
 * Clear all cached GEDCOM data
 */
export function clearGEDCOMCache(): void {
	_peopleCached = null;
	_loadingPromise = null;
}

/**
 * Get statistics about loaded GEDCOM data
 */
export function getGEDCOMStatistics() {
	const people = _peopleCached || [];

	// Count relationships
	const totalSpouses = people.reduce((sum, p) => sum + (p.spouses?.length || 0), 0);
	const totalChildren = people.reduce((sum, p) => sum + (p.children?.length || 0), 0);
	const totalParents = people.reduce((sum, p) => sum + (p.parents?.length || 0), 0);

	// Count by gender
	const maleCount = people.filter((p) => p.gender === 'male').length;
	const femaleCount = people.filter((p) => p.gender === 'female').length;
	const otherCount = people.filter((p) => p.gender === 'other').length;

	// Count by dates
	const withBirth = people.filter((p) => p.birthDate).length;
	const withDeath = people.filter((p) => p.deathDate).length;

	return {
		totalPeople: people.length,
		maleCount,
		femaleCount,
		otherCount,
		withBirthDate: withBirth,
		withDeathDate: withDeath,
		totalSpouseRelations: totalSpouses,
		totalChildRelations: totalChildren,
		totalParentRelations: totalParents
	};
}
