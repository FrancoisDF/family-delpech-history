import { describe, it, expect, beforeEach } from 'vitest';
import { parseGEDCOM, dateToISO, formatPlace } from './gedcom/parser';
import { convertGEDCOMToPeople, validatePeopleData } from './gedcom/converter';
import { parseAndCacheGEDCOM, getGEDCOMPeople, clearGEDCOMCache, isGEDCOMLoaded } from './gedcom';

const sampleGEDCOM = `0 HEAD
1 SOUR SampleGEDCOM
1 VERS 5.5.1
1 CHAR UTF-8
0 @I1@ INDI
1 NAME Pierre /Delpech/
1 SEX M
1 BIRT
2 DATE 10 MAY 1760
2 PLAC Provence, France
1 DEAT
2 DATE 20 MAR 1835
2 PLAC Provence, France
1 OCCU Farmer
1 FAMS @F1@
0 @I2@ INDI
1 NAME Marguerite /Blanc/
1 SEX F
1 BIRT
2 DATE 15 AUG 1765
2 PLAC Provence, France
1 FAMS @F1@
0 @I3@ INDI
1 NAME Marie-Antoinette /Delpech/
1 SEX F
1 FAMC @F1@
1 FAMS @F2@
0 @I4@ INDI
1 NAME Antoine /Grognier/
1 SEX M
1 FAMS @F2@
0 @F1@ FAM
1 HUSB @I1@
1 WIFE @I2@
1 CHIL @I3@
1 MARR
2 DATE 1785
0 @F2@ FAM
1 HUSB @I4@
1 WIFE @I3@
1 CHIL @I5@
0 @I5@ INDI
1 NAME Louise /Grognier/
1 SEX F
1 FAMC @F2@
0 TRLR
`;

