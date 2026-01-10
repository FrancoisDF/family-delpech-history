<script lang="ts">
	import TreeGenealogy from '$lib/components/TreeGenealogy.svelte';
	import ConfiguredGenealogyTree from '$lib/components/ConfiguredGenealogyTree.svelte';
	import PersonDetail from '$lib/components/PersonDetail.svelte';
	import { getPerson } from '$lib/genealogy';
	import type { Person } from '$lib/models/person';

	interface ConfiguredPerson {
		id: string;
		name: string;
		image?: string;
		birthDate?: string;
		deathDate?: string;
		description?: string;
	}

	interface PersonRelationship {
		personId: string;
		relationType: 'spouse' | 'child' | 'parent' | 'friend';
		relatedPersonId: string;
	}

	interface Props {
		rootPersonId?: string;
		title?: string;
		description?: string;
		showTitle?: boolean;
		backgroundColor?: string;
		personTagMap?: Record<string, any>;
		articles?: any[];
		people?: ConfiguredPerson[];
		relationships?: PersonRelationship[];
		onSetRootPerson?: (person: Person) => void;
	}

	let {
		rootPersonId = 'marie-antoinette-delpech',
		title = 'Arbre Généalogique',
		description = 'Explorez l\'arbre généalogique de la famille Delpech',
		showTitle = true,
		backgroundColor,
		personTagMap = {},
		articles = [],
		people = [],
		relationships = [],
		onSetRootPerson
	}: Props = $props();

	// Determine if we're using configured people or GEDCOM data
	const useConfiguredPeople = $derived(people && people.length > 0);

	let selectedPerson: Person | null = $state(null);
	let selectedPersonHistory: Person[] = $state([]);
	let historyIndex: number = $state(-1);
	let canGoBack = $derived(historyIndex > 0);

	function handlePersonSelected(person: Person) {
		console.log('Person selected from tree:', person);
		console.log('Person selectedPerson:', selectedPerson);
		// If person is already selected, don't add to history
		if (selectedPerson?.id === person.id) {
			return;
		}

		// Remove any future history if we're not at the end
		if (historyIndex < selectedPersonHistory.length - 1) {
			selectedPersonHistory = selectedPersonHistory.slice(0, historyIndex + 1);
		}

		// Add new selected person to history
		selectedPersonHistory = [...selectedPersonHistory, person];
		historyIndex = selectedPersonHistory.length - 1;
		selectedPerson = person;

		console.log('History:', selectedPersonHistory);
		console.log('History Index:', historyIndex);
}
	function handleDetailClose() {
		selectedPerson = null;
	}

	function handleGoBackPerson() {
		if (historyIndex > 0) {
			historyIndex--;
			selectedPerson = selectedPersonHistory[historyIndex] || null;
		}
	}

	async function handlePersonClick(person: Person) {
		// Add to history same as tree selection
		handlePersonSelected(person);
		// Scroll tree to top if on mobile
		const treeContainer = document.querySelector('[data-genealogy-tree]');
		if (treeContainer) {
			treeContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

	function handleSetRootPerson(person: Person) {
		if (onSetRootPerson) {
			onSetRootPerson(person);
		}
	}
</script>

<section class="genealogy-block" style={backgroundColor ? `background-color: ${backgroundColor}` : ''}>
	<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
		<!-- Title and Description -->
		{#if showTitle}
			<div class="mb-8 text-center">
				<h2 class="font-serif text-3xl font-bold text-primary-900">{title}</h2>
				{#if description}
					<p class="mt-2 text-lg text-primary-700">{description}</p>
				{/if}
			</div>
		{/if}

		<!-- Layout: Tree on left, Details on right (responsive) -->
		<!-- Desktop Layout -->
		<div class="hidden grid-cols-3 gap-8 lg:grid">
			<!-- Tree Section (left, spans 2 columns) -->
			<div class="lg:col-span-2">
				<div data-genealogy-tree class="relative mx-auto rounded-lg border border-primary-200 bg-white p-4">
					{#if !useConfiguredPeople}
						<button
							onclick={handleGoBackPerson}
							disabled={!canGoBack}
							class="absolute left-4 top-4 z-10 rounded-full p-2 transition-colors {canGoBack ? 'bg-primary-100 text-primary-600 hover:bg-primary-200 active:bg-primary-300 cursor-pointer' : 'bg-primary-50 text-primary-300 cursor-not-allowed'}"
							aria-label="Retour"
							title={canGoBack ? "Retour à la personne précédente" : "Pas d'historique"}
						>
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
							</svg>
						</button>
					{/if}
					{#if useConfiguredPeople}
						<ConfiguredGenealogyTree
							{people}
							{relationships}
							onPersonSelected={handlePersonSelected}
						/>
					{:else}
						<TreeGenealogy
							{rootPersonId}
							onPersonSelected={handlePersonSelected}
							{onSetRootPerson}
						/>
					{/if}
				</div>
			</div>

			<!-- Detail Section (right, sticky) -->
			<div class="lg:col-span-1">
				{#if selectedPerson}
					<div class="sticky top-6">
						<PersonDetail
							person={selectedPerson}
							onClose={handleDetailClose}
							onPersonClick={handlePersonClick}
							onSetRootPerson={handleSetRootPerson}
							{personTagMap}
							{articles}
						/>
					</div>
				{:else}
					<div class="sticky top-6 rounded-lg border border-primary-200 bg-primary-50 p-6 text-center">
						<svg
							class="mx-auto h-12 w-12 text-primary-300"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
							/>
						</svg>
						<h3 class="mt-4 font-semibold text-primary-900">Sélectionnez une personne</h3>
						<p class="mt-2 text-sm text-primary-600">
							Cliquez sur un nom dans l'arbre généalogique pour voir les détails
						</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Mobile Layout -->
		<div class="lg:hidden">
			<div data-genealogy-tree class="relative rounded-lg border border-primary-200 bg-white p-4">
				{#if !useConfiguredPeople}
					<button
						onclick={handleGoBackPerson}
						disabled={!canGoBack}
						class="absolute left-4 top-4 z-10 rounded-full p-2 transition-colors {canGoBack ? 'bg-primary-100 text-primary-600 hover:bg-primary-200 active:bg-primary-300 cursor-pointer' : 'bg-primary-50 text-primary-300 cursor-not-allowed'}"
						aria-label="Retour"
						title={canGoBack ? "Retour à la personne précédente" : "Pas d'historique"}
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
						</svg>
					</button>
				{/if}
				{#if useConfiguredPeople}
					<ConfiguredGenealogyTree
						{people}
						{relationships}
						onPersonSelected={handlePersonSelected}
					/>
				{:else}
					<TreeGenealogy
						{rootPersonId}
						onPersonSelected={handlePersonSelected}
						{onSetRootPerson}
					/>
				{/if}
			</div>
		</div>

		<!-- Mobile Modal Overlay -->
		{#if selectedPerson}
			<div class="fixed inset-0 z-50 flex items-end bg-black/40 lg:hidden" onclick={handleDetailClose}>
				<div
					class="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white"
					onclick={(e) => e.stopPropagation()}
				>
					<div class="px-4 py-3">
						<div class="mb-3 flex items-center justify-between">
							<div class="flex-1" />
							<button
								onclick={handleDetailClose}
								class="rounded-full p-2 text-primary-600 hover:bg-primary-100 active:bg-primary-200"
								aria-label="Fermer"
							>
								<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
					</div>
					<div class="px-4 pb-6">
						<PersonDetail
							person={selectedPerson}
							onClose={handleDetailClose}
							onPersonClick={handlePersonClick}
							onSetRootPerson={handleSetRootPerson}
							hideCloseButton={true}
						/>
					</div>
				</div>
			</div>
		{/if}
	</div>
</section>

<style>
	:global(.genealogy-block) {
		background-color: #fafaf8;
	}

	:global(.genealogy-block a) {
		color: inherit;
		text-decoration: none;
	}

	:global(.genealogy-block a:hover) {
		text-decoration: underline;
	}

	/* Responsive adjustments */
	@media (max-width: 1024px) {
		:global(.genealogy-block) {
			padding-bottom: 2rem;
		}
	}
</style>
