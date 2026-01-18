<script lang="ts">
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
		spouseId?: string; // ID of spouse/partner associated with this relationship (for children)
	}

	interface Props {
		people?: ConfiguredPerson[];
		relationships?: PersonRelationship[];
		onPersonSelected?: (person: Person) => void;
	}

	let { people = [], relationships = [], onPersonSelected }: Props = $props();

	// State
	// rootPerson is always the first person or the one selected from elsewhere
	const rootPerson = $derived(people.length > 0 ? people[0] : null);
	// detailPersonId tracks which person's detail should be shown in side panel
	let detailPersonId: string | null = $state(null);
	let expandedNodes: Set<string> = $state(new Set(rootPerson ? [rootPerson.id] : []));
	let scrollContainer: HTMLDivElement | null = $state(null);

	// Convert configured person to Person type
	function convertToPerson(configPerson: ConfiguredPerson): Person {
		const nameParts = configPerson.name.split(' ');
		const givenName = nameParts[0];
		const familyName = nameParts.slice(1).join(' ') || nameParts[0];

		return {
			id: configPerson.id,
			givenName,
			familyName,
			displayName: configPerson.name,
			birthDate: configPerson.birthDate,
			deathDate: configPerson.deathDate,
			bio: configPerson.description,
			photoUrl: configPerson.image,
			sources: [],
			gender: undefined
		};
	}

	// Get person by ID
	function getPerson(id: string): ConfiguredPerson | undefined {
		return people.find((p) => p.id === id);
	}

	// Get related people by relationship type
	function getRelatedPeople(personId: string, relationType: string): ConfiguredPerson[] {
		return relationships
			.filter((r) => r.personId === personId && r.relationType === relationType)
			.map((r) => getPerson(r.relatedPersonId))
			.filter((p) => p !== undefined) as ConfiguredPerson[];
	}

	// Format date range for display
	function formatDateRange(birthDate?: string, deathDate?: string): string {
		if (!birthDate && !deathDate) return '';
		const birthYear = birthDate ? new Date(birthDate).getFullYear() : '?';
		const deathYear = deathDate ? new Date(deathDate).getFullYear() : '';
		if (deathYear) {
			return `${birthYear}–${deathYear}`;
		}
		return `b. ${birthYear}`;
	}

	// Handle person selection - only show detail, doesn't change root person
	function handlePersonSelect(person: ConfiguredPerson) {
		detailPersonId = person.id;
		if (onPersonSelected) {
			onPersonSelected(convertToPerson(person));
		}
	}

	// Toggle node expansion
	function toggleNode(personId: string) {
		const newSet = new Set(expandedNodes);
		if (newSet.has(personId)) {
			newSet.delete(personId);
		} else {
			newSet.add(personId);
		}
		expandedNodes = newSet;
	}

	// Scroll to center when content is loaded
	$effect(() => {
		if (scrollContainer && people.length > 0) {
			setTimeout(() => {
				if (scrollContainer) {
					const scrollWidth = scrollContainer.scrollWidth;
					const clientWidth = scrollContainer.clientWidth;
					scrollContainer.scrollLeft = (scrollWidth - clientWidth) / 2;
				}
			}, 0);
		}
	});

	// Derived values for root person
	const parentObjects = $derived(rootPerson ? getRelatedPeople(rootPerson.id, 'parent') : []);
	const spouseObjects = $derived(rootPerson ? getRelatedPeople(rootPerson.id, 'spouse') : []);
	const childrenIds = $derived(rootPerson ? getRelatedPeople(rootPerson.id, 'child').map((p) => p.id) : []);
	const friendObjects = $derived(rootPerson ? getRelatedPeople(rootPerson.id, 'friend') : []);

	// Helper function: get all spouses (including root person as a "couple key")
	// This is used to organize children by which spouse couple they belong to
	function getChildrenForSpouse(spouseId: string): ConfiguredPerson[] {
		if (!rootPerson) return [];
		return relationships
			.filter((r) => r.personId === rootPerson.id && r.relationType === 'child' && r.spouseId === spouseId)
			.map((r) => getPerson(r.relatedPersonId))
			.filter((p) => p !== undefined) as ConfiguredPerson[];
	}

	// Get children without a specific spouse (legacy support for relationships without spouseId)
	const childrenWithoutSpouse = $derived(
		rootPerson
			? relationships
					.filter(
						(r) =>
							r.personId === rootPerson.id &&
							r.relationType === 'child' &&
							(!r.spouseId || r.spouseId === '')
					)
					.map((r) => getPerson(r.relatedPersonId))
					.filter((p) => p !== undefined) as ConfiguredPerson[]
			: []
	);
