<script lang="ts">
	import { onMount } from 'svelte';
	import cytoscape from 'cytoscape';
	import dagre from 'cytoscape-dagre';
	import type { GenealogyGraph, GraphNode, GraphEdge } from '$lib/types/genealogy-graph';

	interface Props {
		graph: GenealogyGraph;
		onNodeSelected?: (nodeId: string) => void;
		width?: number;
		height?: number;
	}

	let { graph, onNodeSelected, width = 1000, height = 700 }: Props = $props();

	let containerElement: HTMLDivElement | null = $state(null);
	let selectedNodeId: string | null = $state(null);
	let selectedNodeInfo: any = $state(null);
	let cy: any = null;

	// Register dagre layout
	cytoscape.use(dagre);

	onMount(() => {
		if (!containerElement) return;

		// Transform graph data to cytoscape format
		const elements = [];

		// Add nodes
		for (const node of graph.nodes) {
			elements.push({
				data: {
					id: node.id,
					label: node.label,
					type: node.type,
					spouses: node.spouses
				}
			});
		}

		// Add edges
		for (const edge of graph.edges) {
			elements.push({
				data: {
					id: `${edge.source}-${edge.target}`,
					source: edge.source,
					target: edge.target,
					relationType: edge.type
				}
			});
		}

		// Initialize Cytoscape
		cy = cytoscape({
			container: containerElement,
			elements,
			style: [
				{
					selector: 'node',
					style: {
						'background-color': function (ele: any) {
							if (ele.id() === selectedNodeId) {
								return '#d4845e';
							}
							return ele.data('type') === 'couple' ? '#b8956a' : '#d4af8f';
						},
						'label': 'data(label)',
						'text-valign': 'center',
						'text-halign': 'center',
						'font-size': 12,
						'color': function (ele: any) {
							if (ele.id() === selectedNodeId) {
								return '#fff';
							}
							return '#3e3835';
						},
						'width': function (ele: any) {
							return ele.data('type') === 'couple' ? '80px' : '60px';
						},
						'height': function (ele: any) {
							return ele.data('type') === 'couple' ? '50px' : '60px';
						},
						'shape': function (ele: any) {
							return ele.data('type') === 'couple' ? 'rectangle' : 'circle';
						},
						'border-width': 2,
						'border-color': function (ele: any) {
							if (ele.id() === selectedNodeId) {
								return '#8b7f73';
							}
							return '#d4af8f';
						},
						'padding': '10px'
					}
				},
				{
					selector: 'edge',
					style: {
						'line-color': '#b8956a',
						'target-arrow-color': '#b8956a',
						'target-arrow-shape': 'triangle',
						'curve-style': 'bezier',
						'width': 2,
						'opacity': function (ele: any) {
							if (selectedNodeId) {
								const source = ele.source().id();
								const target = ele.target().id();
								if (source === selectedNodeId || target === selectedNodeId) {
									return 1;
								}
								return 0.3;
							}
							return 1;
						},
						'line-color': function (ele: any) {
							if (selectedNodeId) {
								const source = ele.source().id();
								const target = ele.target().id();
								if (source === selectedNodeId || target === selectedNodeId) {
									return '#d4845e';
								}
							}
							return '#b8956a';
						}
					}
				},
				{
					selector: 'node:hover',
					style: {
						'border-width': 3,
						'border-color': '#8b7f73'
					}
				}
			],
			layout: {
				name: 'dagre',
				directed: true,
				rankDir: 'TB',
				nodeSep: 80,
				rankSep: 150,
				animate: true,
				animationDuration: 500,
				animationEasing: 'ease-in-out'
			}
		});

		// Handle node click
		cy.on('tap', 'node', function (evt: any) {
			const node = evt.target;
			selectedNodeId = node.id();
			selectedNodeInfo = node.data();

			if (onNodeSelected) {
				onNodeSelected(selectedNodeId);
			}
		});

		// Handle canvas click (deselect)
		cy.on('tap', function (evt: any) {
			if (evt.target === cy) {
				selectedNodeId = null;
				selectedNodeInfo = null;
			}
		});

		// Fit to view on load
		setTimeout(() => {
			cy.fit();
			cy.center();
		}, 600);

		return () => {
			if (cy) {
				cy.destroy();
			}
		};
	});

	function handleZoom(direction: 'in' | 'out') {
		if (!cy) return;
		const current = cy.zoom();
		const step = 0.2;
		const newZoom = direction === 'in' ? current + step : current - step;
		cy.zoom(Math.max(0.1, Math.min(3, newZoom)));
	}

	function handleReset() {
		if (!cy) return;
		selectedNodeId = null;
		selectedNodeInfo = null;
		cy.fit();
		cy.center();
	}

	function handleDownload() {
		if (!cy) return;
		const png = cy.png();
		const link = document.createElement('a');
		link.href = png;
		link.download = 'genealogy-tree.png';
		link.click();
	}
