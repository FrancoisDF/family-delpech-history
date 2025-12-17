<script lang="ts">
	import { getRelatedArticles, getPerson } from '$lib/genealogy';
	import ArticleCarousel from '$lib/components/ArticleCarousel.svelte';
	import type { Person } from '$lib/models/person';

	interface Props {
		person: Person;
		onClose?: () => void;
		onPersonClick?: (person: Person) => void;
		onSetRootPerson?: (person: Person) => void;
		hideCloseButton?: boolean;
		personTagMap?: Record<string, any>;
		articles?: any[];
	}

	let { person, onClose, onPersonClick, onSetRootPerson, hideCloseButton = false, personTagMap = {}, articles = [] }: Props = $props();

	let relatedArticles: any[] = $state([]);
	let loading: boolean = $state(false);

	function getArticlesByPersonTag(personId: string): any[] {
		const tagInfo = personTagMap[personId];
		if (!tagInfo || !articles.length) {
			return [];
		}

		const tagId = tagInfo.tagId;
		return articles.filter((article) => {
			const articleTags = article.data?.tags || article.tags || [];
			return articleTags.some((tagItem: any) => {
				const articleTagId = tagItem.tag?.id || tagItem?.id;
				return articleTagId === tagId;
			});
		}).map((article) => ({
			id: article.id,
			title: article.data?.title || article.title,
			excerpt: article.data?.excerpt || article.excerpt,
			date: article.data?.date || article.date,
			readTime: article.data?.readTime || article.readTime,
			category: article.data?.category || article.category,
			author: article.data?.author || article.author,
			featuredImage: article.data?.featuredImage || article.featuredImage
		}));
	}

	$effect(async () => {
		loading = true;
		// First try to get articles using the person-tag mapping
		const tagArticles = getArticlesByPersonTag(person.id);
		if (tagArticles.length > 0) {
			relatedArticles = tagArticles;
		} else {
			// Fallback to the original method for backward compatibility
			relatedArticles = await getRelatedArticles(person.id);
		}
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
	<div class="relative border-b border-primary-100 px-6 py-6">
		<div class="flex items-start justify-between gap-4">
			<div class="flex-1">
				<div class="flex items-center gap-3">
					<h2 class="font-serif text-2xl font-semibold text-primary-900">{person.displayName}</h2>
					{#if onSetRootPerson}
						<button
							onclick={() => onSetRootPerson(person)}
							class="rounded-full p-2 text-primary-600 transition-colors hover:bg-accent/10 hover:text-accent active:bg-accent/20"
							aria-label="Définir comme personne racine"
							title="Afficher cet arbre généalogique en partant de cette personne"
						>
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
						</button>
					{/if}
				</div>
				<p class="mt-2 text-sm text-primary-700">{person.gender === 'female' ? 'Femme' : 'Homme'}</p>
			</div>

			{#if !hideCloseButton}
				<button
					onclick={onClose}
					class="rounded-full p-2 text-primary-600 hover:bg-primary-100 active:bg-primary-200"
					aria-label="Fermer"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			{/if}
		</div>
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

		<!-- Tags -->
		{#if person.tags && person.tags.length > 0}
			<div class="mb-6">
				<h3 class="mb-2 font-semibold text-primary-900">Catégories</h3>
				<div class="flex flex-wrap gap-2">
					{#each person.tags as tag}
						<span class="inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
							{tag}
						</span>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Family Relationships -->
		<!--<div class="mb-6 space-y-4">
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
		</div>-->

		<!-- Related Articles Carousel -->
		{#if relatedArticles.length > 0}
			<div class="mt-6 -mx-6 -mb-6">
				<ArticleCarousel
					articles={relatedArticles.map((article) => ({
						id: article.id,
						title: article.title,
						excerpt: article.excerpt,
						date: article.year || '',
						readTime: `${article.author ? `Par ${article.author}` : ''}`,
						category: article.category,
						featuredImage: article.featuredImage
					}))}
					title="Articles connexes"
					mini={true}
				/>
			</div>
		{:else if loading}
			<div class="text-center text-sm text-primary-600">Chargement des articles...</div>
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
