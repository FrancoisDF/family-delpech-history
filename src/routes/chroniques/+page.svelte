<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Chroniques | Histoire de Famille</title>
	<meta name="description" content="Parcourez nos chroniques et leurs histoires réunies dans un même récit." />
</svelte:head>

<div class="min-h-screen bg-primary-50/30 pb-20 pt-10">
	<div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
		<div class="mb-12 text-center">
			<div class="mb-4 inline-flex rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
				Chroniques
			</div>
			<h1 class="font-serif text-4xl font-bold text-primary-900">Les chroniques</h1>
			<p class="mx-auto mt-4 max-w-2xl text-lg text-primary-700">
				Des parcours de lecture qui réunissent plusieurs histoires pour mieux les découvrir.
			</p>
		</div>

		{#if data.chroniques.length > 0}
			<div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.chroniques as chronique (chronique.id)}
					<a
						href={`/chroniques/${chronique.handle}`}
						class="group block overflow-hidden rounded-2xl border border-accent/20 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
					>
						<div class="relative h-56 overflow-hidden bg-gradient-to-br from-primary-100 to-accent/20">
							{#if chronique.featuredImage}
								<img
									src={chronique.featuredImage}
									alt={chronique.title}
									class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
								/>
							{:else}
								<div class="flex h-full items-center justify-center text-accent/70">
									<svg class="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v12m-6-6h12M4 4h16v16H4z" />
									</svg>
								</div>
							{/if}
						</div>
						<div class="p-6">
							<div class="mb-3 flex flex-wrap items-center gap-2">
								<span class="rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">Chronique</span>
								{#if chronique.category}
									<span class="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">{chronique.category}</span>
								{/if}
							</div>
							<h2 class="font-serif text-2xl font-medium text-primary-800 transition-colors group-hover:text-accent">{chronique.title}</h2>
							{#if chronique.excerpt}
								<p class="mt-3 line-clamp-3 text-sm leading-relaxed text-primary-700">{chronique.excerpt}</p>
							{/if}
							<div class="mt-5 flex items-center justify-between text-sm font-semibold text-accent">
								<span>{chronique.referencedArticles.length} article{chronique.referencedArticles.length === 1 ? '' : 's'}</span>
								<span>Lire la chronique →</span>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{:else}
			<div class="rounded-xl border-2 border-dashed border-primary-300 bg-primary-50 p-10 text-center text-primary-700">
				Aucune chronique n’est disponible pour le moment.
			</div>
		{/if}
	</div>
</div>

<style>
	:global(.line-clamp-3) {
		display: -webkit-box;
		line-clamp: 3;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