</script>

<div
	class="genealogy-graph-container relative overflow-hidden rounded-lg border border-primary-200 bg-white shadow-lg"
	style="width: {width}px; height: {height}px;"
>
	<div bind:this={containerElement} class="h-full w-full"></div>

	<!-- Controls -->
	<div class="absolute right-4 top-4 space-y-2">
		<button
			onclick={() => handleZoom('in')}
			class="block rounded bg-primary-100 px-3 py-2 text-xs font-semibold text-primary-900 hover:bg-primary-200"
			title="Zoom in"
		>
			+
		</button>
		<button
			onclick={() => handleZoom('out')}
			class="block rounded bg-primary-100 px-3 py-2 text-xs font-semibold text-primary-900 hover:bg-primary-200"
			title="Zoom out"
		>
			−
		</button>
		<button
			onclick={handleReset}
			class="block rounded bg-primary-100 px-3 py-2 text-xs font-semibold text-primary-900 hover:bg-primary-200"
			title="Reset view"
		>
			Reset
		</button>
		<button
			onclick={handleDownload}
			class="block rounded bg-primary-100 px-3 py-2 text-xs font-semibold text-primary-900 hover:bg-primary-200"
			title="Download as image"
		>
			⬇
		</button>
	</div>

	<!-- Info panel -->
	{#if selectedNodeInfo}
		<div class="absolute bottom-4 left-4 max-w-xs rounded-lg bg-white p-4 shadow-md">
			<div class="mb-2 font-semibold text-primary-900">{selectedNodeInfo.label}</div>
			<div class="text-xs text-primary-600">
				Type: <span class="font-mono">{selectedNodeInfo.type}</span>
			</div>
			<div class="text-xs text-primary-600">
				ID: <span class="font-mono text-[10px]">{selectedNodeInfo.id}</span>
			</div>
			{#if selectedNodeInfo.spouses && selectedNodeInfo.spouses.length > 0}
				<div class="mt-2 text-xs text-primary-600">
					Spouses: {selectedNodeInfo.spouses.join(', ')}
				</div>
			{/if}
			<button
				onclick={handleReset}
				class="mt-3 w-full rounded bg-primary-100 px-2 py-1 text-xs font-semibold text-primary-900 hover:bg-primary-200"
			>
				Close
			</button>
		</div>
	{/if}

	<!-- Statistics -->
	<div class="absolute left-4 top-4 rounded-lg bg-white p-4 shadow">
		<div class="text-xs font-semibold text-primary-900">Statistiques</div>
		<div class="mt-2 space-y-1 text-xs text-primary-600">
			<div>Personnes: {graph.metadata.totalPeople}</div>
			<div>Couples: {graph.metadata.totalCouples}</div>
			<div>Générations: {graph.metadata.generationLevels}</div>
		</div>
	</div>
</div>

<style>
	:global(.genealogy-graph-container) {
		user-select: none;
	}
</style>