</script>

{#if people.length === 0}
	<div class="rounded-lg bg-primary-50 p-8 text-center">
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
		<h3 class="mt-4 font-semibold text-primary-900">Aucune personne configurée</h3>
		<p class="mt-2 text-sm text-primary-600">
			Ajoutez des personnes et des relations dans l'éditeur Builder.io
		</p>
	</div>
{:else if rootPerson}
	<div bind:this={scrollContainer} class="overflow-x-auto rounded-lg p-8">
		<div class="min-w-max mx-auto">
			<div class="flex flex-col items-center gap-8">
				<!-- Ancestors Section -->
				{#if parentObjects.length > 0}
					<div class="flex flex-col items-center gap-6">
						<h3 class="text-sm font-semibold uppercase tracking-widest text-primary-600">Ancêtres</h3>
						<div class="flex flex-wrap justify-center gap-6">
							{#each parentObjects as parent (parent.id)}
								<div class="relative">
									<button
										class="genealogy-node ancestor-node {detailPersonId === parent.id ? 'selected' : ''}"
										onclick={() => handlePersonSelect(parent)}
									>
										{#if parent.image}
											<div class="mb-3 flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg">
												<img
													src={parent.image}
													alt={parent.name}
													class="h-full w-full object-cover"
												/>
											</div>
										{/if}
										<div class="font-semibold text-primary-900">{parent.name.split(' ')[0]}</div>
										<div class="text-xs text-primary-600">{parent.name.split(' ').slice(1).join(' ')}</div>
										<div class="mt-2 text-xs font-medium text-primary-700">
											{formatDateRange(parent.birthDate, parent.deathDate)}
										</div>
									</button>
								</div>
							{/each}
						</div>
						<div class="h-6 w-px bg-gradient-to-b from-primary-300 to-transparent"></div>
					</div>
				{/if}

				<!-- Central Couple Wrapper Section (Root + Spouses side by side) -->
				<div class="flex items-start gap-8">
					<!-- Main Couple Block -->
					<div class="flex flex-col items-center gap-6">
						<!-- Root Person and Spouse(s) in wrapper -->
						<div class="flex flex-wrap justify-center gap-4 rounded-lg border-2 border-dashed border-primary-200 p-6">
							{#if rootPerson}
								<div class="relative">
									<button
										class="genealogy-node root-node {detailPersonId === rootPerson.id ? 'selected' : ''}"
										onclick={() => handlePersonSelect(rootPerson)}
									>
										{#if rootPerson.image}
											<div class="mb-3 flex h-32 w-32 items-center justify-center overflow-hidden rounded-lg">
												<img
													src={rootPerson.image}
													alt={rootPerson.name}
													class="h-full w-full object-cover"
												/>
											</div>
										{/if}
										<div class="font-bold text-primary-900">{rootPerson.name.split(' ')[0]}</div>
										<div class="text-sm font-semibold text-primary-700">{rootPerson.name.split(' ').slice(1).join(' ')}</div>
										<div class="mt-2 text-xs font-medium text-primary-700">
											{formatDateRange(rootPerson.birthDate, rootPerson.deathDate)}
										</div>
									</button>
								</div>
							{/if}

							<!-- Spouses in wrapper (side by side) -->
							{#each spouseObjects as spouse (spouse.id)}
								<div class="relative">
									<button
										class="genealogy-node spouse-node {detailPersonId === spouse.id ? 'selected' : ''}"
										onclick={() => handlePersonSelect(spouse)}
									>
										{#if spouse.image}
											<div class="mb-3 flex h-32 w-32 items-center justify-center overflow-hidden rounded-lg">
												<img
													src={spouse.image}
													alt={spouse.name}
													class="h-full w-full object-cover"
												/>
											</div>
										{/if}
										<div class="font-bold text-primary-900">{spouse.name.split(' ')[0]}</div>
										<div class="text-sm font-semibold text-primary-700">{spouse.name.split(' ').slice(1).join(' ')}</div>
										<div class="mt-2 text-xs font-medium text-primary-700">
											{formatDateRange(spouse.birthDate, spouse.deathDate)}
										</div>
									</button>
								</div>
							{/each}
						</div>

						<!-- Children Section (below couple wrapper) -->
						{#if childrenIds.length > 0}
							<div class="flex flex-col items-center gap-4 pt-4">
								<div class="h-6 w-px bg-gradient-to-b from-primary-300 to-transparent"></div>
								<h3 class="text-sm font-semibold uppercase tracking-widest text-primary-600">
									Enfants ({childrenIds.length})
								</h3>

								{#if expandedNodes.has(rootPerson.id)}
									<!-- Children grouped by spouse -->
									{#if spouseObjects.length > 0}
										{#each spouseObjects as spouse (spouse.id)}
											{@const spouseChildren = getChildrenForSpouse(spouse.id)}
											{#if spouseChildren.length > 0}
												<div class="flex flex-col items-center gap-3">
													<div class="text-xs text-primary-500">
														avec {spouse.name.split(' ')[0]}
													</div>
													<div class="flex flex-wrap justify-center gap-4">
														{#each spouseChildren as child (child.id)}
															<div class="relative">
																<button
																	class="genealogy-node child-node {detailPersonId === child.id ? 'selected' : ''}"
																	onclick={() => handlePersonSelect(child)}
																>
																	{#if child.image}
																		<div class="mb-3 flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg">
																			<img
																				src={child.image}
																				alt={child.name}
																				class="h-full w-full object-cover"
																			/>
																		</div>
																	{/if}
																	<div class="font-semibold text-primary-900">{child.name.split(' ')[0]}</div>
																	<div class="text-xs text-primary-600">{child.name.split(' ').slice(1).join(' ')}</div>
																	<div class="mt-2 text-xs font-medium text-primary-700">
																		{formatDateRange(child.birthDate, child.deathDate)}
																	</div>
																</button>
															</div>
														{/each}
													</div>
												</div>
											{/if}
										{/each}
									{/if}

									<!-- Children without spouse association (legacy) -->
									{#if childrenWithoutSpouse.length > 0}
										<div class="flex flex-wrap justify-center gap-4">
											{#each childrenWithoutSpouse as child (child.id)}
												<div class="relative">
													<button
														class="genealogy-node child-node {detailPersonId === child.id ? 'selected' : ''}"
														onclick={() => handlePersonSelect(child)}
													>
														{#if child.image}
															<div class="mb-3 flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg">
																<img
																	src={child.image}
																	alt={child.name}
																	class="h-full w-full object-cover"
																/>
															</div>
														{/if}
														<div class="font-semibold text-primary-900">{child.name.split(' ')[0]}</div>
														<div class="text-xs text-primary-600">{child.name.split(' ').slice(1).join(' ')}</div>
														<div class="mt-2 text-xs font-medium text-primary-700">
															{formatDateRange(child.birthDate, child.deathDate)}
														</div>
													</button>
												</div>
											{/each}
										</div>
									{/if}
								{:else}
									<p class="text-sm text-primary-600">
										{childrenIds.length} enfant{childrenIds.length > 1 ? 's' : ''}
									</p>
								{/if}

								<button
									onclick={() => toggleNode(rootPerson.id)}
									class="mt-3 rounded-lg border border-primary-300 px-4 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50 active:bg-primary-100"
								>
									{expandedNodes.has(rootPerson.id)
										? '✕ Masquer les enfants'
										: '+ Afficher les enfants'}
								</button>
							</div>
						{/if}
					</div>

					<!-- Friends Section (right-side column) -->
					{#if friendObjects.length > 0}
						<div class="flex flex-col items-center gap-4 border-l-2 border-dashed border-primary-200 pl-8">
							<div class="text-xs font-semibold uppercase tracking-widest text-primary-600">Amis</div>
							<div class="flex flex-col gap-4">
								{#each friendObjects as friend (friend.id)}
									<div class="relative">
										<button
											class="genealogy-node friend-node {detailPersonId === friend.id ? 'selected' : ''}"
											onclick={() => handlePersonSelect(friend)}
										>
											{#if friend.image}
												<div class="mb-3 flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg">
													<img
														src={friend.image}
														alt={friend.name}
														class="h-full w-full object-cover"
													/>
												</div>
											{/if}
											<div class="font-semibold text-primary-900">{friend.name.split(' ')[0]}</div>
											<div class="text-xs text-primary-600">{friend.name.split(' ').slice(1).join(' ')}</div>
											<div class="mt-2 text-xs font-medium text-primary-700">
												{formatDateRange(friend.birthDate, friend.deathDate)}
											</div>
										</button>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>

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

	:global(.genealogy-node.friend-node) {
		background-color: #faf8f6;
		border-color: #c9b5a0;
	}

	:global(.genealogy-node.selected) {
		border-color: #c9a882;
		box-shadow: 0 0 0 2px #c9a882, 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	:global(.genealogy-node:active) {
		transform: translateY(0);
	}
</style>
