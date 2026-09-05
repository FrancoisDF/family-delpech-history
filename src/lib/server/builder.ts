import { fetchOneEntry, fetchEntries } from '@builder.io/sdk-svelte';
import { PUBLIC_BUILDER_API_KEY } from '$app/env/public';
import type { Person } from '#lib/models/person.js';

export interface BuilderContent {
	id?: string;
	name?: string;
	data?: Record<string, unknown>;
}

export interface BlogArticle {
	id: string;
	title: string;
	excerpt?: string;
	date?: string;
	readTime?: string;
	featuredImage?: string;
	featuredImageDisplayMode?: string;
	category?: string;
	slug?: string;
	author?: string;
	pdfFile?: string;
	tags?: unknown[];
	blocks?: unknown[];
	sectionNavigation?: unknown;
	builderContent?: BuilderContent;
	[key: string]: unknown;
}

export interface ChroniqueReference {
	articleId: string;
	label?: string;
}

export interface Chronique {
	id: string;
	title: string;
	handle: string;
	excerpt?: string;
	date?: string;
	readTime?: string;
	featuredImage?: string;
	category?: string;
	author?: string;
	tags?: unknown[];
	introBlocks: unknown[];
	referencedArticles: ChroniqueReference[];
	sectionNavigation?: unknown;
}

export interface ResolvedChronique extends Chronique {
	articles: BlogArticle[];
}

export type DiscoveryItem =
	| (BlogArticle & { type: 'article' })
	| (Chronique & { type: 'chronique'; articleCount: number });

