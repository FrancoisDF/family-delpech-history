#!/usr/bin/env node
/**
 * Generate genealogy tree diagram from Builder.io person model
 *
 * This script:
 * 1. Fetches all people from the Builder.io "person" model using the SDK
 * 2. Extracts person IDs and their relationships (spouses, children)
 * 3. Generates a Mermaid flowchart showing the family tree structure
 * 4. Outputs to docs/genealogy-tree.md
 *
 * Usage:
 *   npm run generate:genealogy-tree
 *
 * Requirements:
 *   PUBLIC_BUILDER_API_KEY environment variable must be set
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');

/**
 * Load environment variables from .env files
 */
function loadEnv() {
	const envFiles = ['.env.local', '.env.development.local', '.env'];

	for (const envFile of envFiles) {
		const envPath = path.join(PROJECT_ROOT, envFile);
		if (fs.existsSync(envPath)) {
			const content = fs.readFileSync(envPath, 'utf-8');
			const lines = content.split('\n');

			for (const line of lines) {
				const trimmed = line.trim();
				if (trimmed && !trimmed.startsWith('#')) {
					const [key, ...valueParts] = trimmed.split('=');
					const value = valueParts.join('=').trim();

					// Remove quotes if present
					const cleanValue = value.replace(/^['"]|['"]$/g, '');

					if (key && !process.env[key]) {
						process.env[key] = cleanValue;
					}
				}
			}
		}
	}
}

loadEnv();

const API_KEY = process.env.PUBLIC_BUILDER_API_KEY;
if (!API_KEY) {
	console.error('Error: PUBLIC_BUILDER_API_KEY environment variable is not set');
	console.error('Please set PUBLIC_BUILDER_API_KEY in one of these files:');
	console.error('  - .env.local');
	console.error('  - .env.development.local');
	console.error('  - .env');
	console.error('Or set it as an environment variable before running this script');
	process.exit(1);
}

/**
 * Fetch all people from Builder.io using REST API
 */
async function fetchAllBuilderPeople() {
	try {
		// Try the Builder.io REST API endpoint with just the model name
		const apiUrl = new URL('https://cdn.builder.io/api/v3/content/person');
		apiUrl.searchParams.append('apiKey', API_KEY);
		apiUrl.searchParams.append('limit', '100');

		console.log('  Fetching from Builder.io REST API...');

		const response = await fetch(apiUrl.toString());

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`Builder API returned ${response.status}: ${response.statusText}\nResponse: ${errorText.substring(0, 500)}`
			);
		}

		const contentType = response.headers.get('content-type');
		if (!contentType?.includes('application/json')) {
			const text = await response.text();
			throw new Error(
				`Expected JSON response, got ${contentType}. Response starts with: ${text.substring(0, 100)}`
			);
		}

		const data = await response.json();
		return (data.results || data.content || []);
	} catch (error) {
		console.error('Error fetching people from Builder.io:', error instanceof Error ? error.message : error);
		throw error;
	}
}

/**
 * Create a map of Builder content IDs to person IDs
 */
function createContentIdToPersonIdMap(builderPeople) {
	const map = new Map();
	for (const person of builderPeople) {
		const personId = person.data?.personId;
		if (personId && person.id) {
			map.set(person.id, personId);
		}
	}
	return map;
}

/**
 * Extract person data with relationships
 */
function extractPersonRelationships(builderPeople, contentIdToPersonIdMap) {
	const people = new Map();

	// First pass: create person nodes
	for (const builderPerson of builderPeople) {
		const personId = builderPerson.data?.personId;
		if (!personId) continue;

		people.set(personId, {
			id: personId,
			spouses: [],
			children: [],
			parents: [] // Will be populated in next pass
		});
	}

	// Second pass: extract relationships
	for (const builderPerson of builderPeople) {
		const personId = builderPerson.data?.personId;
		if (!personId) continue;

		const person = people.get(personId);
		const data = builderPerson.data;

		// Extract spouses
		if (Array.isArray(data?.spouses)) {
			for (const spouseRef of data.spouses) {
				const spouseContentId = spouseRef?.id;
				if (spouseContentId) {
					const spousePersonId = contentIdToPersonIdMap.get(spouseContentId);
					if (spousePersonId && !person.spouses.includes(spousePersonId)) {
						person.spouses.push(spousePersonId);
					}
				}
			}
		}

		// Extract children
		if (Array.isArray(data?.children)) {
			for (const childRef of data.children) {
				const childContentId = childRef?.id;
				if (childContentId) {
					const childPersonId = contentIdToPersonIdMap.get(childContentId);
					if (childPersonId && !person.children.includes(childPersonId)) {
						person.children.push(childPersonId);
					}
				}
			}
		}
	}

	// Third pass: populate parents (inverse of children relationship)
	for (const [personId, person] of people.entries()) {
		for (const childId of person.children) {
			const child = people.get(childId);
			if (child && !child.parents.includes(personId)) {
				child.parents.push(personId);
			}
		}
	}

	return people;
}

