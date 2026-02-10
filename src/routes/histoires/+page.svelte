<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { generateBlogUrl } from '$lib/url-utils';
	import type { PageData } from './$types';
	import CTABlock from '$lib/components/builders/CTABlock.svelte';

	let { data } = $props<{ data: PageData }>();

	let searchQuery = $state(data.params.q);
	let selectedTags = $state(data.params.tags);
	let selectedCategory = $state(data.params.category);
	let dateFrom = $state(data.params.dateFrom);
	let dateTo = $state(data.params.dateTo);
	let isFiltersExpanded = $state(false);
	let timer: any;

	function updateSearch() {
		clearTimeout(timer);
		timer = setTimeout(() => {
			applyFilters();
		}, 300);
	}

	function resetFilters() {
		searchQuery = '';
		selectedTags = [];
		selectedCategory = '';
		dateFrom = '';
		dateTo = '';
		applyFilters();
	}

	function toggleTag(tagId: string) {
		if (selectedTags.includes(tagId)) {
			selectedTags = selectedTags.filter((id) => id !== tagId);
		} else {
			selectedTags = [...selectedTags, tagId];
		}
		applyFilters();
	}

	function applyFilters() {
		const params = new URLSearchParams();
		if (searchQuery) params.set('q', searchQuery);
		if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
		if (selectedCategory) params.set('category', selectedCategory);
		if (dateFrom) params.set('dateFrom', dateFrom);
		if (dateTo) params.set('dateTo', dateTo);

		goto(`?${params.toString()}`, { keepFocus: true, noScroll: true });
	}

	function getActiveFilterCount(): number {
		let count = 0;
		if (searchQuery) count++;
		if (selectedCategory) count++;
		if (dateFrom) count++;
		if (dateTo) count++;
		count += selectedTags.length;
		return count;
	}

	$effect(() => {
		searchQuery = data.params.q;
		selectedTags = data.params.tags;
		selectedCategory = data.params.category;
		dateFrom = data.params.dateFrom;
		dateTo = data.params.dateTo;
	});
</script>

<svelte:head>
	<title>Histoires de Famille | Recherche</title>
	<meta name="description" content="Parcourez les histoires et mémoires de notre famille." />
</svelte:head>

