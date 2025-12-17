<script lang="ts">
	import { onMount } from 'svelte';
	import type {
		GenealogyGraph,
		GraphNode,
		GraphEdge,
		TreeInteractionState,
		Position
	} from '$lib/types/genealogy-graph';
	import {
		NODE_RADIUS,
		COUPLE_NODE_WIDTH,
		COUPLE_NODE_HEIGHT,
		EDGE_COLOR,
		EDGE_HOVER_COLOR,
		PERSON_NODE_COLOR,
		COUPLE_NODE_COLOR,
		SELECTED_NODE_COLOR,
		MIN_ZOOM,
		MAX_ZOOM,
		ZOOM_SPEED
	} from '$lib/types/genealogy-graph';

	interface Props {
		graph: GenealogyGraph;
		onNodeSelected?: (nodeId: string) => void;
		width?: number;
		height?: number;
		enableZoom?: boolean;
		enablePan?: boolean;
	}

	let {
		graph,
		onNodeSelected,
		width = 1000,
		height = 700,
		enableZoom = true,
		enablePan = true
	}: Props = $props();

	let svgElement: SVGSVGElement | null = $state(null);
	let selectedNodeId: string | null = $state(null);
	let zoomLevel: number = $state(1);
	let panX: number = $state(0);
	let panY: number = $state(0);
	let hoveredNodeId: string | null = $state(null);

	let isPanning: boolean = $state(false);
	let panStartX: number = $state(0);
	let panStartY: number = $state(0);

	// Calculate connected nodes for a given node
	function getConnectedNodeIds(nodeId: string): Set<string> {
		const connected = new Set<string>();

		// Direct connections
		for (const edge of graph.edges) {
			if (edge.source === nodeId) {
				connected.add(edge.target);
			}
			if (edge.target === nodeId) {
				connected.add(edge.source);
			}
		}

		return connected;
	}

	// Handle node click
	function handleNodeClick(nodeId: string) {
		selectedNodeId = nodeId;
		if (onNodeSelected) {
			onNodeSelected(nodeId);
		}
	}

	// Handle node hover
	function handleNodeHover(nodeId: string | null) {
		hoveredNodeId = nodeId;
	}

	// Handle mouse wheel zoom
	function handleWheel(event: WheelEvent) {
		if (!enableZoom) return;

		event.preventDefault();

		const direction = event.deltaY > 0 ? 1 : -1;
		const zoomFactor = 1 - direction * ZOOM_SPEED;
		const newZoom = zoomLevel * zoomFactor;

		// Clamp zoom level
		zoomLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
	}

	// Handle pan start
	function handlePanStart(event: MouseEvent) {
		if (!enablePan || event.button !== 0) return;

		isPanning = true;
		panStartX = event.clientX - panX;
		panStartY = event.clientY - panY;
	}

	// Handle pan move
	function handlePanMove(event: MouseEvent) {
		if (!isPanning) return;

		panX = event.clientX - panStartX;
		panY = event.clientY - panStartY;
	}

	// Handle pan end
	function handlePanEnd() {
		isPanning = false;
	}

	// Transform coordinates for zoom and pan
	function getTransformStyle(): string {
		return `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
	}

	// Determine node color
	function getNodeColor(nodeId: string): string {
		const node = graph.nodes.find((n) => n.id === nodeId);
		if (!node) return PERSON_NODE_COLOR;

		if (selectedNodeId === nodeId) {
			return SELECTED_NODE_COLOR;
		}

		return node.type === 'couple' ? COUPLE_NODE_COLOR : PERSON_NODE_COLOR;
	}

	// Determine edge color
	function getEdgeColor(edge: GraphEdge): string {
		const isConnectedToSelected =
			selectedNodeId &&
			(edge.source === selectedNodeId || edge.target === selectedNodeId);

		return isConnectedToSelected ? EDGE_HOVER_COLOR : EDGE_COLOR;
	}

	onMount(() => {
		if (svgElement) {
			svgElement.addEventListener('wheel', handleWheel, { passive: false });
		}

		return () => {
			if (svgElement) {
				svgElement.removeEventListener('wheel', handleWheel);
			}
		};
	});
</script>

<div
	class="genealogy-tree-container relative overflow-hidden rounded-lg border border-primary-200 bg-white shadow-lg"
	style="width: {width}px; height: {height}px;"
>
	<svg
		bind:this={svgElement}
		{width}
		{height}
		class="genealogy-tree-svg cursor-grab active:cursor-grabbing"
		viewBox="0 0 {width} {height}"
		onmousedown={handlePanStart}
		onmousemove={handlePanMove}
		onmouseup={handlePanEnd}
		onmouseleave={handlePanEnd}
	>

		<!-- Transform group for zoom and pan -->
		<g style="transform: {getTransformStyle()}; transform-origin: 0 0; transition: transform 0.1s;">
			<!-- Render edges first (so they appear behind nodes) -->
			{#each graph.edges as edge}
				<line
					class="genealogy-edge"
					x1={graph.nodes.find((n) => n.id === edge.source)?.position.x || 0}
					y1={graph.nodes.find((n) => n.id === edge.source)?.position.y || 0}
					x2={graph.nodes.find((n) => n.id === edge.target)?.position.x || 0}
					y2={graph.nodes.find((n) => n.id === edge.target)?.position.y || 0}
					stroke={getEdgeColor(edge)}
				/>
			{/each}

			<!-- Render nodes -->
			{#each graph.nodes as node (node.id)}
				{#if node.type === 'person'}
					<!-- Person node (circle) -->
					<circle
						class="genealogy-node genealogy-person-node"
						cx={node.position.x}
						cy={node.position.y}
						r={NODE_RADIUS}
						fill={getNodeColor(node.id)}
						onmouseenter={() => handleNodeHover(node.id)}
						onmouseleave={() => handleNodeHover(null)}
						onclick={(e) => {
							e.stopPropagation();
							handleNodeClick(node.id);
						}}
					/>
					<text
						class="genealogy-node-text"
						x={node.position.x}
						y={node.position.y}
						fill={selectedNodeId === node.id ? 'white' : '#3e3835'}
					>
						{node.label.split('-').pop()?.substring(0, 3).toUpperCase() || '?'}
					</text>
				{:else if node.type === 'couple'}
					<!-- Couple node (rectangle) -->
					<rect
						class="genealogy-node genealogy-couple-node"
						x={node.position.x - COUPLE_NODE_WIDTH / 2}
						y={node.position.y - COUPLE_NODE_HEIGHT / 2}
						width={COUPLE_NODE_WIDTH}
						height={COUPLE_NODE_HEIGHT}
						rx="4"
						fill={getNodeColor(node.id)}
						onmouseenter={() => handleNodeHover(node.id)}
						onmouseleave={() => handleNodeHover(null)}
						onclick={(e) => {
							e.stopPropagation();
							handleNodeClick(node.id);
						}}
					/>
					<text
						class="genealogy-node-text"
						x={node.position.x}
						y={node.position.y}
						fill={selectedNodeId === node.id ? 'white' : '#3e3835'}
						font-size="10"
					>
						{node.label.substring(0, 15)}
					</text>
				{/if}
			{/each}
		</g>

		<!-- Zoom level indicator -->
		<text x="10" y="25" font-size="12" fill="#8b7f73">
			Zoom: {(zoomLevel * 100).toFixed(0)}%
		</text>
	</svg>

	<!-- Info panel -->
	{#if selectedNodeId}
		{@const selectedNode = graph.nodes.find((n) => n.id === selectedNodeId)}
		{#if selectedNode}
			<div class="absolute bottom-4 left-4 max-w-xs rounded-lg bg-white p-4 shadow-md">
				<div class="mb-2 font-semibold text-primary-900">{selectedNode.label}</div>
				<div class="text-xs text-primary-600">
					Type: <span class="font-mono">{selectedNode.type}</span>
				</div>
				<div class="text-xs text-primary-600">
					ID: <span class="font-mono text-[10px]">{selectedNode.id}</span>
				</div>
				{#if selectedNode.spouses}
					<div class="mt-2 text-xs text-primary-600">
						Spouses: {selectedNode.spouses.join(', ')}
					</div>
				{/if}
				<button
					onclick={() => (selectedNodeId = null)}
					class="mt-3 w-full rounded bg-primary-100 px-2 py-1 text-xs font-semibold text-primary-900 hover:bg-primary-200"
				>
					Close
				</button>
			</div>
		{/if}
	{/if}

	<!-- Controls -->
	<div class="absolute right-4 top-4 space-y-2">
		{#if enableZoom}
			<button
				onclick={() => (zoomLevel = Math.max(MIN_ZOOM, zoomLevel - ZOOM_SPEED))}
				class="block rounded bg-primary-100 px-3 py-2 text-xs font-semibold text-primary-900 hover:bg-primary-200"
			>
				−
			</button>
			<button
				onclick={() => (zoomLevel = Math.min(MAX_ZOOM, zoomLevel + ZOOM_SPEED))}
				class="block rounded bg-primary-100 px-3 py-2 text-xs font-semibold text-primary-900 hover:bg-primary-200"
			>
				+
			</button>
			<button
				onclick={() => {
					zoomLevel = 1;
					panX = 0;
					panY = 0;
				}}
				class="block rounded bg-primary-100 px-3 py-2 text-xs font-semibold text-primary-900 hover:bg-primary-200"
			>
				Reset
			</button>
		{/if}
	</div>
</div>

<style>
	.genealogy-tree-container {
		user-select: none;
	}

	.genealogy-tree-svg {
		width: 100%;
		height: 100%;
	}

	:global(.genealogy-edge) {
		stroke-width: 2;
		fill: none;
		pointer-events: none;
	}

	:global(.genealogy-node) {
		cursor: pointer;
		transition: fill 0.2s, stroke 0.2s;
	}

	:global(.genealogy-node:hover) {
		stroke-width: 3;
	}

	:global(.genealogy-node-text) {
		font-size: 12px;
		text-anchor: middle;
		dominant-baseline: middle;
		pointer-events: none;
		font-weight: 500;
	}

	:global(.genealogy-person-node) {
		stroke: #d4af8f;
		stroke-width: 2;
	}

	:global(.genealogy-couple-node) {
		stroke: #8b7f73;
		stroke-width: 2;
	}
</style>
