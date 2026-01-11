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
	}

	interface Props {
		people?: ConfiguredPerson[];
		relationships?: PersonRelationship[];
		onPersonSelected?: (person: Person) => void;
	}

	let { people = [], relationships = [], onPersonSelected }: Props = $props();

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

	// Get relationships for a person
	function getPersonRelationships(personId: string, relationType: string) {
		return relationships
			?.filter((r) => r.personId === personId && r.relationType === relationType)
			.map((r) => people?.find((p) => p.id === r.relatedPersonId))
			.filter(Boolean) as ConfiguredPerson[];
	}

	function handlePersonClick(person: ConfiguredPerson) {
		if (onPersonSelected) {
			onPersonSelected(convertToPerson(person));
		}
	}

	function formatDateRange(birthDate?: string, deathDate?: string): string {
		if (!birthDate && !deathDate) return '';
		const birthYear = birthDate ? new Date(birthDate).getFullYear() : '?';
		const deathYear = deathDate ? new Date(deathDate).getFullYear() : '';
		if (deathYear) {
			return `${birthYear}–${deathYear}`;
		}
		return `${birthYear}–`;
	}
</script>

<div class="genealogy-tree-container">
	{#if people && people.length > 0}
		<div class="space-y-8">
			{#each people as person (person.id)}
				<div class="genealogy-person-section">
					<!-- Person Card with Image -->
					<button
						onclick={() => handlePersonClick(person)}
						class="genealogy-node group w-full rounded-lg border-2 border-primary-200 bg-white p-6 transition-all hover:border-accent hover:shadow-lg"
					>
						<div class="flex items-start gap-4">
							{#if person.image}
								<img
									src={person.image}
									alt={person.name}
									class="h-24 w-24 flex-shrink-0 rounded-lg object-cover"
								/>
							{:else}
								<div class="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100">
									<svg class="h-12 w-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
										/>
									</svg>
								</div>
							{/if}

							<div class="flex-1 text-left">
								<h3 class="font-serif text-lg font-bold text-primary-900 transition-colors group-hover:text-accent">
									{person.name}
								</h3>
								<p class="text-sm text-primary-600">
									{formatDateRange(person.birthDate, person.deathDate)}
								</p>
								{#if person.description}
									<p class="mt-2 line-clamp-2 text-sm text-primary-700">
										{person.description}
									</p>
								{/if}
							</div>
						</div>
					</button>

					<!-- Relationships -->
					{#if relationships && relationships.length > 0}
						{@const spouses = getPersonRelationships(person.id, 'spouse')}
						{@const children = getPersonRelationships(person.id, 'child')}
						{@const parents = getPersonRelationships(person.id, 'parent')}
						{@const friends = getPersonRelationships(person.id, 'friend')}
						<div class="mt-4 space-y-4 pl-8">
							<!-- Spouses/Couples -->
							{#if spouses.length > 0}
								<div>
									<h4 class="mb-2 text-sm font-semibold text-primary-900">Couple</h4>
									<div class="space-y-2">
										{#each spouses as spouse (spouse.id)}
											<button
												onclick={() => handlePersonClick(spouse)}
												class="genealogy-node group block w-full rounded-lg border border-primary-200 bg-primary-50 p-4 text-left transition-all hover:border-accent hover:bg-accent/5"
											>
												<p class="font-medium text-primary-900 transition-colors group-hover:text-accent">
													{spouse.name}
												</p>
												<p class="text-xs text-primary-600">
													{formatDateRange(spouse.birthDate, spouse.deathDate)}
												</p>
											</button>
										{/each}
									</div>
								</div>
							{/if}

							<!-- Children -->
							{#if children.length > 0}
								<div>
									<h4 class="mb-2 text-sm font-semibold text-primary-900">Enfants</h4>
									<div class="space-y-2">
										{#each children as child (child.id)}
											<button
												onclick={() => handlePersonClick(child)}
												class="genealogy-node group block w-full rounded-lg border border-primary-200 bg-white p-4 text-left transition-all hover:border-accent hover:bg-accent/5"
											>
												<p class="font-medium text-primary-900 transition-colors group-hover:text-accent">
													{child.name}
												</p>
												<p class="text-xs text-primary-600">
													{formatDateRange(child.birthDate, child.deathDate)}
												</p>
											</button>
										{/each}
									</div>
								</div>
							{/if}

							<!-- Parents -->
							{#if parents.length > 0}
								<div>
									<h4 class="mb-2 text-sm font-semibold text-primary-900">Parents</h4>
									<div class="space-y-2">
										{#each parents as parent (parent.id)}
											<button
												onclick={() => handlePersonClick(parent)}
												class="genealogy-node group block w-full rounded-lg border border-primary-200 bg-white p-4 text-left transition-all hover:border-accent hover:bg-accent/5"
											>
												<p class="font-medium text-primary-900 transition-colors group-hover:text-accent">
													{parent.name}
												</p>
												<p class="text-xs text-primary-600">
													{formatDateRange(parent.birthDate, parent.deathDate)}
												</p>
											</button>
										{/each}
									</div>
								</div>
							{/if}

							<!-- Friends -->
							{#if friends.length > 0}
								<div>
									<h4 class="mb-2 text-sm font-semibold text-primary-900">Amis</h4>
									<div class="space-y-2">
										{#each friends as friend (friend.id)}
											<button
												onclick={() => handlePersonClick(friend)}
												class="genealogy-node group block w-full rounded-lg border border-primary-200 bg-white p-4 text-left transition-all hover:border-accent hover:bg-accent/5"
											>
												<p class="font-medium text-primary-900 transition-colors group-hover:text-accent">
													{friend.name}
												</p>
												<p class="text-xs text-primary-600">
													{formatDateRange(friend.birthDate, friend.deathDate)}
												</p>
											</button>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{:else}
		<div class="rounded-lg border border-primary-200 bg-primary-50 p-8 text-center">
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
	{/if}
</div>

<style>
	:global(.genealogy-tree-container) {
		width: 100%;
	}

	:global(.genealogy-person-section) {
		border-left: 3px solid var(--primary-200);
		padding-left: 1rem;
	}
</style>