<div class="min-h-screen bg-primary-50/30 pb-20 pt-10">
	<div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="mb-12 text-center">
			<h1 class="mb-4 font-serif text-4xl font-bold text-primary-900">Histoires de Famille</h1>
			<p class="mx-auto max-w-2xl text-lg text-primary-700">
				Explorez les récits, les anecdotes et les moments marquants de notre histoire commune.
			</p>
		</div>

		<!-- Search Bar (Always Visible) -->
		<div class="mb-6 flex gap-3">
			<div class="relative flex-1">
				<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
					<svg
						class="h-5 w-5 text-gray-500"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
						aria-hidden="true"
					>
						<path
							fill-rule="evenodd"
							d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<input
					type="text"
					bind:value={searchQuery}
					oninput={updateSearch}
					class="block w-full rounded-lg border border-primary-200 bg-white py-3 pl-12 pr-3 text-primary-900 placeholder-primary-400 focus:border-accent focus:ring-accent sm:text-sm shadow-sm"
					placeholder="Rechercher une histoire..."
				/>
			</div>
			<button
				onclick={() => (isFiltersExpanded = !isFiltersExpanded)}
				class="relative rounded-lg border border-primary-200 bg-white px-4 py-3 text-primary-700 transition-all hover:bg-primary-50 shadow-sm"
				title={isFiltersExpanded ? 'Réduire les filtres' : 'Afficher les filtres'}
			>
				<svg
					class="h-5 w-5"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
					/>
				</svg>
				{#if getActiveFilterCount() > 0}
					<span
						class="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-white"
						style="transform: translate(50%, -50%)"
					>
						{getActiveFilterCount()}
					</span>
				{/if}
			</button>
		</div>

		<!-- Filters Panel (Collapsible) -->
		{#if isFiltersExpanded}
			<div class="mb-12 rounded-2xl bg-white shadow-sm p-6">
				<div class="mb-6 flex items-center justify-between">
					<h3 class="font-semibold text-primary-900">Filtres avancés</h3>
					{#if getActiveFilterCount() > 0}
						<button
							onclick={resetFilters}
							class="text-sm font-semibold text-accent transition-colors hover:text-accent/80"
							title="Effacer tous les filtres"
						>
							✕ Effacer tous
						</button>
					{/if}
				</div>

				<div class="space-y-6">
					<!-- Filters Grid -->
					<div class="grid gap-6 md:grid-cols-3">
						<!-- Category Filter -->
						{#if data.allCategories.length > 0}
							<div>
								<label class="mb-2 block text-sm font-semibold text-primary-700">Catégorie :</label>
								<select
									bind:value={selectedCategory}
									onchange={applyFilters}
									class="block w-full rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-primary-900 focus:border-accent focus:ring-accent sm:text-sm"
								>
									<option value="">Toutes les catégories</option>
									{#each data.allCategories as category}
										<option value={category}>{category}</option>
									{/each}
								</select>
							</div>
						{/if}

						<!-- Date From Filter -->
						{#if data.allYears.length > 0}
							<div>
								<label class="mb-2 block text-sm font-semibold text-primary-700">À partir de :</label>
								<select
									bind:value={dateFrom}
									onchange={applyFilters}
									class="block w-full rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-primary-900 focus:border-accent focus:ring-accent sm:text-sm"
								>
									<option value="">Année de début</option>
									{#each data.allYears as year}
										<option value={year}>{year}</option>
									{/each}
								</select>
							</div>
						{/if}

						<!-- Date To Filter -->
						{#if data.allYears.length > 0}
							<div>
								<label class="mb-2 block text-sm font-semibold text-primary-700">Jusqu'à :</label>
								<select
									bind:value={dateTo}
									onchange={applyFilters}
									class="block w-full rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-primary-900 focus:border-accent focus:ring-accent sm:text-sm"
								>
									<option value="">Année de fin</option>
									{#each data.allYears as year}
										<option value={year}>{year}</option>
									{/each}
								</select>
							</div>
						{/if}
					</div>

					<!-- Tags -->
					{#if data.allTags.length > 0}
						<div>
							<h3 class="mb-3 text-sm font-semibold text-primary-700">Filtrer par thèmes :</h3>
							<div class="flex flex-wrap gap-2">
								{#each data.allTags as tag (tag.id)}
									<button
										onclick={() => toggleTag(tag.id)}
										class="rounded-full px-3 py-1 text-sm font-medium transition-colors duration-200 {selectedTags.includes(
											tag.id
										)
											? 'bg-accent text-white hover:bg-accent/90'
											: 'bg-primary-100 text-primary-700 hover:bg-primary-200'}"
									>
										{tag.label}
									</button>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Results Grid -->
		<div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
			{#if data.articles.length > 0}
				{#each data.articles as post (post.id)}
					<a
						href={`/histoires/${generateBlogUrl(post.id, post.title)}`}
						class="group block cursor-pointer overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:shadow-xl"
						aria-label={`Lire ${post.title}`}
					>
						<!-- Featured Image -->
						<div
							class="relative h-56 overflow-hidden bg-gradient-to-br from-primary-100 to-primary-200"
						>
							{#if post.featuredImage}
								<img
									src={post.featuredImage}
									alt={post.title}
									class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
								/>
							{:else}
								<div class="flex h-full items-center justify-center">
									<div class="text-center">
										<svg
											class="mx-auto h-16 w-16 text-primary-300"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="1.5"
												d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
											/>
										</svg>
									</div>
								</div>
							{/if}
						</div>

						<!-- Content -->
						<div class="flex flex-col p-6">
							<!-- Meta Information -->
							<div class="mb-3 flex flex-wrap items-center gap-2">
								{#if post.category}
									<span
										class="inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent"
									>
										{post.category}
									</span>
								{/if}
								{#if post.date}
									<span class="text-xs font-medium text-primary-600">
										{new Date(post.date).toLocaleDateString('fr-FR', {
											year: 'numeric',
											month: 'long',
											day: 'numeric'
										})}
									</span>
								{/if}
							</div>

							<!-- Title -->
							<h3
								class="mb-3 font-serif text-xl font-medium text-primary-800 transition-colors duration-300 group-hover:text-accent"
							>
								{post.title}
							</h3>

							<!-- Excerpt -->
							{#if post.excerpt}
								<p class="mb-4 line-clamp-2 flex-1 text-sm leading-relaxed text-primary-700">
									{post.excerpt}
								</p>
							{/if}

							<!-- Read More Link -->
							<div
								class="mt-auto inline-flex items-center gap-2 font-semibold text-accent transition-all duration-300 group-hover:gap-3"
							>
								<span>Lire plus</span>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 5l7 7-7 7"
									/>
								</svg>
							</div>
						</div>
					</a>
				{/each}
			{:else}
				<div class="col-span-full py-12 text-center">
					<div
						class="rounded-lg border-2 border-dashed border-primary-300 bg-primary-50 p-8"
					>
						<svg
							class="mx-auto mb-4 h-12 w-12 text-primary-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							/>
						</svg>
						<p class="text-lg text-primary-700">
							Aucune histoire ne correspond à votre recherche.
						</p>
						<button
							onclick={resetFilters}
							class="mt-4 text-sm font-semibold text-accent hover:text-accent/80"
						>
							Effacer les filtres
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
{#if data.siteConfig }
	<CTABlock
		title={data.siteConfig.ctaBlockTitle as string}
		description={data.siteConfig.ctaBlockDescription as string}
		buttonLink={data.siteConfig.ctaBlockButtonLink as string}
		buttonText={data.siteConfig.ctaBlockButtonText as string}
	/>
{/if}

<style>
	:global(.line-clamp-2) {
		display: -webkit-box;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
