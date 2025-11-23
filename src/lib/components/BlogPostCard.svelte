<script lang="ts">
	import { goto } from '$app/navigation';

	let {
		id = '',
		handle = '',
		title = 'Article Sans Titre',
		excerpt = '',
		date = '',
		readTime = '',
		featuredImage = '',
		category = ''
	} = $props();

	function handleCardClick() {
		const slug = handle || id;
		goto(`/histoires/${slug}`);
	}
</script>

<article
	class="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:shadow-xl"
	onclick={handleCardClick}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			handleCardClick();
		}
	}}
	role="button"
	tabindex="0"
>
	<!-- Featured Image -->
	<div class="relative h-56 overflow-hidden bg-gradient-to-br from-primary-100 to-primary-200">
		{#if featuredImage}
			<img
				src={featuredImage}
				alt={title}
				class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
			/>
		{:else}
			<!-- Placeholder with decorative pattern -->
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
			{#if category}
				<span class="inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
					{category}
				</span>
			{/if}
			{#if date}
				<span class="text-xs font-medium text-primary-600">{date}</span>
			{/if}
			{#if readTime}
				<span class="text-xs text-primary-500">•</span>
				<span class="text-xs text-primary-600">{readTime}</span>
			{/if}
		</div>

		<!-- Title -->
		<h2 class="mb-3 font-serif text-xl font-medium text-primary-800 transition-colors duration-300 group-hover:text-accent">
			{title}
		</h2>

		<!-- Excerpt -->
		{#if excerpt}
			<p class="mb-4 flex-1 text-sm leading-relaxed text-primary-700 line-clamp-2">
				{excerpt}
			</p>
		{/if}

		<!-- Read More Link -->
		<div class="inline-flex items-center gap-2 font-semibold text-accent transition-all duration-300 group-hover:gap-3">
			<span>Lire plus</span>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
		</div>
	</div>
</article>

<style>
	:global(.line-clamp-2) {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
