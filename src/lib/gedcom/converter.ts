import type { GEDCOMIndividual, GEDCOMFamily, GEDCOMParseResult } from './types';
import type { Person } from '$lib/models/person';
import { dateToISO, formatPlace } from './parser';

/**
 * Convert parsed GEDCOM data to Person[] array
 * Handles relationship mapping and data normalization
 */
export function convertGEDCOMToPeople(parseResult: GEDCOMParseResult): Person[] {
	const { individuals, families } = parseResult;
	const people: Person[] = [];

	// Convert each individual to Person
	for (const [individualId, individual] of individuals) {
		const person = convertIndividualToPerson(individual, families);
		people.push(person);
	}

	// Build relationship maps
	buildRelationships(people, individuals, families);

	return people;
}

/**
 * Convert a single GEDCOM individual to Person model
 */
function convertIndividualToPerson(
	individual: GEDCOMIndividual,
	families: Map<string, GEDCOMFamily>
): Person {
	// Extract gender mapping
	let gender: 'male' | 'female' | 'other' = 'other';
	if (individual.sex === 'M') gender = 'male';
	if (individual.sex === 'F') gender = 'female';

	// Get spouse IDs from family references
	const spouses: string[] = [];
	if (individual.fams) {
		for (const familyId of individual.fams) {
			const family = families.get(familyId);
			if (family) {
				if (family.husband === individual.id && family.wife) {
					spouses.push(family.wife);
				} else if (family.wife === individual.id && family.husband) {
					spouses.push(family.husband);
				}
			}
		}
	}

	// Get children IDs from family references
	const children: string[] = [];
	if (individual.fams) {
		for (const familyId of individual.fams) {
			const family = families.get(familyId);
			if (family) {
				children.push(...family.children);
			}
		}
	}

	// Get parent IDs from family references
	const parents: string[] = [];
	if (individual.famc) {
		for (const familyId of individual.famc) {
			const family = families.get(familyId);
			if (family) {
				if (family.husband) parents.push(family.husband);
				if (family.wife) parents.push(family.wife);
			}
		}
	}

	// Build tags from occupation and other data
	const tags: string[] = [];
	if (individual.occupation) {
		tags.push(individual.occupation);
	}
	// Add any additional event types as tags
	for (const event of individual.events) {
		if (event.type !== 'NOTE' && event.type !== 'BIRT' && event.type !== 'DEAT') {
			tags.push(event.type);
		}
	}

	// Build bio from GEDCOM note and occupation
	let bio = individual.bio || '';
	if (individual.occupation && !bio.includes(individual.occupation)) {
		bio = bio ? `${bio}. Occupation: ${individual.occupation}` : `Occupation: ${individual.occupation}`;
	}

	// Build display name
	const displayName = buildDisplayName(individual);

	const person: Person = {
		id: individual.id,
		givenName: individual.name.given || '',
		familyName: individual.name.family || '',
		displayName,
		birthDate: dateToISO(individual.birthDate),
		deathDate: dateToISO(individual.deathDate),
		birthPlace: formatPlace(individual.birthPlace),
		deathPlace: formatPlace(individual.deathPlace),
		bio: bio || undefined,
		gender,
		parents,
		spouses,
		children,
		siblings: [], // Will be built later in buildRelationships
		sources: [], // Could be populated if GEDCOM has SOURCE records
		photoUrl: individual.photoUrl,
		tags
	};

	return person;
}

/**
 * Build comprehensive relationship maps including siblings
 */
function buildRelationships(
	people: Person[],
	individuals: Map<string, GEDCOMIndividual>,
	families: Map<string, GEDCOMFamily>
) {
	const personMap = new Map(people.map((p) => [p.id, p]));

	// Build sibling relationships
	for (const person of people) {
		const siblings = new Set<string>();

		// Get all families where this person is a child
		const individual = individuals.get(person.id);
		if (individual?.famc) {
			for (const familyId of individual.famc) {
				const family = families.get(familyId);
				if (family) {
					// Add all other children as siblings
					for (const childId of family.children) {
						if (childId !== person.id) {
							siblings.add(childId);
						}
					}
				}
			}
		}

		person.siblings = Array.from(siblings);
	}

	// Validate and clean relationships (remove non-existent references)
	for (const person of people) {
		person.parents = person.parents.filter((id) => personMap.has(id));
		person.spouses = person.spouses.filter((id) => personMap.has(id));
		person.children = person.children.filter((id) => personMap.has(id));
		person.siblings = person.siblings.filter((id) => personMap.has(id));
	}
}

/**
 * Build display name from given and family names
 */
function buildDisplayName(individual: GEDCOMIndividual): string {
	const parts: string[] = [];

	if (individual.name.given) {
		parts.push(individual.name.given);
	}

	if (individual.name.family) {
		parts.push(individual.name.family);
	}

	if (parts.length === 0) {
		return individual.name.full || individual.id;
	}

	return parts.join(' ');
}

/**
 * Validate converted people data
 */
export function validatePeopleData(people: Person[]): {
	valid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	if (people.length === 0) {
		errors.push('No people found in parsed data');
	}

	const ids = new Set(people.map((p) => p.id));

	// Check for invalid references
	for (const person of people) {
		for (const parentId of person.parents) {
			if (!ids.has(parentId)) {
				errors.push(`Person ${person.id} references non-existent parent ${parentId}`);
			}
		}
		for (const childId of person.children) {
			if (!ids.has(childId)) {
				errors.push(`Person ${person.id} references non-existent child ${childId}`);
			}
		}
		for (const spouseId of person.spouses) {
			if (!ids.has(spouseId)) {
				errors.push(`Person ${person.id} references non-existent spouse ${spouseId}`);
			}
		}
	}

	return {
		valid: errors.length === 0,
		errors
	};
}
