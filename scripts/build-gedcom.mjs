#!/usr/bin/env node

/**
 * Build-time GEDCOM parser
 * Processes GEDCOM file during build and outputs pre-computed JSON
 * Usage: node scripts/build-gedcom.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const GEDCOM_FILE = join(PROJECT_ROOT, 'static', 'family.ged');
const OUTPUT_FILE = join(PROJECT_ROOT, 'static', 'genealogy-data.json');

/**
 * Parse GEDCOM name field
 * Format: "Given Names /Surname/"
 */
function parseName(nameStr) {
	const cleanName = nameStr.replace(/\//g, '').trim();
	const slashMatch = nameStr.match(/^([^/]*)\s*\/([^/]+)\/?$/);
	let given = '';
	let family = '';

	if (slashMatch) {
		given = slashMatch[1].trim();
		family = slashMatch[2].trim();
	} else {
		const parts = cleanName.split(/\s+/);
		if (parts.length > 1) {
			family = parts[parts.length - 1];
			given = parts.slice(0, -1).join(' ');
		} else {
			family = cleanName;
		}
	}

	return {
		full: cleanName,
		given,
		family,
		prefix: undefined,
		suffix: undefined
	};
}

/**
 * Parse a GEDCOM DATE field
 */
function parseDate(dateStr) {
	const result = { raw: dateStr };

	if (dateStr.startsWith('ABT') || dateStr.startsWith('EST')) {
		result.isEstimated = true;
		dateStr = dateStr.replace(/^(ABT|EST)\s*/, '').trim();
	}

	const months = {
		JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
		JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12
	};

	const parts = dateStr.split(/\s+/);

	for (const part of parts) {
		const monthEntry = Object.entries(months).find(([month]) => part.toUpperCase().startsWith(month));
		if (monthEntry) {
			result.month = monthEntry[1];
		}

		const yearMatch = part.match(/^\d{4}$/);
		if (yearMatch) {
			result.year = parseInt(yearMatch[0]);
		}

		const dayMatch = part.match(/^\d{1,2}$/);
		if (dayMatch && result.month) {
			result.day = parseInt(dayMatch[0]);
		}
	}

	return result;
}

/**
 * Parse a GEDCOM PLAC field
 */
function parsePlace(placeStr) {
	const parts = placeStr.split(',').map((p) => p.trim());

	return {
		raw: placeStr,
		parts,
		city: parts[0],
		region: parts[1],
		country: parts[2]
	};
}

/**
 * Convert a GEDCOMDate to ISO string (YYYY-MM-DD)
 */
function dateToISO(date) {
	if (!date || !date.year) return undefined;

	const year = date.year;
	const month = (date.month || 1).toString().padStart(2, '0');
	const day = (date.day || 1).toString().padStart(2, '0');

	return `${year}-${month}-${day}`;
}

/**
 * Format a place for display
 */
function formatPlace(place) {
	if (!place) return undefined;
	return place.parts.join(', ');
}

/**
 * Parse GEDCOM content
 */
function parseGEDCOM(content) {
	const lines = content.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
	const individuals = new Map();
	const families = new Map();
	const errors = [];
	const warnings = [];

	let currentIndividual = null;
	let currentFamily = null;
	let currentIndividualId = null;
	let currentFamilyId = null;

	for (let lineNum = 0; lineNum < lines.length; lineNum++) {
		const line = lines[lineNum];

		try {
			// GEDCOM line format can be:
			// 0 TAG VALUE
			// 0 @ID@ TAG
			// Parse more flexibly to handle both formats
			const match = line.match(/^(\d+)\s+(?:(@[^@]+@)\s+)?(\w+)(?:\s+(.*))?$/);
			if (!match) continue;

			const level = parseInt(match[1]);
			const id = match[2]; // ID like @I1@ or undefined
			const tag = match[3];
			const value = match[4] || '';

			// Handle individual records
			if (tag === 'INDI' && level === 0) {
				if (currentIndividual && currentIndividualId) {
					individuals.set(currentIndividualId, currentIndividual);
				}

				currentIndividualId = id ? id.replace(/[@ ]/g, '') : value.replace(/[@ ]/g, '');
				currentIndividual = {
					id: currentIndividualId,
					name: { full: '', given: '', family: '' },
					events: []
				};
			}

			// Handle family records
			if (tag === 'FAM' && level === 0) {
				if (currentFamily && currentFamilyId) {
					families.set(currentFamilyId, currentFamily);
				}

				currentFamilyId = id ? id.replace(/[@ ]/g, '') : value.replace(/[@ ]/g, '');
				currentFamily = {
					id: currentFamilyId,
					children: []
				};
			}

			// Parse individual properties
			if (currentIndividual && currentIndividualId) {
				if (tag === 'NAME' && level === 1) {
					currentIndividual.name = parseName(value);
				} else if (tag === 'SEX' && level === 1) {
					currentIndividual.sex = value;
				} else if (tag === 'BIRT' && level === 1) {
					const birthEvent = parseEvent(lines, lineNum, 'BIRT');
					if (birthEvent.date) currentIndividual.birthDate = birthEvent.date;
					if (birthEvent.place) currentIndividual.birthPlace = birthEvent.place;
				} else if (tag === 'DEAT' && level === 1) {
					const deathEvent = parseEvent(lines, lineNum, 'DEAT');
					if (deathEvent.date) currentIndividual.deathDate = deathEvent.date;
					if (deathEvent.place) currentIndividual.deathPlace = deathEvent.place;
				} else if (tag === 'OCCU' && level === 1) {
					currentIndividual.occupation = value;
				} else if (tag === 'NOTE' && level === 1) {
					currentIndividual.bio = value;
				} else if (tag === 'OBJE' && level === 1) {
					if (value.startsWith('http')) {
						currentIndividual.photoUrl = value;
					}
				} else if (tag === 'FAMC' && level === 1) {
					const familyId = value.replace(/[@ ]/g, '');
					if (!currentIndividual.famc) currentIndividual.famc = [];
					currentIndividual.famc.push(familyId);
				} else if (tag === 'FAMS' && level === 1) {
					const familyId = value.replace(/[@ ]/g, '');
					if (!currentIndividual.fams) currentIndividual.fams = [];
					currentIndividual.fams.push(familyId);
				}
			}

			// Parse family properties
			if (currentFamily && currentFamilyId) {
				if (tag === 'HUSB' && level === 1) {
					currentFamily.husband = value.replace(/[@ ]/g, '');
				} else if (tag === 'WIFE' && level === 1) {
					currentFamily.wife = value.replace(/[@ ]/g, '');
				} else if (tag === 'CHIL' && level === 1) {
					currentFamily.children.push(value.replace(/[@ ]/g, ''));
				} else if (tag === 'MARR' && level === 1) {
					const marriageEvent = parseEvent(lines, lineNum, 'MARR');
					if (marriageEvent.date) currentFamily.marriageDate = marriageEvent.date;
				} else if (tag === 'DIV' && level === 1) {
					const divorceEvent = parseEvent(lines, lineNum, 'DIV');
					if (divorceEvent.date) currentFamily.divorceDate = divorceEvent.date;
				}
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			errors.push(`Line ${lineNum + 1}: ${message}`);
		}
	}

	// Add final individual and family
	if (currentIndividual && currentIndividualId) {
		individuals.set(currentIndividualId, currentIndividual);
	}
	if (currentFamily && currentFamilyId) {
		families.set(currentFamilyId, currentFamily);
	}

	return {
		individuals,
		families,
		errors,
		warnings,
		totalLines: lines.length,
		parsedAt: new Date()
	};
}

/**
 * Parse a GEDCOM event with DATE and PLAC subrecords
 */
function parseEvent(lines, startIndex, eventType) {
	const event = {
		type: eventType,
		date: undefined,
		place: undefined
	};

	const baseLevel = parseInt(lines[startIndex].match(/^\d+/)[0]);

	for (let i = startIndex + 1; i < lines.length && i < startIndex + 10; i++) {
		const nextLine = lines[i];
		const match = nextLine.match(/^(\d+)\s+(?:(@[^@]+@)\s+)?(\w+)(?:\s+(.*))?$/);

		if (!match) break;

		const level = parseInt(match[1]);
		const tag = match[3];
		const value = match[4] || '';

		if (level <= baseLevel) break;

		if (tag === 'DATE' && level === baseLevel + 1) {
			event.date = parseDate(value);
		} else if (tag === 'PLAC' && level === baseLevel + 1) {
			event.place = parsePlace(value);
		}
	}

	return event;
}

/**
 * Convert parsed GEDCOM data to Person[] array
 */
function convertGEDCOMToPeople(parseResult) {
	const { individuals, families } = parseResult;
	const people = [];

	for (const [individualId, individual] of individuals) {
		const person = convertIndividualToPerson(individual, families);
		people.push(person);
	}

	buildRelationships(people, individuals, families);

	return people;
}

/**
 * Convert a single GEDCOM individual to Person
 */
function convertIndividualToPerson(individual, families) {
	let gender = 'other';
	if (individual.sex === 'M') gender = 'male';
	if (individual.sex === 'F') gender = 'female';

	const spouses = [];
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

	const children = [];
	if (individual.fams) {
		for (const familyId of individual.fams) {
			const family = families.get(familyId);
			if (family) {
				children.push(...family.children);
			}
		}
	}

	const parents = [];
	if (individual.famc) {
		for (const familyId of individual.famc) {
			const family = families.get(familyId);
			if (family) {
				if (family.husband) parents.push(family.husband);
				if (family.wife) parents.push(family.wife);
			}
		}
	}

	const tags = [];
	if (individual.occupation) {
		tags.push(individual.occupation);
	}

	let bio = individual.bio || '';
	if (individual.occupation && !bio.includes(individual.occupation)) {
		bio = bio ? `${bio}. Occupation: ${individual.occupation}` : `Occupation: ${individual.occupation}`;
	}

	const displayName = buildDisplayName(individual);

	return {
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
		siblings: [],
		sources: [],
		photoUrl: individual.photoUrl,
		tags
	};
}

/**
 * Build display name from given and family names
 */
function buildDisplayName(individual) {
	const parts = [];

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
 * Build relationship maps
 */
function buildRelationships(people, individuals, families) {
	const personMap = new Map(people.map((p) => [p.id, p]));

	// Build sibling relationships
	for (const person of people) {
		const siblings = new Set();

		const individual = individuals.get(person.id);
		if (individual?.famc) {
			for (const familyId of individual.famc) {
				const family = families.get(familyId);
				if (family) {
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

	// Validate and clean relationships
	for (const person of people) {
		person.parents = person.parents.filter((id) => personMap.has(id));
		person.spouses = person.spouses.filter((id) => personMap.has(id));
		person.children = person.children.filter((id) => personMap.has(id));
		person.siblings = person.siblings.filter((id) => personMap.has(id));
	}
}

/**
 * Main build function
 */
async function buildGEDCOM() {
	try {
		console.log(`📖 Reading GEDCOM file: ${GEDCOM_FILE}`);

		if (!existsSync(GEDCOM_FILE)) {
			console.error(`❌ Error: GEDCOM file not found at ${GEDCOM_FILE}`);
			process.exit(1);
		}

		const content = readFileSync(GEDCOM_FILE, 'utf-8');
		console.log(`✓ Read ${content.length} characters from GEDCOM file`);

		console.log('⏳ Parsing GEDCOM...');
		const parseResult = parseGEDCOM(content);

		if (parseResult.errors.length > 0) {
			console.error('⚠️  Parse errors:');
			for (const error of parseResult.errors) {
				console.error(`  - ${error}`);
			}
		}

		console.log(`✓ Parsed ${parseResult.individuals.size} individuals and ${parseResult.families.size} families`);

		console.log('⏳ Converting to Person model...');
		const people = convertGEDCOMToPeople(parseResult);
		console.log(`✓ Converted to ${people.length} people`);

		const output = {
			people,
			statistics: {
				totalPeople: people.length,
				totalFamilies: parseResult.families.size,
				maleCount: people.filter((p) => p.gender === 'male').length,
				femaleCount: people.filter((p) => p.gender === 'female').length,
				otherCount: people.filter((p) => p.gender === 'other').length,
				withBirthDate: people.filter((p) => p.birthDate).length,
				withDeathDate: people.filter((p) => p.deathDate).length
			},
			parsedAt: new Date().toISOString(),
			parseErrors: parseResult.errors,
			parseWarnings: parseResult.warnings
		};

		console.log('✓ Writing output to JSON...');
		writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
		console.log(`✓ Wrote ${OUTPUT_FILE}`);

		console.log('\n✅ GEDCOM build successful!');
		console.log(`   Generated data for ${output.statistics.totalPeople} people`);
		if (parseResult.warnings.length > 0) {
			console.log(`   ⚠️  ${parseResult.warnings.length} warnings`);
		}
	} catch (error) {
		console.error('❌ Build failed:', error instanceof Error ? error.message : error);
		process.exit(1);
	}
}

buildGEDCOM();
