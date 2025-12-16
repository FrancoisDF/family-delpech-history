<script lang="ts">
	import { getRelatedArticles, getPerson } from '$lib/genealogy';
	import type { Person } from '$lib/models/person';

	interface Props {
		person: Person;
		onClose?: () => void;
		onPersonClick?: (person: Person) => void;
	}

	let { person, onClose, onPersonClick }: Props = $props();

	let relatedArticles: any[] = $state([]);
	let loading: boolean = $state(false);

	$effect(async () => {
		loading = true;
		relatedArticles = await getRelatedArticles(person.id);
		loading = false;
	});

	function formatDate(dateStr?: string): string {
		if (!dateStr) return '';
		return new Date(dateStr).toLocaleDateString('fr-FR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function formatDateRange(birthDate?: string, deathDate?: string): string {
		const birth = birthDate ? formatDate(birthDate) : 'date inconnue';
		const death = deathDate ? formatDate(deathDate) : '';
		if (death) {
			return `${birth} – ${death}`;
		}
		return `né${person.gender === 'female' ? 'e' : ''} le ${birth}`;
	}

	async function handlePersonClick(personId: string) {
		if (onPersonClick) {
			const p = await getPerson(personId);
			if (p) {
				onPersonClick(p);
			}
		}
	}
</script>

<div class="flex h-full flex-col rounded-lg border border-primary-200 bg-white shadow-lg">
	<!-- Header -->
	<div class="relative border-b border-primary-100  px-6 py-6">
		<button
			onclick={onClose}
			class="absolute right-4 top-4 rounded-full p-2 text-primary-600 hover:bg-primary-100 active:bg-primary-200"
			aria-label="Fermer"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>

		<h2 class="pr-8 font-serif text-2xl font-semibold text-primary-900">{person.displayName}</h2>
		<p class="mt-2 text-sm text-primary-700">{person.gender === 'female' ? 'Femme' : 'Homme'}</p>
	</div>

	<!-- Content -->
	<div class="flex-1 overflow-y-auto px-6 py-6">
		<!-- Birth and Death Info -->
		<div class="mb-6 rounded-lg bg-primary-50 p-4">
			<p class="text-sm font-medium text-primary-700">
				{formatDateRange(person.birthDate, person.deathDate)}
			</p>
			{#if person.birthPlace || person.deathPlace}
				<div class="mt-2 flex flex-col gap-2 text-xs text-primary-600">
					{#if person.birthPlace}
						<p><span class="font-semibold">Lieu de naissance:</span> {person.birthPlace}</p>
					{/if}
					{#if person.deathPlace}
						<p><span class="font-semibold">Lieu du décès:</span> {person.deathPlace}</p>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Biography -->
		{#if person.bio}
			<div class="mb-6">
				<h3 class="mb-2 font-semibold text-primary-900">Biographie</h3>
				<p class="text-sm leading-relaxed text-primary-700">{person.bio}</p>
			</div>
		{/if}

		<!-- Family Relationships -->
		<div class="mb-6 space-y-4">
			{#if person.parents.length > 0}
				<div>
					<h3 class="mb-2 font-semibold text-primary-900">Parents</h3>
					<div class="flex flex-col gap-2">
						{#each person.parents as parentId}
							{#await getPerson(parentId) then parent}
								{#if parent}
									<button
										onclick={() => handlePersonClick(parentId)}
										class="rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-left text-sm text-primary-700 transition-colors hover:bg-accent/10 hover:text-accent"
									>
										<div class="font-semibold">{parent.displayName}</div>
										<div class="text-xs text-primary-600">
											{#if parent.birthDate}
												({new Date(parent.birthDate).getFullYear()})
											{/if}
										</div>
									</button>
								{/if}
							{/await}
						{/each}
					</div>
				</div>
			{/if}

			{#if person.spouses.length > 0}
				<div>
					<h3 class="mb-2 font-semibold text-primary-900">Époux(se)</h3>
					<div class="flex flex-col gap-2">
						{#each person.spouses as spouseId}
							{#await getPerson(spouseId) then spouse}
								{#if spouse}
									<button
										onclick={() => handlePersonClick(spouseId)}
										class="rounded-lg border border-sage/20 bg-sage/5 px-3 py-2 text-left text-sm text-primary-700 transition-colors hover:bg-sage/10 hover:text-sage"
									>
										<div class="font-semibold">{spouse.displayName}</div>
										<div class="text-xs text-primary-600">
											{#if spouse.birthDate}
												({new Date(spouse.birthDate).getFullYear()})
											{/if}
										</div>
									</button>
								{/if}
							{/await}
						{/each}
					</div>
				</div>
			{/if}

			{#if person.children.length > 0}
				<div>
					<h3 class="mb-2 font-semibold text-primary-900">Enfants ({person.children.length})</h3>
					<div class="flex flex-col gap-2">
						{#each person.children.slice(0, 5) as childId}
							{#await getPerson(childId) then child}
								{#if child}
									<button
										onclick={() => handlePersonClick(childId)}
										class="rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-left text-sm text-primary-700 transition-colors hover:bg-primary-100 hover:text-primary-900"
									>
										<div class="font-semibold">{child.displayName}</div>
										<div class="text-xs text-primary-600">
											{#if child.birthDate}
												({new Date(child.birthDate).getFullYear()})
											{/if}
										</div>
									</button>
								{/if}
							{/await}
						{/each}
						{#if person.children.length > 5}
							<p class="text-xs text-primary-600">+{person.children.length - 5} autre(s) enfant(s)</p>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<!-- Related Articles -->
		{#if relatedArticles.length > 0}
			<div>
				<h3 class="mb-3 font-semibold text-primary-900">Articles connexes</h3>
				{#if loading}
					<div class="text-center text-sm text-primary-600">Chargement...</div>
				{:else}
					<div class="space-y-2">
						{#each relatedArticles.slice(0, 3) as article}
							<a
								href={article.url}
								class="block rounded-lg border border-primary-200 p-3 text-left transition-all hover:border-accent hover:bg-accent/5"
							>
								<h4 class="text-sm font-semibold text-primary-900 line-clamp-2">{article.title}</h4>
								<p class="mt-1 text-xs text-primary-600 line-clamp-2">{article.excerpt}</p>
								{#if article.year}
									<p class="mt-2 text-xs font-medium text-primary-700">{article.year}</p>
								{/if}
							</a>
						{/each}
						{#if relatedArticles.length > 3}
							<p class="text-xs text-primary-600">
								<span class="font-semibold">{relatedArticles.length - 3}</span> article(s) supplémentaire(s) disponible(s)
							</p>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	:global(.line-clamp-2) {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
