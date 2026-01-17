<script lang="ts">
	import { onMount } from 'svelte';
	import type {
		GenealogyGraph,
		GraphNode,
		GraphEdge
	} from '$lib/types/genealogy-graph';
	import { getPerson } from '$lib/genealogy';
	import type { Person } from '$lib/models/person';
	import {
		MIN_ZOOM,
		MAX_ZOOM,
		ZOOM_SPEED
	} from '$lib/types/genealogy-graph';

	interface Props {
		graph: GenealogyGraph;
		onNodeSelected?: (nodeId: string) => void;
		width?: number;
		height?: number;
	}

	let {
		graph,
		onNodeSelected,
		width = 1200,
		height = 800
	}: Props = $props();

	let svgElement: SVGSVGElement | null = $state(null);
	let selectedNodeId: string | null = $state(null);
	let zoomLevel: number = $state(0.8);
	let panX: number = $state(50);
	let panY: number = $state(50);
	let hoveredNodeId: string | null = $state(null);

	let isPanning: boolean = $state(false);
	let panStartX: number = $state(0);
	let panStartY: number = $state(0);

	// Person data cache
	let personCache: Map<string, Person | null> = $state(new Map());

	// Layout parameters
	const GENERATION_HEIGHT = 200;
	const SIBLING_SPACING = 200;
	const NODE_WIDTH = 150;
	const NODE_HEIGHT = 85;

	// Organize nodes by generation
	function getNodesByGeneration(): Map<number, GraphNode[]> {
		const generationMap = new Map<number, GraphNode[]>();

		for (let gen = 0; gen < graph.metadata.generationLevels; gen++) {
			generationMap.set(gen, []);
		}

		for (const node of graph.nodes) {
			// Find generation by counting distance from root nodes
			const generation = calculateGeneration(node.id);
			if (!generationMap.has(generation)) {
				generationMap.set(generation, []);
			}
			generationMap.get(generation)!.push(node);
		}

		return generationMap;
	}

	// Calculate generation level for a node
	function calculateGeneration(nodeId: string): number {
		const visited = new Set<string>();

		function traverse(id: string): number {
			if (visited.has(id)) return 0;
			visited.add(id);

			// Check if it's a root node
			const hasParents = graph.edges.some(
				(edge) => edge.target === id && graph.nodes.find((n) => n.id === edge.source)?.type === 'couple'
			);

			if (!hasParents) return 0;

			// Find parent couple and get parent generation
			for (const edge of graph.edges) {
				if (edge.target === id && edge.source.startsWith('couple-')) {
					// Find which person connects to this couple
					for (const personEdge of graph.edges) {
						if (personEdge.target === edge.source) {
							return traverse(personEdge.source) + 1;
						}
					}
				}
			}

			return 0;
		}

		return traverse(nodeId);
	}

	// Get couple node for two people
	function getCoupleNode(person1Id: string, person2Id: string): GraphNode | undefined {
		const sorted = [person1Id, person2Id].sort();
		const coupleId = `couple-${sorted.join('_')}`;
		return graph.nodes.find((n) => n.id === coupleId);
	}

	// Get person and spouse for a couple
	function getSpouses(coupleId: string): [string, string] | null {
		const coupleNode = graph.nodes.find((n) => n.id === coupleId);
		if (coupleNode?.spouses) {
			return [coupleNode.spouses[0], coupleNode.spouses[1]];
		}
		return null;
	}

	// Reorganize nodes into family units for display
	function getDisplayNodes() {
		const byGeneration = getNodesByGeneration();
		const result = new Map<number, any[]>();

		for (let gen = 0; gen < graph.metadata.generationLevels; gen++) {
			const nodes = byGeneration.get(gen) || [];
			const displayItems: any[] = [];

			// Group by couples
			const couplesHandled = new Set<string>();

			for (const node of nodes) {
				if (node.type === 'couple') {
					if (!couplesHandled.has(node.id)) {
						const spouses = getSpouses(node.id);
						if (spouses) {
							displayItems.push({
								type: 'couple',
								couple: node,
								spouses: spouses
							});
							couplesHandled.add(node.id);
						}
					}
				} else if (node.type === 'person') {
					// Check if person has a couple
					let inCouple = false;
					for (const couple of graph.nodes.filter((n) => n.type === 'couple')) {
						if (couple.spouses?.includes(node.id)) {
							inCouple = true;
							break;
						}
					}

					if (!inCouple) {
						displayItems.push({
							type: 'person',
							person: node
						});
					}
				}
			}

			if (displayItems.length > 0) {
				result.set(gen, displayItems);
			}
		}

		return result;
	}

	// Calculate x position for item
	let itemPositions: Map<string, { x: number; y: number }> = $state(new Map());

	function calculatePositions() {
		const displayNodes = getDisplayNodes();
		const positions = new Map<string, { x: number; y: number }>();

		for (let gen = 0; gen < graph.metadata.generationLevels; gen++) {
			const items = displayNodes.get(gen) || [];
			const totalWidth = items.length * SIBLING_SPACING;
			const startX = -totalWidth / 2;

			items.forEach((item, index) => {
				const x = startX + index * SIBLING_SPACING;
				const y = gen * GENERATION_HEIGHT;

				if (item.type === 'couple') {
					positions.set(item.couple.id, { x, y });
				} else {
					positions.set(item.person.id, { x, y });
				}
			});
		}

		itemPositions = positions;
	}

	// Preload all person data
	$effect(() => {
		const personNodes = graph.nodes.filter((n) => n.type === 'person');
		for (const node of personNodes) {
			ensurePersonData(node.id);
		}
	});

	onMount(() => {
		calculatePositions();
		if (svgElement) {
			svgElement.addEventListener('wheel', handleWheel, { passive: false });
		}

		return () => {
			if (svgElement) {
				svgElement.removeEventListener('wheel', handleWheel);
			}
		};
	});

	// Handle mouse wheel zoom
	function handleWheel(event: WheelEvent) {
		event.preventDefault();
		const direction = event.deltaY > 0 ? 1 : -1;
		const zoomFactor = 1 - direction * ZOOM_SPEED;
		const newZoom = zoomLevel * zoomFactor;
		zoomLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
	}

	// Handle pan
	function handlePanStart(event: MouseEvent) {
		if (event.button !== 0) return;
		isPanning = true;
		panStartX = event.clientX - panX;
		panStartY = event.clientY - panY;
	}

	function handlePanMove(event: MouseEvent) {
		if (!isPanning) return;
		panX = event.clientX - panStartX;
		panY = event.clientY - panStartY;
	}

	function handlePanEnd() {
		isPanning = false;
	}

	// Get person data with caching
	let loadingPersons: Set<string> = $state(new Set());

	async function ensurePersonData(personId: string) {
		if (personCache.has(personId) || loadingPersons.has(personId)) return;

		loadingPersons.add(personId);
		try {
			const person = await getPerson(personId);
			personCache.set(personId, person);
			if (person) {
				genderCache.set(personId, person.gender);
			}
		} finally {
			loadingPersons.delete(personId);
		}
	}

	// Format date range
	function formatDateRange(personId: string): string {
		const person = personCache.get(personId);
		if (!person) return '?-?';

		const getBirthYear = () => {
			if (!person.birthDate) return '?';
			return new Date(person.birthDate).getFullYear().toString();
		};

		const getDeathYear = () => {
			if (!person.deathDate) return '?';
			return new Date(person.deathDate).getFullYear().toString();
		};

		return `${getBirthYear()}-${getDeathYear()}`;
	}

	// Gender cache
	let genderCache: Map<string, 'male' | 'female' | 'other' | undefined> = $state(new Map());

	// Get gender color
	function getGenderColor(gender?: string): string {
		if (gender === 'male') return 'url(#maleGradient)';
		if (gender === 'female') return 'url(#femaleGradient)';
		return '#f9f7f4';
	}

	// Get gender border color
	function getGenderBorderColor(gender?: string): string {
		if (gender === 'male') return '#8fbccf';
		if (gender === 'female') return '#d992bb';
		return '#a89989';
	}

	// Get solid color for fallback
	function getGenderSolidColor(gender?: string): string {
		if (gender === 'male') return '#e8f4f8';
		if (gender === 'female') return '#fef0f5';
		return '#f9f7f4';
	}

	// Handle node click
	function handleNodeClick(nodeId: string) {
		selectedNodeId = nodeId;
		if (onNodeSelected) {
			onNodeSelected(nodeId);
		}
	}

	// Get focus context (connected nodes)
	function getFocusContext(): Set<string> {
		const focus = new Set<string>();
		if (!selectedNodeId) return focus;

		focus.add(selectedNodeId);

		// Add directly connected nodes
		for (const edge of graph.edges) {
			if (edge.source === selectedNodeId) {
				focus.add(edge.target);
			}
			if (edge.target === selectedNodeId) {
				focus.add(edge.source);
			}
		}

		return focus;
	}

	// Transform style
	function getTransformStyle(): string {
		return `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
	}

	$effect(() => {
		calculatePositions();
	});

	const focusContext = $derived(getFocusContext());
	const displayNodes = $derived(getDisplayNodes());
</script>

<div
	class="genealogy-tree-wrapper relative overflow-hidden rounded-lg border border-primary-200 bg-white shadow-lg"
	style="width: {width}px; height: {height}px;"
>
	<svg
		bind:this={svgElement}
		{width}
		{height}
		role="application"
		tabindex="0"
		class="genealogy-tree-svg cursor-grab active:cursor-grabbing"
		viewBox={`-${width / 2} -100 ${width} ${height + 100}`}
		onmousedown={handlePanStart}
		onmousemove={handlePanMove}
		onmouseup={handlePanEnd}
		onmouseleave={handlePanEnd}
	>
		<!-- Defs for gradients and patterns -->
		<defs>
			<linearGradient id="maleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
				<stop offset="0%" stop-color="#f0f8fc" />
				<stop offset="100%" stop-color="#e0eef8" />
			</linearGradient>
			<linearGradient id="femaleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
				<stop offset="0%" stop-color="#fef5fa" />
				<stop offset="100%" stop-color="#fce8f3" />
			</linearGradient>
		</defs>

		<!-- Generation separators -->
		{#each Array(graph.metadata.generationLevels) as _, gen}
			<line
				x1={-width / 2}
				y1={gen * GENERATION_HEIGHT - 20}
				x2={width / 2}
				y2={gen * GENERATION_HEIGHT - 20}
				stroke="#f0ede8"
				stroke-width="1"
				stroke-dasharray="6,3"
				opacity="0.5"
			/>
		{/each}

		<!-- Transform group -->
		<g style="transform: {getTransformStyle()}; transform-origin: center; transition: transform 0.1s;">
			<!-- Draw marriage lines between couples -->
			{#each graph.nodes as node}
				{#if node.type === 'couple' && node.spouses}
					{@const spouse1Pos = itemPositions.get(node.spouses[0])}
					{@const spouse2Pos = itemPositions.get(node.spouses[1])}
					{#if spouse1Pos && spouse2Pos}
						<line
							x1={spouse1Pos.x + NODE_WIDTH / 2}
							y1={spouse1Pos.y + NODE_HEIGHT / 2}
							x2={spouse2Pos.x + NODE_WIDTH / 2}
							y2={spouse2Pos.y + NODE_HEIGHT / 2}
							stroke="#a89989"
							stroke-width="2.5"
							opacity={selectedNodeId ? 0.4 : 0.7}
						/>
						<!-- Marriage symbol -->
						{@const midX = (spouse1Pos.x + spouse2Pos.x) / 2 + NODE_WIDTH / 2}
						{@const midY = (spouse1Pos.y + spouse2Pos.y) / 2 + NODE_HEIGHT / 2}
						<text
							x={midX}
							y={midY}
							font-size="12"
							fill="#a89989"
							text-anchor="middle"
							dominant-baseline="middle"
							class="pointer-events-none"
						>
							═
						</text>
					{/if}
				{/if}
			{/each}

			<!-- Draw generation lines (parent to child) -->
			{#each graph.edges as edge}
				{#if edge.type === 'couple-to-child'}
					{@const sourcePos = itemPositions.get(edge.source)}
					{@const targetPos = itemPositions.get(edge.target)}
					{#if sourcePos && targetPos}
						<path
							d={`M ${sourcePos.x + NODE_WIDTH / 2} ${sourcePos.y + NODE_HEIGHT}
								L ${sourcePos.x + NODE_WIDTH / 2} ${sourcePos.y + NODE_HEIGHT + 30}
								L ${targetPos.x + NODE_WIDTH / 2} ${sourcePos.y + NODE_HEIGHT + 30}
								L ${targetPos.x + NODE_WIDTH / 2} ${targetPos.y}`}
							stroke="#a89989"
							stroke-width="1.5"
							fill="none"
							opacity={selectedNodeId && focusContext.has(edge.source)
								? 0.9
								: selectedNodeId
									? 0.15
									: 0.5}
						/>
					{/if}
				{/if}
			{/each}

			<!-- Draw nodes -->
			{#each graph.nodes as node (node.id)}
				{@const pos = itemPositions.get(node.id)}
				{#if pos}
					{#if node.type === 'person'}
						{ensurePersonData(node.id)}
						{@const isSelected = selectedNodeId === node.id}
						{@const isFocused = focusContext.has(node.id)}
						{@const gender = genderCache.get(node.id)}
						{@const person = personCache.get(node.id)}

						<g>
							<!-- Shadow effect -->
							{#if isSelected}
								<rect
									x={pos.x - 3}
									y={pos.y - 3}
									width={NODE_WIDTH + 6}
									height={NODE_HEIGHT + 6}
									rx="4"
									fill="#c9a882"
									opacity="0.15"
								/>
							{/if}

							<!-- Person box -->
							<rect
								x={pos.x}
								y={pos.y}
								width={NODE_WIDTH}
								height={NODE_HEIGHT}
								rx="5"
								fill={getGenderColor(gender) === 'url(#maleGradient)'
									? 'url(#maleGradient)'
									: getGenderColor(gender) === 'url(#femaleGradient)'
										? 'url(#femaleGradient)'
										: getGenderSolidColor(gender)}
								stroke={isSelected
									? '#c9a882'
									: isFocused
										? getGenderBorderColor(gender)
										: '#d4ccc4'}
								stroke-width={isSelected ? 2.5 : isFocused ? 2 : 1.5}
								opacity={selectedNodeId && !isFocused ? 0.35 : 1}
								class="cursor-pointer transition-all"
								onmouseenter={() => (hoveredNodeId = node.id)}
								onmouseleave={() => (hoveredNodeId = null)}
								onclick={() => handleNodeClick(node.id)}
								role="button"
								tabindex="0"
							/>

							<!-- Gender indicator icon -->
							<text
								x={pos.x + NODE_WIDTH - 12}
								y={pos.y + 12}
								font-size="13"
								font-weight="bold"
								fill={getGenderBorderColor(gender)}
								text-anchor="middle"
								class="pointer-events-none select-none"
							>
								{gender === 'male' ? '♂' : gender === 'female' ? '♀' : '○'}
							</text>

							<!-- Person name (full if space allows, abbreviated otherwise) -->
							<text
								x={pos.x + NODE_WIDTH / 2}
								y={pos.y + 32}
								font-size="10"
								font-weight="700"
								text-anchor="middle"
								fill="#3e3835"
								class="pointer-events-none select-none"
							>
								{(person?.displayName || node.label)
									.split(' ')
									.slice(0, 2)
									.join(' ')
									.substring(0, 14)}
							</text>

							<!-- Dates -->
							<text
								x={pos.x + NODE_WIDTH / 2}
								y={pos.y + 65}
								font-size="7.5"
								text-anchor="middle"
								fill="#9a9084"
								class="pointer-events-none select-none"
							>
								{formatDateRange(node.id)}
							</text>
						</g>
					{/if}
				{/if}
			{/each}
		</g>

		<!-- Info display -->
		<text x="10" y="25" font-size="12" fill="#8b7f73">
			Zoom: {(zoomLevel * 100).toFixed(0)}%
		</text>
	</svg>

	<!-- Selected person detail panel -->
	{#if selectedNodeId}
		{@const selectedNode = graph.nodes.find((n) => n.id === selectedNodeId)}
		{#if selectedNode && selectedNode.type === 'person'}
			{@const person = personCache.get(selectedNodeId)}
			<div class="absolute bottom-4 right-4 max-w-sm rounded-lg border border-primary-200 bg-white p-4 shadow-lg">
				<div class="mb-2 font-serif text-lg font-bold text-primary-900">
					{person?.displayName || selectedNode.label}
				</div>
				{#if person?.birthDate}
					<div class="text-xs text-primary-600">
						📅 {new Date(person.birthDate).toLocaleDateString('fr-FR', {
							year: 'numeric',
							month: 'long',
							day: 'numeric'
						})}
						{#if person.birthPlace}
							- {person.birthPlace}
						{/if}
					</div>
				{/if}
				{#if person?.deathDate}
					<div class="text-xs text-primary-600">
						† {new Date(person.deathDate).toLocaleDateString('fr-FR', {
							year: 'numeric',
							month: 'long',
							day: 'numeric'
						})}
						{#if person.deathPlace}
							- {person.deathPlace}
						{/if}
					</div>
				{/if}
				<button
					onclick={() => (selectedNodeId = null)}
					class="mt-3 w-full rounded bg-primary-100 px-2 py-1 text-xs font-semibold text-primary-900 hover:bg-primary-200"
				>
					Fermer
				</button>
			</div>
		{/if}
	{/if}

	<!-- Zoom controls -->
	<div class="absolute right-4 top-4 space-y-1">
		<button
			onclick={() => (zoomLevel = Math.max(MIN_ZOOM, zoomLevel - ZOOM_SPEED))}
			class="block w-10 rounded bg-primary-100 py-2 text-center text-sm font-bold text-primary-900 hover:bg-primary-200"
		>
			−
		</button>
		<button
			onclick={() => (zoomLevel = Math.min(MAX_ZOOM, zoomLevel + ZOOM_SPEED))}
			class="block w-10 rounded bg-primary-100 py-2 text-center text-sm font-bold text-primary-900 hover:bg-primary-200"
		>
			+
		</button>
		<button
			onclick={() => {
				zoomLevel = 0.8;
				panX = 50;
				panY = 50;
			}}
			class="block w-10 rounded bg-primary-100 py-2 text-center text-xs font-bold text-primary-900 hover:bg-primary-200"
		>
			🔄
		</button>
	</div>

	<!-- Instructions -->
	<div class="absolute left-4 bottom-4 max-w-xs rounded bg-white/90 p-3 text-xs text-primary-700 border border-primary-200">
		<p><strong>Zoom:</strong> Molette souris</p>
		<p><strong>Déplacer:</strong> Clic + Glisser</p>
		<p><strong>Infos:</strong> Clic sur une personne</p>
	</div>
</div>

<style>
	.genealogy-tree-wrapper {
		user-select: none;
	}

	.genealogy-tree-svg {
		width: 100%;
		height: 100%;
	}
</style>
