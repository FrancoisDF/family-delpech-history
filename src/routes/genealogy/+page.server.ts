import { fetchBuilderPeopleWithRelationsServer, fetchBuilderContentServer } from '$lib/server/builder';
import { loadFamilyData } from '$lib/ai/data';
import type { PageServerLoad } from './$types';
import type { Person } from '$lib/models/person';

export const load: PageServerLoad = async (event) => {
	try {
		const [people, articles] = await Promise.all([
			fetchBuilderPeopleWithRelationsServer(),
			fetchBuilderContentServer('blog-articles', {
				limit: 100,
				omit: 'data.blocks, meta, folders, variations'
			})
		]);

		if (people.length === 0) {
			throw new Error('No people data retrieved from Builder.io');
		}

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