/**
 * Find root ancestors (people with no parents)
 */
function findRootAncestors(people) {
	const roots = [];
	for (const [id, person] of people.entries()) {
		if (person.parents.length === 0) {
			roots.push(id);
		}
	}
	return roots.sort();
}

/**
 * Generate couple ID from sorted spouse IDs
 */
function generateCoupleId(spouse1Id, spouse2Id) {
	const sorted = [spouse1Id, spouse2Id].sort();
	return `couple-${sorted.join('_')}`;
}

/**
 * Get display name for a couple (combine spouse IDs with &)
 */
function generateCoupleLabel(spouse1Id, spouse2Id) {
	return `${spouse1Id} & ${spouse2Id}`;
}

/**
 * Generate Mermaid diagram syntax with couple nodes
 */
function generateMermaidDiagram(people) {
	const lines = ['graph TD'];

	// Track couples to avoid duplicates
	const couples = new Map(); // coupleId -> { spouse1, spouse2 }
	const peopleWithCouples = new Map(); // personId -> [coupleIds]

	// First pass: identify all couples
	for (const [personId, person] of people.entries()) {
		if (person.spouses.length > 0) {
			peopleWithCouples.set(personId, []);
			for (const spouseId of person.spouses) {
				const coupleId = generateCoupleId(personId, spouseId);
				if (!couples.has(coupleId)) {
					couples.set(coupleId, { spouse1: personId, spouse2: spouseId });
				}
				peopleWithCouples.get(personId).push(coupleId);
			}
		}
	}

	// Create person node declarations
	const nodeIds = Array.from(people.keys()).sort();
	for (const id of nodeIds) {
		lines.push(`    ${id}["${id}"]`);
	}

	lines.push('');

	// // Create couple node declarations
	// for (const [coupleId, coupleData] of couples.entries()) {
	// 	const label = generateCoupleLabel(coupleData.spouse1, coupleData.spouse2);
	// 	lines.push(`    ${coupleId}["${label}"]`);
	// }

	// lines.push('');

	// // Create edges: Person -> Couple <- Other Person
	// const addedEdges = new Set();
	// for (const [coupleId, coupleData] of couples.entries()) {
	// 	const edge1 = `${coupleData.spouse1} --> ${coupleId}`;
	// 	const edge2 = `${coupleData.spouse2} --> ${coupleId}`;

	// 	if (!addedEdges.has(edge1)) {
	// 		lines.push(`    ${edge1}`);
	// 		addedEdges.add(edge1);
	// 	}
	// 	if (!addedEdges.has(edge2)) {
	// 		lines.push(`    ${edge2}`);
	// 		addedEdges.add(edge2);
	// 	}
	// }

	// lines.push('');

	// Create edges: Couple -> Children
	// for (const [personId, person] of people.entries()) {
	// 	const coupleIds = peopleWithCouples.get(personId) || [];

	// 	for (const childId of person.children) {
	// 		// If person has a couple, connect couple to child, otherwise connect person to child
	// 		if (coupleIds.length > 0) {
	// 			for (const coupleId of coupleIds) {
	// 				const edgeKey = `${coupleId}->${childId}`;
	// 				if (!addedEdges.has(edgeKey)) {
	// 					lines.push(`    ${coupleId} --> ${childId}`);
	// 					addedEdges.add(edgeKey);
	// 				}
	// 			}
	// 		} else {
	// 			// Single parent (no spouse in the dataset)
	// 			const edgeKey = `${personId}->${childId}`;
	// 			if (!addedEdges.has(edgeKey)) {
	// 				lines.push(`    ${personId} --> ${childId}`);
	// 				addedEdges.add(edgeKey);
	// 			}
	// 		}
	// 	}
	// }

	return lines.join('\n');
}

