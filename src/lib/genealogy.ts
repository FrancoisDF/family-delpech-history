import type { Person, PersonWithRelations } from './models/person';
import { loadFamilyData } from './ai/data';

let _peopleCached: Person[] | null = null;
let _peopleMapCached: Map<string, Person> | null = null;

export async function loadPeopleData(fetchFn?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>): Promise<Person[]> {
	if (_peopleCached) return _peopleCached;
	try {
		const fetchToUse = fetchFn || fetch;
		const res = await fetchToUse('/people.json');
		if (!res.ok) throw new Error('Failed to load people.json');
		const data = (await res.json()) as Person[];
		_peopleCached = data;
		// Rebuild map cache
		_peopleMapCached = null;
		return data;
	} catch (err) {
		console.warn('Unable to load people data:', err);
		return [];
	}
}

async function getPeopleMap(): Promise<Map<string, Person>> {
	if (_peopleMapCached) return _peopleMapCached;
	const people = await loadPeopleData();
	_peopleMapCached = new Map(people.map((p) => [p.id, p]));
	return _peopleMapCached;
}

export function clearPeopleDataCache() {
	_peopleCached = null;
	_peopleMapCached = null;
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
	const lowerQuery = query.toLowerCase();

	return people.filter((person) => {
		const searchText = `${person.displayName} ${person.givenName} ${person.familyName}`.toLowerCase();
		return searchText.includes(lowerQuery);
	});
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
