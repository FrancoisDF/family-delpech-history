#!/usr/bin/env node
/**
 * Parse Mermaid genealogy graph from genealogy-tree.md
 * Converts Mermaid syntax to JSON structure for interactive visualization
 *
 * Usage:
 *   node scripts/parse-mermaid-graph.mjs
 *
 * Output:
 *   static/genealogy-graph.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');

/**
 * Parse Mermaid graph from genealogy-tree.md
 */
function parseMermaidGraph() {
	const genealogyTreePath = path.join(PROJECT_ROOT, 'docs', 'genealogy-tree.md');

	if (!fs.existsSync(genealogyTreePath)) {
		throw new Error(`genealogy-tree.md not found at ${genealogyTreePath}`);
	}

	const content = fs.readFileSync(genealogyTreePath, 'utf-8');

	// Extract mermaid code block
	const mermaidMatch = content.match(/```mermaid\n([\s\S]*?)```/);
	if (!mermaidMatch) {
		throw new Error('No mermaid code block found in genealogy-tree.md');
	}

	const mermaidCode = mermaidMatch[1];
	const lines = mermaidCode.split('\n').filter((line) => line.trim());

	const nodes = [];
	const edges = [];
	const nodeMap = new Map(); // id -> node

	// Parse node declarations: nodeId["label"]
	const nodePattern = /^\s*(\w[\w\-]*)\["([^"]+)"\]/;
	// Parse edges: source --> target
	const edgePattern = /^\s*(\w[\w\-]*)\s*-->\s*(\w[\w\-]*)/;

	for (const line of lines) {
		const nodeMatch = line.match(nodePattern);
		if (nodeMatch) {
			const [, id, label] = nodeMatch;
			const node = {
				id,
				type: id.startsWith('couple-') ? 'couple' : 'person',
				label
			};

			// If couple node, extract spouse IDs
			if (node.type === 'couple') {
				// couple-id1_id2 format
				const spouseMatch = id.match(/^couple-(.+)_(.+)$/);
				if (spouseMatch) {
					node.spouses = [spouseMatch[1], spouseMatch[2]];
				}
			}

			nodes.push(node);
			nodeMap.set(id, node);
			continue;
		}

		const edgeMatch = line.match(edgePattern);
		if (edgeMatch) {
			const [, source, target] = edgeMatch;

			// Classify edge type
			let type = 'unknown';
			const sourceNode = nodeMap.get(source);
			const targetNode = nodeMap.get(target);

			if (sourceNode && targetNode) {
				if (sourceNode.type === 'couple' && targetNode.type === 'person') {
					type = 'couple-to-child';
				} else if (sourceNode.type === 'couple' && targetNode.type === 'couple') {
					type = 'couple-to-couple';
				} else if (sourceNode.type === 'person' && targetNode.type === 'couple') {
					type = 'spouse-to-couple';
				} else if (sourceNode.type === 'person' && targetNode.type === 'person') {
					type = 'parent-to-child';
				}
			}

			edges.push({
				source,
				target,
				type
			});
		}
	}

	return {
		nodes,
		edges
	};
}

/**
 * Classify nodes by type and count generations
 */
function analyzeGraph(nodes, edges) {
	const nodeCount = nodes.length;
	const peopleCount = nodes.filter((n) => n.type === 'person').length;
	const coupleCount = nodes.filter((n) => n.type === 'couple').length;
	const edgeCount = edges.length;

	// Find root nodes (no incoming edges)
	const incomingEdges = new Set();
	for (const edge of edges) {
		incomingEdges.add(edge.target);
	}

	const rootNodes = nodes.filter((n) => !incomingEdges.has(n.id));

	// Calculate generations using BFS from root nodes
	const generations = new Map(); // nodeId -> generation level
	const visited = new Set();

	function bfs(nodeId, gen = 0) {
		if (visited.has(nodeId)) return;
		visited.add(nodeId);
		generations.set(nodeId, gen);

		// Find all children of this node
		for (const edge of edges) {
			if (edge.source === nodeId && !visited.has(edge.target)) {
				bfs(edge.target, gen + 1);
			}
		}
	}

	// Start BFS from each root node
	for (const rootNode of rootNodes) {
		bfs(rootNode.id, 0);
	}

	const maxGeneration = Math.max(...Array.from(generations.values()));
	const generationLevels = maxGeneration + 1;

	return {
		nodeCount,
		peopleCount,
		coupleCount,
		edgeCount,
		rootNodes: rootNodes.map((n) => n.id),
		generationLevels,
		generations
	};
}

