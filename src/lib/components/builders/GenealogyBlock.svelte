<script lang="ts">
	import TreeGenealogy from '$lib/components/TreeGenealogy.svelte';
	import PersonDetail from '$lib/components/PersonDetail.svelte';
	import { getPerson } from '$lib/genealogy';
	import type { Person } from '$lib/models/person';

	interface Props {
		rootPersonId?: string;
		title?: string;
		description?: string;
		showTitle?: boolean;
		backgroundColor?: string;
	}

	let {
		rootPersonId = 'marie-antoinette-delpech',
		title = 'Arbre Généalogique',
		description = 'Explorez l\'arbre généalogique de la famille Delpech',
		showTitle = true,
		backgroundColor
	}: Props = $props();

	let selectedPerson: Person | null = $state(null);

	function handlePersonSelected(person: Person) {
		selectedPerson = person;
	}

	function handleDetailClose() {
		selectedPerson = null;
	}

	async function handlePersonClick(person: Person) {
		selectedPerson = person;
		// Scroll tree to top if on mobile
		const treeContainer = document.querySelector('[data-genealogy-tree]');
		if (treeContainer) {
			treeContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
		<div class="grid gap-8 lg:grid-cols-3">
			<!-- Tree Section (left, spans 2 columns on large screens) -->
			<div class="lg:col-span-2">
				<div data-genealogy-tree class="rounded-lg border border-primary-200 bg-white p-4">
					<TreeGenealogy
						{rootPersonId}
						onPersonSelected={handlePersonSelected}
					/>
				</div>
			</div>

			<!-- Detail Section (right, sticky on large screens) -->
			<div class="lg:col-span-1">
				{#if selectedPerson}
					<div class="sticky top-6">
						<PersonDetail
							person={selectedPerson}
							onClose={handleDetailClose}
							onPersonClick={handlePersonClick}
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
