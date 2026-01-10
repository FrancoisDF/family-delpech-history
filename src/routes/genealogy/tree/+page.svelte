<script lang="ts">
	import GenealogyGraphView from '$lib/components/GenealogyGraphView.svelte';
	import { getPerson } from '$lib/genealogy';
	import type { PageData } from './$types';
	import type { Person } from '$lib/models/person';

	let { data }: { data: PageData } = $props();

	let selectedPerson: Person | null = $state(null);

	async function handleNodeSelected(nodeId: string) {
		// Check if it's a person node (not a couple node)
		if (!nodeId.startsWith('couple-')) {
			selectedPerson = await getPerson(nodeId);
		}
	}

	function handleCloseDetail() {
		selectedPerson = null;
	}
</script>

<svelte:head>
	<title>{data.title}</title>
	<meta name="description" content={data.description} />
</svelte:head>

<div class="min-h-screen bg-gradient-warm">
	<!-- Header -->
	<div class="border-b border-primary-200 bg-gradient-dark text-cream shadow-lg">
		<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			<h1 class="font-serif text-4xl font-bold">{data.title}</h1>
			<p class="mt-2 text-lg text-cream/90">{data.description}</p>
		</div>
	</div>

	<!-- Main content -->
	<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		{#if data.error}
			<!-- Error state -->
			<div class="rounded-lg border border-red-300 bg-red-50 p-6">
				<h2 class="mb-2 font-semibold text-red-900">Unable to Load Genealogy Graph</h2>
				<p class="text-red-800">{data.error}</p>
				<p class="mt-4 text-sm text-red-700">
					To generate the graph, run: <code class="rounded bg-red-100 px-2 py-1">npm run build:gedcom</code>
				</p>
			</div>
		{:else if data.graph}
			<!-- Interactive tree -->
			<div class="mb-8">
				<GenealogyGraphView
					graph={data.graph}
					onNodeSelected={handleNodeSelected}
					width={1200}
					height={800}
				/>
			</div>

			<!-- Details panel -->
			<div class="grid gap-8 lg:grid-cols-3">
				<div class="lg:col-span-2">
					<!-- Statistics -->
					<div class="rounded-lg border border-primary-200 bg-white p-6 shadow">
						<h3 class="mb-4 font-serif text-lg font-bold text-primary-900">Informations de l'Arbre</h3>
						<div class="grid gap-4 sm:grid-cols-2">
							<div class="rounded bg-primary-50 p-4">
								<div class="text-sm font-semibold text-primary-600">Personnes</div>
								<div class="mt-1 text-2xl font-bold text-primary-900">{data.graph.metadata.totalPeople}</div>
							</div>
							<div class="rounded bg-primary-50 p-4">
								<div class="text-sm font-semibold text-primary-600">Couples</div>
								<div class="mt-1 text-2xl font-bold text-primary-900">{data.graph.metadata.totalCouples}</div>
							</div>
							<div class="rounded bg-primary-50 p-4">
								<div class="text-sm font-semibold text-primary-600">Générations</div>
								<div class="mt-1 text-2xl font-bold text-primary-900">{data.graph.metadata.generationLevels}</div>
							</div>
							<div class="rounded bg-primary-50 p-4">
								<div class="text-sm font-semibold text-primary-600">Liens</div>
								<div class="mt-1 text-2xl font-bold text-primary-900">{data.graph.metadata.totalEdges}</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Selected person details -->
				<div>
					{#if selectedPerson}
						<div class="rounded-lg border border-primary-200 bg-white p-6 shadow">
							<div class="mb-4 flex items-center justify-between">
								<h3 class="font-serif text-lg font-bold text-primary-900">
									{selectedPerson.displayName}
								</h3>
								<button
									onclick={handleCloseDetail}
									class="rounded bg-primary-100 px-2 py-1 text-xs font-semibold text-primary-900 hover:bg-primary-200"
								>
									✕
								</button>
							</div>

							<div class="space-y-3 text-sm text-primary-700">
								{#if selectedPerson.birthDate}
									<div>
										<span class="font-semibold">Naissance:</span>
										{new Date(selectedPerson.birthDate).toLocaleDateString('fr-FR', {
											year: 'numeric',
											month: 'long',
											day: 'numeric'
										})}
										{#if selectedPerson.birthPlace}
											<span class="text-primary-600">à {selectedPerson.birthPlace}</span>
										{/if}
									</div>
								{/if}

								{#if selectedPerson.deathDate}
									<div>
										<span class="font-semibold">Décès:</span>
										{new Date(selectedPerson.deathDate).toLocaleDateString('fr-FR', {
											year: 'numeric',
											month: 'long',
											day: 'numeric'
										})}
										{#if selectedPerson.deathPlace}
											<span class="text-primary-600">à {selectedPerson.deathPlace}</span>
										{/if}
									</div>
								{/if}

								{#if selectedPerson.bio}
									<div class="mt-4 border-t border-primary-200 pt-4">
										<p class="text-xs leading-relaxed text-primary-600">
											{selectedPerson.bio}
										</p>
									</div>
								{/if}

								{#if selectedPerson.tags && selectedPerson.tags.length > 0}
									<div class="mt-4 border-t border-primary-200 pt-4">
										<div class="mb-2 font-semibold">Tags:</div>
										<div class="flex flex-wrap gap-1">
											{#each selectedPerson.tags as tag}
												<span class="rounded-full bg-primary-100 px-2 py-1 text-xs text-primary-700">
													{tag}
												</span>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						</div>
					{:else}
						<div class="rounded-lg border border-primary-200 bg-primary-50 p-6">
							<p class="text-sm text-primary-700">
								Cliquez sur une personne dans l'arbre pour voir les détails
							</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Instructions -->
			<div class="mt-8 rounded-lg border border-primary-200 bg-white p-6 shadow">
				<h3 class="mb-4 font-serif text-lg font-bold text-primary-900">Contrôles et Navigation</h3>
				<div class="grid gap-4 sm:grid-cols-2">
					<div>
						<h4 class="mb-2 font-semibold text-primary-800">Zoom</h4>
						<ul class="space-y-1 text-sm text-primary-700">
							<li>• Bouton <strong>+</strong>: Agrandir</li>
							<li>• Bouton <strong>−</strong>: Réduire</li>
							<li>• Bouton <strong>Reset</strong>: Réinitialiser le zoom</li>
						</ul>
					</div>
					<div>
						<h4 class="mb-2 font-semibold text-primary-800">Sélection</h4>
						<ul class="space-y-1 text-sm text-primary-700">
							<li>• Clic sur une personne: Afficher les détails</li>
							<li>• Clic sur le fond: Déselectionner</li>
							<li>• Bouton ⬇: Télécharger l'arbre en image</li>
						</ul>
					</div>
				</div>
			</div>
		{:else}
			<!-- No data state -->
			<div class="rounded-lg border border-primary-200 bg-primary-50 p-6 text-center">
				<p class="text-primary-700">Aucune donnée d'arbre généalogique disponible</p>
			</div>
		{/if}
	</div>

	<!-- Footer -->
	<div class="border-t border-primary-200 bg-primary-50 py-8">
		<div class="mx-auto max-w-7xl px-4 text-center text-sm text-primary-700 sm:px-6 lg:px-8">
			<p>Arbre généalogique interactif de la famille Delpech</p>
		</div>
	</div>
</div>

<style>
	:global(body) {
		background-color: #fafaf8;
	}
</style>
