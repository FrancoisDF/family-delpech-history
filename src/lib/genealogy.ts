import type { Person, PersonWithRelations } from './models/person';
import { loadFamilyData } from './ai/data';
import type { BuilderContent } from './server/builder';

let _peopleCached: Person[] | null = null;
let _peopleMapCached: Map<string, Person> | null = null;

export function setPeopleData(people: Person[]): void {
	_peopleCached = people;
	_peopleMapCached = null;
}

async function getPeopleMap(): Promise<Map<string, Person>> {
	if (_peopleMapCached) return _peopleMapCached;
	if (!_peopleCached) {
		console.warn('People data not initialized. Call setPeopleData() first.');
		return new Map();
	}
	_peopleMapCached = new Map(_peopleCached.map((p) => [p.id, p]));
	return _peopleMapCached;
}

export function clearPeopleDataCache() {
	_peopleCached = null;
	_peopleMapCached = null;
}

export async function loadPeopleData(): Promise<Person[]> {
	if (!_peopleCached) {
		console.warn('People data not initialized. Call setPeopleData() first.');
		return [];
	}
	return _peopleCached;
}

export function getGenerationLevel(personId: string, basePersonId: string): number | null {
	if (!_peopleCached) return null;

	const peopleMap = new Map(_peopleCached.map((p) => [p.id, p]));

	function calculateDistance(from: string, to: string, visited = new Set<string>()): number | null {
		if (visited.has(from)) return null;
		visited.add(from);

		if (from === to) return 0;

		const fromPerson = peopleMap.get(from);
		if (!fromPerson) return null;

		// Check children (next generation)
		for (const childId of fromPerson.children) {
			const dist = calculateDistance(childId, to, new Set(visited));
			if (dist !== null) return dist + 1;
		}

		// Check parents (previous generation)
		for (const parentId of fromPerson.parents) {
			const dist = calculateDistance(parentId, to, new Set(visited));
			if (dist !== null) return dist - 1;
		}

		return null;
	}

	return calculateDistance(personId, basePersonId);
}

export function filterPeopleByTag(people: Person[], tag: string): Person[] {
	const lowerTag = tag.toLowerCase();
	return people.filter((person) =>
		(person.tags || []).some((t) => t.toLowerCase().includes(lowerTag))
	);
}

export function filterPeopleByProfession(people: Person[], keyword: string): Person[] {
	const lowerKeyword = keyword.toLowerCase();
	return people.filter((person) => {
		const bioText = (person.bio || '').toLowerCase();
		const searchText = `${person.givenName} ${person.familyName} ${bioText}`.toLowerCase();
		return searchText.includes(lowerKeyword);
	});
}

export function searchPeopleByNameInBuilder(query: string, people: Person[]): Person[] {
	const lowerQuery = query.toLowerCase();

	return people.filter((person) => {
		const searchText = `${person.displayName} ${person.givenName} ${person.familyName}`.toLowerCase();
		return searchText.includes(lowerQuery);
	});
}

export function buildPersonFromBuilderContent(
	content: BuilderContent,
	contentIdToPersonIdMap?: Map<string, string>
): Person | null {
	if (!content.data) return null;
	const data = content.data as Record<string, unknown>;

	const personId = data.personId as string;
	if (!personId) return null;

	// Extract spouse and children IDs from references
	const spouses: string[] = [];
	const children: string[] = [];

	if (Array.isArray(data.spouses)) {
		for (const spouse of data.spouses) {
			if (typeof spouse === 'object' && spouse !== null) {
				const spouseRefId = (spouse as any).id;
				if (spouseRefId && contentIdToPersonIdMap) {
					const spousePersonId = contentIdToPersonIdMap.get(spouseRefId);
					if (spousePersonId) {
						spouses.push(spousePersonId);
					}
				}
			}
		}
	}

	if (Array.isArray(data.children)) {
		for (const child of data.children) {
			if (typeof child === 'object' && child !== null) {
				const childRefId = (child as any).id;
				if (childRefId && contentIdToPersonIdMap) {
					const childPersonId = contentIdToPersonIdMap.get(childRefId);
					if (childPersonId) {
						children.push(childPersonId);
					}
				}
			}
		}
	}

	return {
		id: personId,
		givenName: (data.givenName as string) || '',
		familyName: (data.familyName as string) || '',
		displayName: (data.displayName as string) || '',
		birthDate: (data.birthDate as string) || undefined,
		deathDate: (data.deathDate as string) || undefined,
		birthPlace: (data.birthPlace as string) || undefined,
		deathPlace: (data.deathPlace as string) || undefined,
		bio: (data.bio as string) || undefined,
		gender: (data.gender as 'male' | 'female' | 'other') || undefined,
		parents: [], // Builder.io model doesn't have parents field yet
		spouses,
		children,
		siblings: [], // Builder.io model doesn't have siblings field yet
		sources: [],
		tags: (data.tags as string[]) || []
	};
}