/**
 * Calculate node positions for hierarchical layout
 */
function calculateLayout(nodes, edges, analysis) {
	const nodePositions = new Map();

	// Layout parameters
	const verticalSpacing = 150;
	const horizontalSpacing = 200;
	const topMargin = 50;
	const leftMargin = 50;

	// Group nodes by generation
	const generationGroups = new Map();
	for (const [nodeId, gen] of analysis.generations.entries()) {
		if (!generationGroups.has(gen)) {
			generationGroups.set(gen, []);
		}
		generationGroups.get(gen).push(nodeId);
	}

	// Assign x positions within each generation
	for (let gen = 0; gen < analysis.generationLevels; gen++) {
		const generationNodes = generationGroups.get(gen) || [];
		const nodeCount = generationNodes.length;

		for (let i = 0; i < nodeCount; i++) {
			const nodeId = generationNodes[i];
			const x = leftMargin + i * horizontalSpacing;
			const y = topMargin + gen * verticalSpacing;

			nodePositions.set(nodeId, { x, y });
		}
	}

	// Calculate bounding box
	let minX = Infinity,
		maxX = -Infinity,
		minY = Infinity,
		maxY = -Infinity;
	for (const [, pos] of nodePositions.entries()) {
		minX = Math.min(minX, pos.x);
		maxX = Math.max(maxX, pos.x);
		minY = Math.min(minY, pos.y);
		maxY = Math.max(maxY, pos.y);
	}

	return {
		positions: nodePositions,
		bounds: {
			minX,
			maxX,
			minY,
			maxY,
			width: maxX - minX + 200,
			height: maxY - minY + 200
		}
	};
}

/**
 * Generate output JSON structure
 */
function generateJSON(nodes, edges, analysis, layout) {
	const nodesWithPositions = nodes.map((node) => ({
		...node,
		position: layout.positions.get(node.id) || { x: 0, y: 0 }
	}));

	return {
		metadata: {
			generatedAt: new Date().toISOString(),
			totalNodes: analysis.nodeCount,
			totalPeople: analysis.peopleCount,
			totalCouples: analysis.coupleCount,
			totalEdges: analysis.edgeCount,
			generationLevels: analysis.generationLevels,
			rootNodes: analysis.rootNodes,
			canvasBounds: layout.bounds
		},
		nodes: nodesWithPositions,
		edges
	};
}

/**
 * Main execution
 */
async function main() {
	try {
		console.log('📊 Parsing Mermaid genealogy graph...');

		const { nodes, edges } = parseMermaidGraph();
		console.log(`✓ Found ${nodes.length} nodes and ${edges.length} edges`);

		const analysis = analyzeGraph(nodes, edges);
		console.log(
			`✓ Identified ${analysis.rootNodes.length} root ancestors and ${analysis.generationLevels} generations`
		);

		const layout = calculateLayout(nodes, edges, analysis);
		console.log(`✓ Calculated node positions`);

		const output = generateJSON(nodes, edges, analysis, layout);

		const outputPath = path.join(PROJECT_ROOT, 'static', 'genealogy-graph.json');
		const outputDir = path.dirname(outputPath);

		// Ensure static directory exists
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true });
			console.log(`✓ Created directory: ${outputDir}`);
		}

		fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
		console.log(`✅ Generated genealogy graph: ${outputPath}`);
		console.log(`   Nodes: ${output.metadata.totalNodes}`);
		console.log(`   People: ${output.metadata.totalPeople}`);
		console.log(`   Couples: ${output.metadata.totalCouples}`);
		console.log(`   Edges: ${output.metadata.totalEdges}`);
		console.log(`   Generations: ${output.metadata.generationLevels}`);
	} catch (error) {
		console.error('❌ Error parsing Mermaid graph:', error.message);
		process.exit(1);
	}
}

main();
