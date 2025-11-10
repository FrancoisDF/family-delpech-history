<script lang="ts">
	import { goto } from '$app/navigation';

	export let id: string = '';
	export let title: string = 'Article Sans Titre';
	export let excerpt: string = '';
	export let date: string = '';
	export let readTime: string = '';
	export let featuredImage: string = '';
	export let category: string = '';

	function handleCardClick() {
		goto(`/histoires/${id}`);
	}
</script>

<article
	class="group cursor-pointer rounded-xl border border-primary-200 bg-white p-8 shadow-md transition-all hover:shadow-lg hover:border-accent"
	onclick={handleCardClick}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			handleCardClick();
		}
	}}
	role="button"
	tabindex="0"
>
	{#if featuredImage}
		<div class="mb-6 overflow-hidden rounded-lg h-48">
			<img
				src={featuredImage}
				alt={title}
				class="h-full w-full object-cover transition-transform group-hover:scale-105"
			/>
		</div>
	{/if}

	<div class="mb-4 flex flex-wrap items-center gap-3">
		{#if date}
			<span class="font-semibold text-primary-900">{date}</span>
		{/if}
		{#if category}
			<span class="inline-block rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-900">
				{category}
			</span>
		{/if}
		{#if date && readTime}
			<span class="text-sm text-primary-600">•</span>
		{/if}
		{#if readTime}
			<span class="text-sm text-primary-600">{readTime} de lecture</span>
		{/if}
	</div>

	<h2 class="mb-3 font-serif text-2xl font-bold text-primary-900 transition-colors group-hover:text-accent">
		{title}
	</h2>

	{#if excerpt}
		<p class="mb-6 text-primary-700">{excerpt}</p>
	{/if}

	<div class="inline-block font-semibold text-primary-900 transition-colors group-hover:text-accent">
		Lire l'article complet →
	</div>
</article>
