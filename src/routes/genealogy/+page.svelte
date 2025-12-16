<script lang="ts">
	import GenealogyBlock from '$lib/components/builders/GenealogyBlock.svelte';
	import { searchPeopleByName } from '$lib/genealogy';
	import type { Person } from '$lib/models/person';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchQuery: string = $state('');
	let selectedRootPersonId: string = $state('marie-antoinette-delpech');
	let searchResults: Person[] = $state([]);
	let showSearchResults: boolean = $state(false);

	const availableRootPeople = [
		{ id: 'pierre-delpech', name: 'Pierre Delpech' },
		{ id: 'marguerite-blanc', name: 'Marguerite Blanc' },
		{ id: 'marie-antoinette-delpech', name: 'Marie-Antoinette Delpech' },
		{ id: 'antoine-grognier', name: 'Antoine Grognier' },
		{ id: 'joseph-delpech-senior', name: 'Joseph Delpech' },
		{ id: 'marie-louise-grognier', name: 'Marie-Louise Grognier' },
		{ id: 'jean-baptist-grognier', name: 'Jean-Baptiste Grognier' },
		{ id: 'pierre-grognier-junior', name: 'Pierre Grognier' },
		{ id: 'elizabeth-grognier', name: 'Elizabeth Grognier' },
		{ id: 'claude-grognier', name: 'Claude Grognier' },
		{ id: 'rose-grognier', name: 'Rose Grognier' },
		{ id: 'antoine-grognier-junior', name: 'Antoine Grognier (Fils)' },
		{ id: 'felicite-grognier', name: 'Félicité Grognier' },
		{ id: 'joseph-delpech-junior', name: 'Joseph Delpech (Fils)' },
		{ id: 'henri-delpech', name: 'Henri Delpech' }
	];
	
	async function handleSearch(query: string) {
		if (query.trim().length === 0) {
			searchResults = [];
			showSearchResults = false;
			return;
		}

		searchResults = await searchPeopleByName(query);
		showSearchResults = true;
	}

	function handleSelectPerson(person: Person) {
		selectedRootPersonId = person.id;
		searchQuery = '';
		searchResults = [];
		showSearchResults = false;
	}

	function handleInputChange(e: Event) {
		const target = e.target as HTMLInputElement;
		searchQuery = target.value;
		if (target.value.length > 0) {
			handleSearch(target.value);
		} else {
			showSearchResults = false;
			searchResults = [];
		}
	}
</script>

<svelte:head>
	<title>{data.title}</title>
	<meta name="description" content={data.description} />
</svelte:head>

<div class="min-h-screen bg-gradient-warm">
	<!-- Header -->
	<div class="border-b border-primary-200 bg-gradient-dark text-cream shadow-lg">
		<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
			<h1 class="font-serif text-4xl font-bold">{data.title}</h1>
			<p class="mt-2 text-lg text-cream/90">{data.description}</p>
		</div>
	</div>

	<!-- Controls -->
	<div class="border-b border-primary-200 bg-white">
		<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			<div class="grid gap-6 lg:grid-cols-2">
				<!-- Search -->
				<div>
					<label for="search" class="block text-sm font-semibold text-primary-900">
						Rechercher une personne
					</label>
					<div class="relative mt-2">
						<input
							id="search"
							type="text"
							placeholder="Entrez un nom..."
							value={searchQuery}
							onchange={handleInputChange}
							oninput={handleInputChange}
							class="w-full rounded-lg border border-primary-300 bg-white px-4 py-2 text-primary-900 placeholder-primary-500 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
						/>
						{#if showSearchResults && searchResults.length > 0}
							<div class="absolute top-full z-10 mt-2 w-full rounded-lg border border-primary-200 bg-white shadow-lg">
								{#each searchResults.slice(0, 5) as person}
									<button
										onclick={() => handleSelectPerson(person)}
										class="block w-full border-b border-primary-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-primary-50"
									>
										<div class="font-semibold text-primary-900">{person.displayName}</div>
										<div class="text-xs text-primary-600">
											{person.birthDate && new Date(person.birthDate).getFullYear()}
											{#if person.deathDate}
												– {new Date(person.deathDate).getFullYear()}
											{/if}
										</div>
									</button>
								{/each}
								{#if searchResults.length > 5}
									<div class="px-4 py-2 text-center text-xs text-primary-600">
										+{searchResults.length - 5} résultats supplémentaires
									</div>
								{/if}
							</div>
						{/if}
					</div>
				</div>

				<!-- Root Person Selector -->
				<div>
					<label for="root-person" class="block text-sm font-semibold text-primary-900">
						Personne racine
					</label>
					<select
						id="root-person"
						bind:value={selectedRootPersonId}
						class="mt-2 w-full rounded-lg border border-primary-300 bg-white px-4 py-2 text-primary-900 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
					>
						{#each availableRootPeople as person}
							<option value={person.id}>{person.name}</option>
						{/each}
					</select>
				</div>
			</div>
		</div>
	</div>

	<!-- Genealogy Tree Block -->
	<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
		<GenealogyBlock
			rootPersonId={selectedRootPersonId}
			title="Arbre Généalogique"
			description="Cliquez sur un nom pour explorer les relations familiales et découvrir les articles associés"
			showTitle={true}
		/>
	</div>

	<!-- Footer Information -->
	<div class="border-t border-primary-200 bg-primary-50 py-12">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="grid gap-8 md:grid-cols-3">
				<div>
					<h3 class="text-sm font-semibold uppercase tracking-widest text-primary-600">Générations</h3>
					<p class="mt-4 text-primary-900">Explorez les 4 générations de la famille Delpech depuis le XVIIIe siècle</p>
				</div>
				<div>
					<h3 class="text-sm font-semibold uppercase tracking-widest text-primary-600">Métiers</h3>
					<p class="mt-4 text-primary-900">Découvrez les métiers et compétences transmis à travers les générations</p>
				</div>
				<div>
					<h3 class="text-sm font-semibold uppercase tracking-widest text-primary-600">Articles</h3>
					<p class="mt-4 text-primary-900">Lisez les histoires et documents connexes en sélectionnant les membres de la famille</p>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	:global(body) {
		background-color: #fafaf8;
	}
</style>
