import { loadGenealogyGraph, generateGraphFromPeople } from '$lib/server/genealogy-graph';
import { getGEDCOMPeople } from '$lib/gedcom';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	try {
		let graph = null;
		let error = null;

		// Load GEDCOM data (generated at build time)
		const people = await getGEDCOMPeople();

		if (people.length > 0) {
			// Generate graph from GEDCOM data
			graph = generateGraphFromPeople(people);
			if (!graph) {
				error = 'Failed to generate graph from genealogy data';
			}
		} else {
			// Try to load pre-generated graph as fallback
			graph = loadGenealogyGraph();
			if (!graph) {
				error = 'Genealogy graph data not found. Please ensure GEDCOM file is processed at build time.';
			}
		}

		return {
			graph,
			error,
			title: 'Arbre Généalogique Interactif',
			description: 'Explorez l\'arbre généalogique interactif de la famille Delpech'
		};
	} catch (error) {
		console.error('Error loading genealogy graph:', error);
		return {
			graph: null,
			error: 'Failed to load genealogy graph'
		};
	}
};