/**
 * Generate markdown content with Mermaid diagram
 */
function generateMarkdownContent(mermaidDiagram, peopleCount, rootCount, timestamp) {
	const lines = [
		'# Genealogy Tree Diagram',
		'',
		`Generated from Builder.io person model on **${timestamp}**`,
		'',
		'## Overview',
		`- **Total people**: ${peopleCount}`,
		`- **Root ancestors**: ${rootCount}`,
		'',
		'## Mermaid Diagram',
		'',
		'```mermaid',
		mermaidDiagram,
		'```',
		'',
		'## How to Extend',
		'',
		'To add new people to the genealogy tree:',
		'',
		'1. Create a new person record in the **Builder.io person model**',
		'2. Set the `personId` field to a unique kebab-case ID (e.g., `jean-doe`)',
		'3. Fill in other fields: `givenName`, `familyName`, `displayName`, `birthDate`, `deathDate`, etc.',
		'4. Run the generation script: `npm run generate:genealogy-tree`',
		'5. Commit the updated `docs/genealogy-tree.md` file',
		'',
		'## Notes',
		'',
		'- **Person details are stored in Builder.io**: This file contains only the family tree structure (IDs and relationships)',
		'- **Mermaid format**: The diagram uses Mermaid flowchart syntax, which is supported by GitHub, GitLab, and many markdown renderers',
		'- **Automatic generation**: This file is auto-generated from the Builder person model — edit person records in Builder, not this file'
	];

	return lines.join('\n');
}

/**
 * Main execution
 */
async function main() {
	try {
		console.log('🔄 Fetching people from Builder.io...');
		const builderPeople = await fetchAllBuilderPeople();

		if (builderPeople.length === 0) {
			console.warn('⚠️  No people found in Builder.io person model');
		}

		console.log(`✓ Found ${builderPeople.length} people`);

		const contentIdToPersonIdMap = createContentIdToPersonIdMap(builderPeople);
		console.log(`✓ Created ID mapping for ${contentIdToPersonIdMap.size} people`);

		// const people = extractPersonRelationships(builderPeople, contentIdToPersonIdMap);
		// console.log(`✓ Extracted relationships for ${people.size} people`);

		// const roots = findRootAncestors(people);
		// console.log(`✓ Found ${roots.length} root ancestor(s): ${roots.join(', ')}`);

		// Validate graph
		// const orphanedPeople = Array.from(people.entries())
		// 	.filter(([id, person]) => person.parents.length === 0 && person.children.length === 0)
		// 	.map(([id]) => id);

		// if (orphanedPeople.length > 0) {
		// 	console.warn(
		// 		`⚠️  Found ${orphanedPeople.length} orphaned person(ies) (no parents or children): ${orphanedPeople.join(', ')}`
		// 	);
		// }

		console.log('🎨 Generating Mermaid diagram...');
		const mermaidDiagram = generateMermaidDiagram(people);

		const timestamp = new Date().toISOString();
		const markdownContent = generateMarkdownContent(
			mermaidDiagram,
			people.size,
			roots.length,
			timestamp
		);

		const outputPath = path.join(PROJECT_ROOT, 'docs', 'genealogy-tree.md');
		const outputDir = path.dirname(outputPath);

		// Ensure docs directory exists
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true });
			console.log(`✓ Created directory: ${outputDir}`);
		}

		fs.writeFileSync(outputPath, markdownContent, 'utf-8');
		console.log(`✅ Generated genealogy tree: ${outputPath}`);
		console.log(`   (${people.size} nodes, ${Array.from(people.values()).reduce((sum, p) => sum + p.children.length, 0)} relationships)`);
	} catch (error) {
		console.error('❌ Error generating genealogy tree:', error instanceof Error ? error.message : error);
		process.exit(1);
	}
}

main();