describe('GEDCOM Parser', () => {
	describe('parseGEDCOM', () => {
		it('should parse GEDCOM content', () => {
			const result = parseGEDCOM(sampleGEDCOM);
			expect(result.individuals.size).toBeGreaterThan(0);
			expect(result.families.size).toBeGreaterThan(0);
		});

		it('should extract individuals correctly', () => {
			const result = parseGEDCOM(sampleGEDCOM);
			const pierre = result.individuals.get('I1');

			expect(pierre).toBeDefined();
			expect(pierre?.name.given).toBe('Pierre');
			expect(pierre?.name.family).toBe('Delpech');
			expect(pierre?.sex).toBe('M');
			expect(pierre?.occupation).toBe('Farmer');
		});

		it('should parse birth dates', () => {
			const result = parseGEDCOM(sampleGEDCOM);
			const pierre = result.individuals.get('I1');

			expect(pierre?.birthDate).toBeDefined();
			expect(pierre?.birthDate?.year).toBe(1760);
			expect(pierre?.birthDate?.month).toBe(5);
			expect(pierre?.birthDate?.day).toBe(10);
		});

		it('should parse places', () => {
			const result = parseGEDCOM(sampleGEDCOM);
			const pierre = result.individuals.get('I1');

			expect(pierre?.birthPlace).toBeDefined();
			expect(pierre?.birthPlace?.parts).toContain('Provence');
			expect(pierre?.birthPlace?.parts).toContain('France');
		});

		it('should extract families correctly', () => {
			const result = parseGEDCOM(sampleGEDCOM);
			const family1 = result.families.get('F1');

			expect(family1).toBeDefined();
			expect(family1?.husband).toBe('I1');
			expect(family1?.wife).toBe('I2');
			expect(family1?.children).toContain('I3');
		});

		it('should link individuals to families', () => {
			const result = parseGEDCOM(sampleGEDCOM);
			const pierre = result.individuals.get('I1');

			expect(pierre?.fams).toContain('F1');
		});

		it('should link children to parent families', () => {
			const result = parseGEDCOM(sampleGEDCOM);
			const marie = result.individuals.get('I3');

			expect(marie?.famc).toContain('F1');
		});
	});

	describe('dateToISO', () => {
		it('should convert complete date to ISO format', () => {
			const date = { raw: '10 MAY 1760', year: 1760, month: 5, day: 10 };
			const iso = dateToISO(date);
			expect(iso).toBe('1760-05-10');
		});

		it('should handle partial dates', () => {
			const date = { raw: '1760', year: 1760 };
			const iso = dateToISO(date);
			expect(iso).toBe('1760-01-01');
		});

		it('should return undefined for missing year', () => {
			const date = { raw: 'unknown' };
			const iso = dateToISO(date);
			expect(iso).toBeUndefined();
		});
	});

	describe('formatPlace', () => {
		it('should format place correctly', () => {
			const place = { raw: 'Provence, France', parts: ['Provence', 'France'] };
			const formatted = formatPlace(place);
			expect(formatted).toBe('Provence, France');
		});
	});

	describe('convertGEDCOMToPeople', () => {
		it('should convert GEDCOM to Person array', () => {
			const parseResult = parseGEDCOM(sampleGEDCOM);
			const people = convertGEDCOMToPeople(parseResult);

			expect(people.length).toBeGreaterThan(0);
		});

		it('should convert individual details correctly', () => {
			const parseResult = parseGEDCOM(sampleGEDCOM);
			const people = convertGEDCOMToPeople(parseResult);
			const pierre = people.find((p) => p.id === 'I1');

			expect(pierre).toBeDefined();
			expect(pierre?.givenName).toBe('Pierre');
			expect(pierre?.familyName).toBe('Delpech');
			expect(pierre?.displayName).toBe('Pierre Delpech');
			expect(pierre?.gender).toBe('male');
			expect(pierre?.occupation).toBeUndefined();
			expect(pierre?.bio).toContain('Farmer');
		});

		it('should establish spouse relationships', () => {
			const parseResult = parseGEDCOM(sampleGEDCOM);
			const people = convertGEDCOMToPeople(parseResult);
			const pierre = people.find((p) => p.id === 'I1');
			const marguerite = people.find((p) => p.id === 'I2');

			expect(pierre?.spouses).toContain('I2');
			expect(marguerite?.spouses).toContain('I1');
		});

		it('should establish parent-child relationships', () => {
			const parseResult = parseGEDCOM(sampleGEDCOM);
			const people = convertGEDCOMToPeople(parseResult);
			const pierre = people.find((p) => p.id === 'I1');
			const marie = people.find((p) => p.id === 'I3');

			expect(pierre?.children).toContain('I3');
			expect(marie?.parents).toContain('I1');
			expect(marie?.parents).toContain('I2');
		});

		it('should establish sibling relationships', () => {
			const parseResult = parseGEDCOM(sampleGEDCOM);
			const people = convertGEDCOMToPeople(parseResult);
			const marie = people.find((p) => p.id === 'I3');

			// Marie has no siblings in this test data
			expect(marie?.siblings).toBeDefined();
			expect(Array.isArray(marie?.siblings)).toBe(true);
		});

		it('should convert dates correctly', () => {
			const parseResult = parseGEDCOM(sampleGEDCOM);
			const people = convertGEDCOMToPeople(parseResult);
			const pierre = people.find((p) => p.id === 'I1');

			expect(pierre?.birthDate).toBe('1760-05-10');
			expect(pierre?.deathDate).toBe('1835-03-20');
		});
	});

	describe('validatePeopleData', () => {
		it('should validate correct people data', () => {
			const parseResult = parseGEDCOM(sampleGEDCOM);
			const people = convertGEDCOMToPeople(parseResult);
			const validation = validatePeopleData(people);

			expect(validation.valid).toBe(true);
			expect(validation.errors).toHaveLength(0);
		});

		it('should detect empty people array', () => {
			const validation = validatePeopleData([]);
			expect(validation.valid).toBe(false);
			expect(validation.errors.length).toBeGreaterThan(0);
		});
	});

	describe('GEDCOM Cache', () => {
		beforeEach(() => {
			clearGEDCOMCache();
		});

		it('should cache parsed GEDCOM data', () => {
			const result = parseAndCacheGEDCOM(sampleGEDCOM);

			expect(result.success).toBe(true);
			expect(result.people.length).toBeGreaterThan(0);
		});

		it('should retrieve cached data', () => {
			parseAndCacheGEDCOM(sampleGEDCOM);
			const people = getGEDCOMPeople();

			expect(people.length).toBeGreaterThan(0);
		});

		it('should check if GEDCOM is loaded', () => {
			clearGEDCOMCache();
			expect(isGEDCOMLoaded()).toBe(false);

			parseAndCacheGEDCOM(sampleGEDCOM);
			expect(isGEDCOMLoaded()).toBe(true);

			clearGEDCOMCache();
			expect(isGEDCOMLoaded()).toBe(false);
		});
	});
});
