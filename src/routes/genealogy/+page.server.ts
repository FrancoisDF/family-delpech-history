import { loadPeopleData } from '$lib/genealogy';
import { loadFamilyData } from '$lib/ai/data';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	try {
		const [people, familyData] = await Promise.all([
			loadPeopleData(),
			loadFamilyData()
		]);

		return {
			people,
			familyData,
			title: 'Arbre Généalogique Delpech',
			description: 'Explorez l\'arbre généalogique de la famille Delpech à travers les générations'
		};
	} catch (error) {
		console.error('Error loading genealogy data:', error);
		return {
			people: [],
			familyData: [],
			title: 'Arbre Généalogique',
			description: 'Explorez l\'arbre généalogique'
		};
	}
};
