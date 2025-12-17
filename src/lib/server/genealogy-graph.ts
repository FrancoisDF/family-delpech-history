import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { GenealogyGraph, GraphNode, GraphEdge } from '$lib/types/genealogy-graph';

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
