<script lang="ts">
	import { browser } from '$app/environment';
	import { getPersonWithRelations, getPerson } from '$lib/genealogy';
	import type { Person, PersonWithRelations } from '$lib/models/person';

	interface Props {
		rootPersonId: string;
		onPersonSelected?: (person: Person) => void;
		onSetRootPerson?: (person: Person) => void;
		depth?: number;
	}

	let { rootPersonId, onPersonSelected, onSetRootPerson, depth = 2 }: Props = $props();

	let selectedPersonId: string | null = $state(rootPersonId);
	let expandedNodes: Set<string> = $state(new Set([rootPersonId]));
	let personDataMap: Map<string, PersonWithRelations> = $state(new Map());
	let loading: boolean = $state(true);
	let rootPersonData: PersonWithRelations | null = $state(null);
	let scrollContainer: HTMLDivElement | null = $state(null);

	// Load root person and cache data
	$effect(() => {
		let cancelled = false;

		(async () => {
			loading = true;
			const data = await getPersonWithRelations(rootPersonId);
			if (cancelled) return;

			if (data) {
				personDataMap.set(data.id, data);
				rootPersonData = data;
			}
			loading = false;
		})().catch((err) => {
			if (!cancelled) {
				console.warn('Failed to load root person relations:', err);
				loading = false;
			}
		});

		return () => {
			cancelled = true;
		};
	});

	function toggleNode(personId: string) {
		const newSet = new Set(expandedNodes);
		if (newSet.has(personId)) {
			newSet.delete(personId);
		} else {
			newSet.add(personId);
		}
		expandedNodes = newSet;
	}

	async function selectPerson(person: Person) {
		selectedPersonId = person.id;
		// Preload person data
		const personWithRels = await getPersonWithRelations(person.id);
		if (personWithRels) {
			personDataMap.set(person.id, personWithRels);
		}
		if (onPersonSelected) {
			onPersonSelected(person);
		}
	}

	function formatDateRange(birthDate?: string, deathDate?: string): string {
		if (!birthDate && !deathDate) return '';
		const birthYear = birthDate ? new Date(birthDate).getFullYear() : '?';
		const deathYear = deathDate ? new Date(deathDate).getFullYear() : '';
		if (deathYear) {
			return `${birthYear}–${deathYear}`;
		}
		return `b. ${birthYear}`;
	}

	function handlePersonSelect(person: Person) {
		selectPerson(person);
	}

	function handleSetRootPerson(person: Person, e: Event) {
		e.stopPropagation();
		if (onSetRootPerson) {
			onSetRootPerson(person);
		}
	}

	// Scroll to 50% of width when content is loaded
	$effect(() => {
		if (!loading && scrollContainer && rootPersonData) {
			// Use setTimeout to ensure DOM has fully rendered
			setTimeout(() => {
				if (scrollContainer) {
					const scrollWidth = scrollContainer.scrollWidth;
					const clientWidth = scrollContainer.clientWidth;
					scrollContainer.scrollLeft = (scrollWidth - clientWidth) / 2;
				}
			}, 0);
		}
	});
</script>

