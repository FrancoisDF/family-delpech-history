import { fetchBuilderPeopleWithRelationsServer, fetchBuilderContentServer } from '$lib/server/builder';
import { loadFamilyData } from '$lib/ai/data';
import { getGEDCOMPeople } from '$lib/gedcom';
import type { PageServerLoad } from './$types';
import type { Person } from '$lib/models/person';

export const load: PageServerLoad = async (event) => {
	try {
		// Load GEDCOM data (generated at build time)
		const people = await getGEDCOMPeople();

		if (people.length === 0) {
			throw new Error('No genealogy data found. Please ensure GEDCOM file is processed at build time.');
		}

		// Fetch articles (always from Builder.io)
		const articles = await fetchBuilderContentServer('blog-articles', {
			limit: 100,
			omit: 'data.blocks, meta, folders, variations'
		});

		const personTagMap: Record<string, any> = {};
		const availableRootPeople: Array<{ id: string; name: string }> = [];

		for (const person of people) {
			const tagInfo = (person as any).tagId;
			if (tagInfo) {
				personTagMap[person.id] = {
					tagId: typeof tagInfo === 'string' ? tagInfo : tagInfo.id,
					tagData: tagInfo
				};
			}

			availableRootPeople.push({
				id: person.id,
				name: person.displayName
			});
		}

		return {
			people,
			personTagMap,
			articles,
			availableRootPeople,
			title: 'Arbre Généalogique Delpech',
			description: 'Explorez l\'arbre généalogique de la famille Delpech à travers les générations'
		};
	} catch (error) {
		console.error('Error loading genealogy data:', error);
		return {
			people: [],
			familyData: [],
			personTagMap: {},
			articles: [],
			availableRootPeople: [],
			title: 'Arbre Généalogique',
			description: 'Explorez l\'arbre généalogique'
		};
	}
};
