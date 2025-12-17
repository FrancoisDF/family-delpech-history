export interface Person {
	id: string;
	givenName: string;
	familyName: string;
	displayName: string;
	birthDate?: string;
	deathDate?: string;
	birthPlace?: string;
	deathPlace?: string;
	bio?: string;
	gender?: 'male' | 'female' | 'other';
	sources: string[];
	photoUrl?: string;
	tags?: string[];
}

export interface PersonWithRelations extends Person {
	parentObjects?: Person[];
	spouseObjects?: Person[];
	childObjects?: Person[];
	siblingObjects?: Person[];
}

export interface TreeNode {
	person: Person;
	ancestors: Person[];
	descendants: Person[];
	generation: number;
}

export interface RelationshipType {
	type: 'parent' | 'spouse' | 'child' | 'sibling';
	personId: string;
}
