import type {
	GEDCOMIndividual,
	GEDCOMFamily,
	GEDCOMName,
	GEDCOMDate,
	GEDCOMPlace,
	GEDCOMEvent,
	GEDCOMParseResult,
	GEDCOMParseError
} from './types';

/**
 * Parse a GEDCOM file content string
 * Returns a map of individuals and families
 */
export function parseGEDCOM(content: string): GEDCOMParseResult {
	const lines = content.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
	const individuals = new Map<string, GEDCOMIndividual>();
	const families = new Map<string, GEDCOMFamily>();
	const errors: string[] = [];
	const warnings: string[] = [];

	let currentIndividual: GEDCOMIndividual | null = null;
	let currentFamily: GEDCOMFamily | null = null;
	let currentIndividualId: string | null = null;
	let currentFamilyId: string | null = null;

	for (let lineNum = 0; lineNum < lines.length; lineNum++) {
		const line = lines[lineNum];

		try {
			// Parse GEDCOM line format: LEVEL TAG [VALUE]
			const match = line.match(/^(\d+)\s+(\w+)(?:\s+(.*))?$/);
			if (!match) continue;

			const level = parseInt(match[1]);
			const tag = match[2];
			const value = match[3] || '';

			// Handle individual records
			if (tag === 'INDI' && level === 0) {
				if (currentIndividual && currentIndividualId) {
					individuals.set(currentIndividualId, currentIndividual);
				}

				currentIndividualId = value.replace(/[@ ]/g, '');
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

				currentFamilyId = value.replace(/[@ ]/g, '');
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
					currentIndividual.sex = value as 'M' | 'F' | 'U';
				} else if (tag === 'BIRT' && level === 1) {
					// Next lines will have DATE and PLAC
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
					// Photo URL or media link
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
 * Parse a GEDCOM NAME field
 * Format: "Given Names /Surname/"
 */
function parseName(nameStr: string): GEDCOMName {
	// Remove extra slashes and clean up
	const cleanName = nameStr.replace(/\//g, '').trim();

	// Try to extract family name from slashes first
	const slashMatch = nameStr.match(/^([^/]*)\s*\/([^/]+)\/?$/);
	let given = '';
	let family = '';

	if (slashMatch) {
		given = slashMatch[1].trim();
		family = slashMatch[2].trim();
	} else {
		// Split on last space if no slashes
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
 * Parse a GEDCOM event with DATE and PLAC subrecords
 */
function parseEvent(
	lines: string[],
	startIndex: number,
	eventType: string
): GEDCOMEvent {
	const event: GEDCOMEvent = {
		type: eventType as any,
		date: undefined,
		place: undefined
	};

	const baseLevel = parseInt(lines[startIndex].match(/^\d+/)![0]);

	// Look ahead for DATE and PLAC
	for (let i = startIndex + 1; i < lines.length && i < startIndex + 10; i++) {
		const nextLine = lines[i];
		const match = nextLine.match(/^(\d+)\s+(\w+)\s+(.*)$/);

		if (!match) break;

		const level = parseInt(match[1]);
		const tag = match[2];
		const value = match[3];

		// Stop if we've gone back up in level
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
 * Parse a GEDCOM DATE field
 * Formats: "1 JAN 1950", "JAN 1950", "1950", "ABT 1950", "EST 1950"
 */
function parseDate(dateStr: string): GEDCOMDate {
	const result: GEDCOMDate = { raw: dateStr };

	// Check for estimated dates
	if (dateStr.startsWith('ABT') || dateStr.startsWith('EST')) {
		result.isEstimated = true;
		dateStr = dateStr.replace(/^(ABT|EST)\s*/, '').trim();
	}

	// Month names
	const months: Record<string, number> = {
		JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
		JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12
	};

	const parts = dateStr.split(/\s+/);

	for (const part of parts) {
		const monthMatch = Object.entries(months).find(([month]) => part.toUpperCase().startsWith(month));
		if (monthMatch) {
			result.month = monthMatch[1];
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
 * Format: "City, Region, Country" (comma-separated)
 */
function parsePlace(placeStr: string): GEDCOMPlace {
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
export function dateToISO(date?: GEDCOMDate): string | undefined {
	if (!date || !date.year) return undefined;

	const year = date.year;
	const month = (date.month || 1).toString().padStart(2, '0');
	const day = (date.day || 1).toString().padStart(2, '0');

	return `${year}-${month}-${day}`;
}

/**
 * Format a place for display
 */
export function formatPlace(place?: GEDCOMPlace): string | undefined {
	if (!place) return undefined;
	return place.parts.join(', ');
}