function asRecord(value: unknown): Record<string, unknown> | null {
	return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown): string | undefined {
	return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function readNestedValue(value: unknown, keys: string[]): unknown {
	let current: unknown = value;
	for (const key of keys) {
		const record = asRecord(current);
		if (!record) return undefined;
		current = record[key];
	}
	return current;
}

export function normalizeBuilderReference(value: unknown): ChroniqueReference | null {
	const raw = asRecord(value);
	const candidates = [
		value,
		raw?.article,
		raw?.reference,
		raw?.value,
		readNestedValue(raw?.article, ['value']),
		readNestedValue(raw?.reference, ['value'])
	];
	const articleId = candidates
		.map((candidate) => {
			if (typeof candidate === 'string') return candidate;
			const record = asRecord(candidate);

			return (
				asString(record?.id) ||
				asString(readNestedValue(record, ['value', 'id'])) ||
				asString(readNestedValue(record, ['data', 'id']))
			);
		})
		.find(Boolean);

	if (!articleId) return null;

	const label =
		asString(raw?.navigationLabel) ||
		asString(raw?.label) ||
		asString(raw?.title) ||
		asString(readNestedValue(raw?.article, ['title'])) ||
		asString(readNestedValue(raw?.article, ['value', 'data', 'title'])) ||
		asString(readNestedValue(raw?.value, ['data', 'title']));

	return { articleId, label };
}

export function normalizeBlogArticle(entry: BuilderContent): BlogArticle | null {
	if (!entry.id) return null;
	const data = entry.data || {};
	return {
		id: entry.id,
		...data,
		title: asString(data.title) || entry.name || entry.id,
		builderContent: entry
	};
}

export function normalizeChronique(entry: BuilderContent): Chronique | null {
	if (!entry.id) return null;
	const data = entry.data || {};
	const seenArticleIds = new Set<string>();
	const references = Array.isArray(data.referencedArticles)
		? data.referencedArticles.flatMap((reference) => {
				const normalized = normalizeBuilderReference(reference);
				if (!normalized || seenArticleIds.has(normalized.articleId)) return [];
				seenArticleIds.add(normalized.articleId);
				return [normalized];
			})
		: [];

	return {
		id: entry.id,
		title: asString(data.title) || entry.name || entry.id,
		handle: asString(data.handle) || entry.id,
		excerpt: asString(data.excerpt),
		date: asString(data.date),
		readTime: asString(data.readTime),
		featuredImage: asString(data.featuredImage),
		category: asString(data.category),
		author: asString(data.author),
		tags: Array.isArray(data.tags) ? data.tags : [],
		introBlocks: Array.isArray(data.introBlocks) ? data.introBlocks : [],
		referencedArticles: references,
		sectionNavigation: data.sectionNavigation
	};
}

export async function fetchChroniquesServer(): Promise<Chronique[]> {
	const entries = await fetchBuilderContentServer('chronique', {
		limit: 100,
		omit: 'data.introBlocks, meta, folders, variations'
	});
	return entries.flatMap((entry) => {
		const chronique = normalizeChronique(entry);
		return chronique ? [chronique] : [];
	});
}

export async function fetchResolvedChroniqueByHandleServer(
	handle: string
): Promise<ResolvedChronique | null> {
	const entry = await fetchBuilderContentByHandleServer('chronique', handle);
	if (!entry) return null;

	const chronique = normalizeChronique(entry);
	if (!chronique) return null;

	const articles = (
		await Promise.all(
			chronique.referencedArticles.map(async ({ articleId }) => {
				const article = await fetchBuilderContentByIdServer('blog-articles', articleId);
				return article ? normalizeBlogArticle(article) : null;
			})
		)
	).filter((article): article is BlogArticle => article !== null);

	return { ...chronique, articles };
}

export async function fetchChroniquesReferencingArticleServer(
	articleId: string
): Promise<Chronique[]> {
	const chroniques = await fetchChroniquesServer();
	return chroniques.filter((chronique) =>
		chronique.referencedArticles.some((reference) => reference.articleId === articleId)
	);
}

export async function fetchBuilderContentServer(
	model: string,
	options?: {
		limit?: number;
		offset?: number;
		preview?: boolean;
		omit?: string;
		query?: Record<string, unknown>;
	}
): Promise<BuilderContent[]> {
	try {
		const results = await fetchEntries({
			model,
			apiKey: PUBLIC_BUILDER_API_KEY,
			limit: options?.limit || 100,
			offset: options?.offset || 0,
			omit: options?.omit,
			query: options?.query
		});

		return results || [];
	} catch (error) {
		console.error(
			`Could not fetch Builder.io content for model "${model}". Error:`,
			error instanceof Error ? error.message : error
		);
		return [];
	}
}

export async function fetchBuilderContentByIdServer(
	model: string,
	id: string,
	includeUnpublished: boolean = false
): Promise<BuilderContent | null> {
	try {
		const result = await fetchOneEntry({
			model,
			apiKey: PUBLIC_BUILDER_API_KEY,
			includeUnpublished,
			options: { query: { id } }
		});

		return result || null;
	} catch (error) {
		console.error(
			`Could not fetch Builder.io content for ${model}/${id}. Error:`,
			error instanceof Error ? error.message : error
		);
		return null;
	}
}

export async function fetchBuilderContentByHandleServer(
	model: string,
	handle: string
): Promise<BuilderContent | null> {
	try {
		const results = await fetchEntries({
			model,
			apiKey: PUBLIC_BUILDER_API_KEY,
			limit: 1,
			query: {
				'data.handle': handle
			}
		});

		return results && results.length > 0 ? results[0] : null;
	} catch (error) {
		console.error(
			`Could not fetch Builder.io content for ${model} with handle "${handle}". Error:`,
			error instanceof Error ? error.message : error
		);
		return null;
	}
}

export async function fetchBuilderPersonByIdServer(
	personId: string
): Promise<BuilderContent | null> {
	try {
		const results = await fetchEntries({
			model: 'person',
			apiKey: PUBLIC_BUILDER_API_KEY,
			limit: 1,
			query: {
				'data.personId': personId
			}
		});

		return results && results.length > 0 ? results[0] : null;
	} catch (error) {
		console.error(
			`Could not fetch Builder.io person for "${personId}". Error:`,
			error instanceof Error ? error.message : error
		);
		return null;
	}
}

export async function fetchAllBuilderPeopleServer(): Promise<BuilderContent[]> {
	try {
		const results = await fetchEntries({
			model: 'person',
			apiKey: PUBLIC_BUILDER_API_KEY,
			limit: 100
		});

		return results || [];
	} catch (error) {
		console.error(
			`Could not fetch all Builder.io people. Error:`,
			error instanceof Error ? error.message : error
		);
		return [];
	}
}

export function createPersonIdToContentIdMap(people: BuilderContent[]): Map<string, string> {
	const map = new Map<string, string>();
	for (const person of people) {
		const personId = (person.data as any)?.personId;
		if (personId && person.id) {
			map.set(personId, person.id);
		}
	}
	return map;
}

export function createContentIdToPersonIdMap(people: BuilderContent[]): Map<string, string> {
	const map = new Map<string, string>();
	for (const person of people) {
		const personId = (person.data as any)?.personId;
		if (personId && person.id) {
			map.set(person.id, personId);
		}
	}
	return map;
}

export function resolvePersonReferences(
	content: BuilderContent,
	contentIdToPersonIdMap: Map<string, string>
): { spouseIds: string[]; childIds: string[] } {
	const spouseIds: string[] = [];
	const childIds: string[] = [];

	const data = content.data as any;

	if (Array.isArray(data?.spouses)) {
		for (const spouse of data.spouses) {
			const spouseContentId = spouse?.id;
			if (spouseContentId) {
				const personId = contentIdToPersonIdMap.get(spouseContentId);
				if (personId) {
					spouseIds.push(personId);
				}
			}
		}
	}

	if (Array.isArray(data?.children)) {
		for (const child of data.children) {
			const childContentId = child?.id;
			if (childContentId) {
				const personId = contentIdToPersonIdMap.get(childContentId);
				if (personId) {
					childIds.push(personId);
				}
			}
		}
	}

	return { spouseIds, childIds };
}

export async function fetchBuilderPeopleWithRelationsServer(): Promise<Person[]> {
	try {
		const builderPeople = await fetchAllBuilderPeopleServer();
		if (builderPeople.length === 0) {
			return [];
		}

		const contentIdToPersonIdMap = createContentIdToPersonIdMap(builderPeople);
		const people: Person[] = [];
		const personMap = new Map<string, Person>();

		for (const builderPerson of builderPeople) {
			const personId = (builderPerson.data as any)?.personId as string;
			if (!personId) continue;

			const person: Person = {
				id: personId,
				givenName: (builderPerson.data as any)?.givenName || '',
				familyName: (builderPerson.data as any)?.familyName || '',
				displayName: (builderPerson.data as any)?.displayName || '',
				birthDate: (builderPerson.data as any)?.birthDate,
				deathDate: (builderPerson.data as any)?.deathDate,
				birthPlace: (builderPerson.data as any)?.birthPlace,
				deathPlace: (builderPerson.data as any)?.deathPlace,
				bio: (builderPerson.data as any)?.bio,
				gender: (builderPerson.data as any)?.gender,
				parents: [],
				spouses: [],
				children: [],
				siblings: [],
				sources: [],
				tags: (builderPerson.data as any)?.tags || []
			};

			people.push(person);
			personMap.set(personId, person);
		}

		for (const builderPerson of builderPeople) {
			const personId = (builderPerson.data as any)?.personId as string;
			if (!personId) continue;

			const person = personMap.get(personId);
			if (!person) continue;

			const data = builderPerson.data as any;

			if (Array.isArray(data?.spouses)) {
				for (const spouseRef of data.spouses) {
					const spouseContentId = spouseRef?.id;
					if (spouseContentId) {
						const spousePersonId = contentIdToPersonIdMap.get(spouseContentId);
						const spouses = person.spouses ?? (person.spouses = []);
						if (spousePersonId && !spouses.includes(spousePersonId)) {
							spouses.push(spousePersonId);
						}
					}
				}
			}

			if (Array.isArray(data?.children)) {
				for (const childRef of data.children) {
					const childContentId = childRef?.id;
					if (childContentId) {
						const childPersonId = contentIdToPersonIdMap.get(childContentId);
						const children = person.children ?? (person.children = []);
						if (childPersonId && !children.includes(childPersonId)) {
							children.push(childPersonId);
						}
					}
				}
			}
		}

		return people;
	} catch (error) {
		console.error(
			'Could not fetch Builder.io people with relations. Error:',
			error instanceof Error ? error.message : error
		);
		return [];
	}
}

export function buildPeopleMapFromBuilder(people: Person[]): {
	peopleMap: Map<string, Person>;
	contentIdMap: Map<string, Person>;
	searchIndex: Map<string, Person[]>;
} {
	const peopleMap = new Map<string, Person>();
	const contentIdMap = new Map<string, Person>();
	const searchIndex = new Map<string, Person[]>();

	for (const person of people) {
		peopleMap.set(person.id, person);

		const searchTerms = [
			person.givenName.toLowerCase(),
			person.familyName.toLowerCase(),
			person.displayName.toLowerCase(),
			...(person.tags || []).map((tag) => tag.toLowerCase())
		];

		for (const term of searchTerms) {
			if (!searchIndex.has(term)) {
				searchIndex.set(term, []);
			}
			const results = searchIndex.get(term)!;
			if (!results.includes(person)) {
				results.push(person);
			}
		}
	}

	return { peopleMap, contentIdMap, searchIndex };
}

export interface FamilyChunk {
	id: string;
	sourceId: string;
	sourceModel: string;
	title: string;
	url: string;
	index: number;
	text: string;
	length: number;
	author?: string;
	year?: string;
	category?: string;
	tags?: string[];
}