{#if loading}
	<div class="flex items-center justify-center py-16">
		<div class="text-center">
			<div class="mb-4 inline-block">
				<div class="h-12 w-12 animate-spin rounded-full border-4 border-primary-300 border-t-accent"></div>
			</div>
			<p class="text-primary-600">Chargement de l'arbre généalogique...</p>
		</div>
	</div>
{:else if rootPersonData}
	<div bind:this={scrollContainer} class="overflow-x-auto rounded-lg p-8">
		<div class="min-w-max mx-auto">
			<div class="flex flex-col items-center gap-8">
				<!-- Ancestors Section -->
				{#if rootPersonData.parentObjects && rootPersonData.parentObjects.length > 0}
					<div class="flex flex-col items-center gap-6">
						<h3 class="text-sm font-semibold uppercase tracking-widest text-primary-600">Ancêtres</h3>
						<div class="flex flex-wrap justify-center gap-6">
							{#each rootPersonData.parentObjects as parent}
								<div class="relative">
									<button
										class="genealogy-node ancestor-node {selectedPersonId === parent.id ? 'selected' : ''}"
										onclick={() => handlePersonSelect(parent)}
									>
										<div class="font-semibold text-primary-900">{parent.givenName}</div>
										<div class="text-xs text-primary-600">{parent.familyName}</div>
										<div class="mt-2 text-xs font-medium text-primary-700">
											{formatDateRange(parent.birthDate, parent.deathDate)}
										</div>
									</button>
									{#if onSetRootPerson}
										<button
											onclick={(e) => handleSetRootPerson(parent, e)}
											class="absolute -top-2 -right-2 rounded-full bg-accent p-1.5 text-white shadow-md transition-transform hover:scale-110 active:scale-95"
											aria-label="Définir comme personne racine"
											title="Afficher cet arbre généalogique en partant de cette personne"
										>
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
											</svg>
										</button>
									{/if}
								</div>
							{/each}
						</div>
						<div class="h-6 w-px bg-gradient-to-b from-primary-300 to-transparent"></div>
					</div>
				{/if}

				<!-- Root Person (centered) -->
				<div class="relative">
					<button
						class="genealogy-node root-node {selectedPersonId === rootPersonData.id ? 'selected' : ''}"
						onclick={() => handlePersonSelect(rootPersonData!)}
					>
						<div class="font-bold text-primary-900">{rootPersonData.givenName}</div>
						<div class="text-sm font-semibold text-primary-700">{rootPersonData.familyName}</div>
						<div class="mt-2 text-xs font-medium text-primary-700">
							{formatDateRange(rootPersonData.birthDate, rootPersonData.deathDate)}
						</div>
					</button>
					{#if onSetRootPerson}
						<button
							onclick={(e) => handleSetRootPerson(rootPersonData!, e)}
							class="absolute -top-2 -right-2 rounded-full bg-accent p-1.5 text-white shadow-md transition-transform hover:scale-110 active:scale-95"
							aria-label="Définir comme personne racine"
							title="Afficher cet arbre généalogique en partant de cette personne"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
						</button>
					{/if}
				</div>

				<!-- Spouses -->
				{#if rootPersonData.spouseObjects && rootPersonData.spouseObjects.length > 0}
					<div class="flex flex-col items-center gap-4">
						<div class="text-xs font-semibold uppercase tracking-widest text-sage">Époux(se)</div>
						<div class="flex flex-wrap justify-center gap-4">
							{#each rootPersonData.spouseObjects as spouse}
								<div class="relative">
									<button
										class="genealogy-node spouse-node {selectedPersonId === spouse.id ? 'selected' : ''}"
										onclick={() => handlePersonSelect(spouse)}
									>
										<div class="font-semibold text-primary-900">{spouse.givenName}</div>
										<div class="text-xs text-primary-600">{spouse.familyName}</div>
										<div class="mt-2 text-xs font-medium text-primary-700">
											{formatDateRange(spouse.birthDate, spouse.deathDate)}
										</div>
									</button>
									{#if onSetRootPerson}
										<button
											onclick={(e) => handleSetRootPerson(spouse, e)}
											class="absolute -top-2 -right-2 rounded-full bg-accent p-1.5 text-white shadow-md transition-transform hover:scale-110 active:scale-95"
											aria-label="Définir comme personne racine"
											title="Afficher cet arbre généalogique en partant de cette personne"
										>
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
											</svg>
										</button>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Children Section -->
				{#if (rootPersonData.children ?? []).length > 0}
					<div class="flex flex-col items-center gap-6">
						<div class="h-6 w-px bg-gradient-to-b from-primary-300 to-transparent"></div>
						<h3 class="text-sm font-semibold uppercase tracking-widest text-primary-600">Enfants ({(rootPersonData.children ?? []).length})</h3>

						{#if expandedNodes.has(rootPersonData!.id)}
							<div class="flex flex-wrap justify-center gap-6">
								{#each (rootPersonData.children ?? []) as childId}
									{#await getPerson(childId) then child}
										{#if child}
											<div class="relative">
												<button
													class="genealogy-node child-node {selectedPersonId === child.id ? 'selected' : ''}"
													onclick={() => handlePersonSelect(child)}
												>
													<div class="font-semibold text-primary-900">{child.givenName}</div>
													<div class="text-xs text-primary-600">{child.familyName}</div>
													<div class="mt-2 text-xs font-medium text-primary-700">
														{formatDateRange(child.birthDate, child.deathDate)}
													</div>
												</button>
												{#if onSetRootPerson}
													<button
														onclick={(e) => handleSetRootPerson(child, e)}
														class="absolute -top-2 -right-2 rounded-full bg-accent p-1.5 text-white shadow-md transition-transform hover:scale-110 active:scale-95"
														aria-label="Définir comme personne racine"
														title="Afficher cet arbre généalogique en partant de cette personne"
													>
														<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
														</svg>
													</button>
												{/if}
											</div>
										{/if}
									{/await}
								{/each}
							</div>
						{:else}
							<p class="text-sm text-primary-600">
								{(rootPersonData.children ?? []).length} enfant{(rootPersonData.children ?? []).length > 1 ? 's' : ''}
							</p>
						{/if}

						<button
							onclick={() => toggleNode(rootPersonData!.id)}
							class="mt-4 rounded-lg border border-primary-300 px-4 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50 active:bg-primary-100"
						>
							{expandedNodes.has(rootPersonData!.id) ? '✕ Masquer les enfants' : '+ Afficher les enfants'}
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
{:else}
	<div class="rounded-lg bg-primary-50 p-8 text-center">
		<p class="text-primary-600">Personne non trouvée</p>
	</div>
{/if}

<style>
	:global(.genealogy-node) {
		display: inline-block;
		padding: 1rem;
		border-radius: 0.5rem;
		border: 2px solid transparent;
		background-color: white;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		min-width: 140px;
		text-align: center;
		cursor: pointer;
		transition: all 0.3s ease;
		font-family: inherit;
	}

	:global(.genealogy-node:hover) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	:global(.genealogy-node.root-node) {
		padding: 1.25rem;
		background: linear-gradient(135deg, #faf8f6 0%, #f5f1ed 100%);
		border-color: #a89989;
		min-width: 160px;
		font-size: 1rem;
	}

	:global(.genealogy-node.ancestor-node) {
		background-color: #faf8f6;
		border-color: #dfd4cc;
	}

	:global(.genealogy-node.spouse-node) {
		background-color: #faf8f6;
		border-color: #9aa89a;
	}

	:global(.genealogy-node.child-node) {
		background-color: white;
		border-color: #eae2dc;
	}

	:global(.genealogy-node.selected) {
		border-color: #c9a882;
		box-shadow: 0 0 0 2px #c9a882, 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	:global(.genealogy-node:active) {
		transform: translateY(0);
	}
</style>
