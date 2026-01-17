import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { GenealogyGraph, GraphNode, GraphEdge, CanvasBounds } from '$lib/types/genealogy-graph';
import type { Person } from '$lib/models/person';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '../../..');

/**
 * Load genealogy graph from JSON file
 */
export function loadGenealogyGraph(): GenealogyGraph | null {
	try {
		const graphPath = path.join(PROJECT_ROOT, 'static', 'genealogy-graph.json');
		const content = readFileSync(graphPath, 'utf-8');
		const graph = JSON.parse(content) as GenealogyGraph;
		return graph;
	} catch (error) {
		console.error('Error loading genealogy graph:', error);
		return null;
	}
}

/**
 * Generate genealogy graph from Person[] array
 * Used when loading from GEDCOM or other sources
 */
export function generateGraphFromPeople(people: Person[]): GenealogyGraph {
	const nodes: GraphNode[] = [];
	const edges: GraphEdge[] = [];
	const personMap = new Map(people.map((p) => [p.id, p]));

	const generationMap = new Map<string, number>();
	let maxGeneration = 0;

	// Find root people (those without parents)
	const rootPeople: string[] = [];
	for (const person of people) {
		if ((person.parents ?? []).length === 0) {
			rootPeople.push(person.id);
			generationMap.set(person.id, 0);
		}
	}

	// Assign generation levels using BFS
	const visited = new Set<string>();
	const queue: string[] = [...rootPeople];

	while (queue.length > 0) {
		const personId = queue.shift()!;
		if (visited.has(personId)) continue;
		visited.add(personId);

		const person = personMap.get(personId);
		if (!person) continue;

		const currentGen = generationMap.get(personId) || 0;
		maxGeneration = Math.max(maxGeneration, currentGen);

		// Add children to queue with next generation
		for (const childId of person.children ?? []) {
			if (!generationMap.has(childId)) {
				generationMap.set(childId, currentGen + 1);
				queue.push(childId);
			}
		}
	}

	// Create nodes for people
	const nodePositions = new Map<string, { x: number; y: number }>();
	const generationNodeMap = new Map<number, string[]>();

	for (const person of people) {
		const generation = generationMap.get(person.id) || 0;
		if (!generationNodeMap.has(generation)) {
			generationNodeMap.set(generation, []);
		}
		generationNodeMap.get(generation)!.push(person.id);

		nodes.push({
			id: person.id,
			type: 'person',
			label: person.displayName,
			position: { x: 0, y: 0 }
		});
	}

	// Create couple nodes for spouse relationships
	const couplesCreated = new Set<string>();
	const spouseMap = new Map<string, string[]>();

	for (const person of people) {
		const spouses = person.spouses ?? [];
		if (spouses.length > 0) {
			for (const spouseId of spouses) {
				const sorted = [person.id, spouseId].sort();
				const coupleId = `couple-${sorted.join('_')}`;

				if (!couplesCreated.has(coupleId)) {
					couplesCreated.add(coupleId);

					const spouse = personMap.get(spouseId);
					const couple = personMap.get(person.id);
					const label = couple && spouse ? `${couple.displayName} & ${spouse.displayName}` : coupleId;

					nodes.push({
						id: coupleId,
						type: 'couple',
						label,
						position: { x: 0, y: 0 },
						spouses: sorted
					});

					// Add edges from both spouses to couple
					edges.push({
						source: person.id,
						target: coupleId,
						type: 'spouse-to-couple'
					});

					edges.push({
						source: spouseId,
						target: coupleId,
						type: 'spouse-to-couple'
					});

					spouseMap.set(coupleId, sorted);
				}
			}
		}
	}

	// Create edges for parent-child relationships
	for (const person of people) {
		const children = person.children ?? [];
		if (children.length > 0) {
			// Find couple node for this person
			let coupleId: string | null = null;

			const spouses = person.spouses ?? [];
			if (spouses.length > 0) {
				const sorted = [person.id, spouses[0]].sort();
				coupleId = `couple-${sorted.join('_')}`;
			}

			for (const childId of children) {
				if (coupleId) {
					edges.push({
						source: coupleId,
						target: childId,
						type: 'couple-to-child'
					});
				} else {
					edges.push({
						source: person.id,
						target: childId,
						type: 'parent-to-child'
					});
				}
			}
		}
	}

	// Calculate positions based on generation
	let yPos = 0;
	const generationHeight = 200;
	const siblingSpacing = 200;

	for (let gen = 0; gen <= maxGeneration; gen++) {
		const peopleInGen = generationNodeMap.get(gen) || [];
		const totalWidth = peopleInGen.length * siblingSpacing;
		const startX = -totalWidth / 2;

		for (let i = 0; i < peopleInGen.length; i++) {
			const personId = peopleInGen[i];
			const node = nodes.find((n) => n.id === personId);
			if (node) {
				node.position = {
					x: startX + i * siblingSpacing,
					y: yPos
				};
			}
		}

		yPos += generationHeight;
	}

	// Calculate canvas bounds
	let minX = 0,
		maxX = 0,
		minY = 0,
		maxY = 0;
	for (const node of nodes) {
		minX = Math.min(minX, node.position.x);
		maxX = Math.max(maxX, node.position.x);
		minY = Math.min(minY, node.position.y);
		maxY = Math.max(maxY, node.position.y);
	}

	const canvasBounds: CanvasBounds = {
		minX: minX - 100,
		maxX: maxX + 100,
		minY: minY - 100,
		maxY: maxY + 100,
		width: maxX - minX + 200,
		height: maxY - minY + 200
	};

	const graph: GenealogyGraph = {
		metadata: {
			generatedAt: new Date().toISOString(),
			totalNodes: nodes.length,
			totalPeople: people.length,
			totalCouples: couplesCreated.size,
			totalEdges: edges.length,
			generationLevels: maxGeneration + 1,
			rootNodes: rootPeople,
			canvasBounds
		},
		nodes,
		edges
	};

	return graph;
}

