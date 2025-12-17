import { loadGenealogyGraph } from '$lib/server/genealogy-graph';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	try {
		const graph = loadGenealogyGraph();

		if (!graph) {
			console.warn('Genealogy graph not found. Please run: npm run parse:mermaid-graph');
			return {
				graph: null,
				error: 'Genealogy graph data not found. Please generate it first.'
			};
		}

		return {
			graph,
			error: null,
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
