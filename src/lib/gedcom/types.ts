/**
 * GEDCOM Data Type Definitions
 * Represents parsed GEDCOM structures
 */

export interface GEDCOMDate {
	raw: string;
	year?: number;
	month?: number;
	day?: number;
	isEstimated?: boolean;
}

export interface GEDCOMPlace {
	raw: string;
	parts: string[];
	city?: string;
	region?: string;
	country?: string;
}

export interface GEDCOMEvent {
	type: 'BIRT' | 'DEAT' | 'MARR' | 'DIV' | 'OCCU' | 'NOTE' | string;
	date?: GEDCOMDate;
	place?: GEDCOMPlace;
	description?: string;
}

export interface GEDCOMName {
	full: string;
	given: string;
	family: string;
	prefix?: string;
	suffix?: string;
}

export interface GEDCOMIndividual {
	id: string;
	name: GEDCOMName;
	sex?: 'M' | 'F' | 'U';
	birthDate?: GEDCOMDate;
	birthPlace?: GEDCOMPlace;
	deathDate?: GEDCOMDate;
	deathPlace?: GEDCOMPlace;
	occupation?: string;
	bio?: string;
	events: GEDCOMEvent[];
	famc?: string[]; // Family as child (parent family IDs)
	fams?: string[]; // Family as spouse (spouse family IDs)
	photoUrl?: string;
}

export interface GEDCOMFamily {
	id: string;
	husband?: string; // Individual ID
	wife?: string; // Individual ID
	children: string[]; // Individual IDs
	marriageDate?: GEDCOMDate;
	divorceDate?: GEDCOMDate;
}

export interface GEDCOMParseResult {
	individuals: Map<string, GEDCOMIndividual>;
	families: Map<string, GEDCOMFamily>;
	errors: string[];
	warnings: string[];
	totalLines: number;
	parsedAt: Date;
}

export interface GEDCOMParseError {
	line: number;
	message: string;
	severity: 'error' | 'warning';
}