export async function getPerson(id: string): Promise<Person | null> {
	const map = await getPeopleMap();
	return map.get(id) || null;
}

export async function getPersonWithRelations(id: string): Promise<PersonWithRelations | null> {
	const person = await getPerson(id);
	if (!person) return null;

	const peopleMap = await getPeopleMap();

	return {
		...person,
		parentObjects: person.parents.map((pid) => peopleMap.get(pid)).filter(Boolean) as Person[],
		spouseObjects: person.spouses.map((pid) => peopleMap.get(pid)).filter(Boolean) as Person[],
		childObjects: person.children.map((pid) => peopleMap.get(pid)).filter(Boolean) as Person[],
		siblingObjects: person.siblings.map((pid) => peopleMap.get(pid)).filter(Boolean) as Person[]
	};
}

export async function getPersonAncestors(personId: string): Promise<Person[]> {
	const visited = new Set<string>();
	const ancestors: Person[] = [];

	async function traverse(id: string, depth = 0) {
		if (visited.has(id) || depth > 10) return;
		visited.add(id);

		const person = await getPerson(id);
		if (!person) return;

		for (const parentId of person.parents) {
			const parent = await getPerson(parentId);
			if (parent && !visited.has(parentId)) {
				ancestors.push(parent);
				await traverse(parentId, depth + 1);
			}
		}
	}

	await traverse(personId);
	return ancestors;
}

export async function getPersonDescendants(personId: string): Promise<Person[]> {
	const visited = new Set<string>();
	const descendants: Person[] = [];

	async function traverse(id: string, depth = 0) {
		if (visited.has(id) || depth > 10) return;
		visited.add(id);

		const person = await getPerson(id);
		if (!person) return;

		for (const childId of person.children) {
			const child = await getPerson(childId);
			if (child && !visited.has(childId)) {
				descendants.push(child);
				await traverse(childId, depth + 1);
			}
		}
	}

	await traverse(personId);
	return descendants;
}

export async function getRelatedArticles(personId: string): Promise<any[]> {
	const person = await getPerson(personId);
	if (!person) return [];

	const familyData = await loadFamilyData();

	// Build search tags from person's name and aliases
	const searchTags = [
		person.givenName,
		person.familyName,
		person.displayName,
		...(person.tags || [])
	].map((tag) => tag.toLowerCase());

	// Filter family data chunks by matching tags
	const relatedChunks = familyData.filter((chunk) => {
		const chunkTags = (chunk.tags || []).map((tag) => tag.toLowerCase());
		return searchTags.some((tag) => chunkTags.some((ctag) => ctag.includes(tag) || tag.includes(ctag)));
	});

	// Convert chunks to article-like objects
	return relatedChunks.map((chunk) => ({
		id: chunk.id,
		title: chunk.title,
		excerpt: chunk.text.substring(0, 200) + '...',
		url: chunk.url,
		author: chunk.author,
		year: chunk.year,
		category: chunk.category,
		tags: chunk.tags
	}));
}

export async function searchPeopleByName(query: string): Promise<Person[]> {
	const people = await loadPeopleData();
	return searchPeopleByNameInBuilder(query, people);
}

export async function getPeopleByGeneration(startingPersonId: string, generationOffset: number): Promise<Person[]> {
	const person = await getPerson(startingPersonId);
	if (!person) return [];

	const people = await loadPeopleData();
	const peopleMap = await getPeopleMap();

	// Helper to calculate generation distance
	function getGenerationDistance(from: string, to: string, visited = new Set<string>()): number | null {
		if (visited.has(from)) return null;
		visited.add(from);

		if (from === to) return 0;

		const fromPerson = peopleMap.get(from);
		if (!fromPerson) return null;

		// Check parents (ancestors)
		for (const parentId of fromPerson.parents) {
			const dist = getGenerationDistance(parentId, to, new Set(visited));
			if (dist !== null) return dist + 1;
		}

		// Check children (descendants)
		for (const childId of fromPerson.children) {
			const dist = getGenerationDistance(childId, to, new Set(visited));
			if (dist !== null) return dist - 1;
		}

		return null;
	}

	return people.filter((p) => {
		const dist = getGenerationDistance(startingPersonId, p.id);
		return dist === generationOffset;
	});
}