/**
 * Get connected nodes (both inbound and outbound)
 */
export function getConnectedNodes(nodeId: string, edges: GraphEdge[]): string[] {
	const connected = new Set<string>();

	for (const edge of edges) {
		if (edge.source === nodeId) {
			connected.add(edge.target);
		}
		if (edge.target === nodeId) {
			connected.add(edge.source);
		}
	}

	return Array.from(connected);
}

/**
 * Get all descendants of a node
 */
export function getDescendants(nodeId: string, edges: GraphEdge[]): string[] {
	const descendants = new Set<string>();
	const visited = new Set<string>();

	function traverse(id: string) {
		if (visited.has(id)) return;
		visited.add(id);

		for (const edge of edges) {
			if (edge.source === id && !visited.has(edge.target)) {
				descendants.add(edge.target);
				traverse(edge.target);
			}
		}
	}

	traverse(nodeId);
	return Array.from(descendants);
}

/**
 * Get all ancestors of a node
 */
export function getAncestors(nodeId: string, edges: GraphEdge[]): string[] {
	const ancestors = new Set<string>();
	const visited = new Set<string>();

	function traverse(id: string) {
		if (visited.has(id)) return;
		visited.add(id);

		for (const edge of edges) {
			if (edge.target === id && !visited.has(edge.source)) {
				ancestors.add(edge.source);
				traverse(edge.source);
			}
		}
	}

	traverse(nodeId);
	return Array.from(ancestors);
}

/**
 * Find a node by ID
 */
export function findNode(nodeId: string, nodes: GraphNode[]): GraphNode | undefined {
	return nodes.find((node) => node.id === nodeId);
}

/**
 * Get all edges connected to a node
 */
export function getEdgesForNode(nodeId: string, edges: GraphEdge[]): GraphEdge[] {
	return edges.filter((edge) => edge.source === nodeId || edge.target === nodeId);
}

/**
 * Filter nodes by type
 */
export function filterNodesByType(
	nodes: GraphNode[],
	type: 'person' | 'couple'
): GraphNode[] {
	return nodes.filter((node) => node.type === type);
}

/**
 * Search nodes by label
 */
export function searchNodesByLabel(nodes: GraphNode[], query: string): GraphNode[] {
	const lowerQuery = query.toLowerCase();
	return nodes.filter((node) => node.label.toLowerCase().includes(lowerQuery));
}

/**
 * Get statistics about the graph
 */
export function getGraphStatistics(graph: GenealogyGraph) {
	const { nodes, edges } = graph;
	const { totalPeople, totalCouples, generationLevels } = graph.metadata;

	// Calculate average generation size
	const nodesByGeneration = new Map<string, number>();
	for (const node of nodes) {
		// Try to determine generation from node - would need to traverse edges
	}

	return {
		totalPeople,
		totalCouples,
		totalEdges: edges.length,
		generationLevels,
		averageNodesPerGeneration: nodes.length / generationLevels
	};
}
