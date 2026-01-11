<style>
	:global(.line-clamp-2) {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		line-clamp: 2;
		overflow: hidden;
	}

	:global([data-carousel-item]::-webkit-scrollbar) {
		display: none;
	}

	div[style*='scroll-behavior: smooth']::-webkit-scrollbar {
		display: none;
	}
</style>
<script lang="ts">
	import FlipCard from '../FlipCard.svelte';


	let {
		title = '',
		images = [],
		columns = 3,
		connectTop = false,
		connectBottom = false,
		viewMode = 'grid'
	}: {
		title?: string;
		images?: Array<{
			url: string;
			alt: string;
			caption: string;
			description?: string;
			imageDisplayMode?: string;
		}>;
		columns?: number;
		connectTop?: boolean;
		connectBottom?: boolean;
		viewMode?: 'grid' | 'carousel';
	} = $props();


	const spacingTop = $derived(connectTop ? '' : 'pt-12');
	const spacingBottom = $derived(connectBottom ? '' : 'pb-12');


	// Carousel scroll state (horizontal scroll)
	let scrollContainer = $state<HTMLDivElement>();
	let currentScroll = $state(0);
	let maxScroll = $state(0);
	let canScrollLeft = $state(false);
	let canScrollRight = $state(true);

	$effect(() => {
		if (scrollContainer) {
			updateScrollState();
			scrollContainer.addEventListener('scroll', updateScrollState);
			return () => {
				scrollContainer?.removeEventListener('scroll', updateScrollState);
			};
		}
	});

	function updateScrollState() {
		if (scrollContainer) {
			currentScroll = scrollContainer.scrollLeft;
			maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
			canScrollLeft = currentScroll > 0;
			canScrollRight = currentScroll < maxScroll - 10;
		}
	}

	function scroll(direction: 'left' | 'right') {
		if (!scrollContainer) return;

		const itemWidth = scrollContainer.querySelector('[data-carousel-item]')?.clientWidth || 0;
		const gap = 32; // gap-8 = 2rem = 32px
		const scrollAmount = itemWidth + gap;

		if (direction === 'left') {
			scrollContainer.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
		} else {
			scrollContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
		}
	}
</script>

<section class="px-4 {spacingTop} {spacingBottom} sm:px-6 lg:px-8">
	<div class="mx-auto max-w-6xl">
		{#if title}
			<h2 class="mb-8 text-center font-serif text-3xl font-bold text-primary-900">
				{title}
			</h2>
		{/if}

		{#if viewMode === 'grid'}
			<div class="grid gap-6 md:grid-cols-{columns}">
				{#each images as image, index (index)}
					<FlipCard
						url={image.url}
						alt={image.alt}
						caption={image.caption}
						description={image.description || ''}
						imageDisplayMode={image.imageDisplayMode}
					/>
				{/each}
			</div>
		{:else if viewMode === 'carousel'}
		<div class="relative">
			<div
				bind:this={scrollContainer}
				class="flex gap-8 overflow-x-auto scroll-smooth pb-4"
				style="scroll-behavior: smooth; scrollbar-width: none;"
			>
				{#each images as image, index (index)}
					<div data-carousel-item class="w-full flex-shrink-0 overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:shadow-xl sm:w-1/2 lg:w-1/3">
						<FlipCard
							url={image.url}
							alt={image.alt}
							caption={image.caption}
							description={image.description || ''}
							imageDisplayMode={image.imageDisplayMode}
						/>
					</div>
				{/each}
			</div>

			<!-- Navigation Buttons -->
			{#if images.length > 0}
				<div class="absolute -left-4 top-1/3 z-10 -translate-y-1/2 md:-left-8">
					<button
						onclick={() => scroll('left')}
						disabled={!canScrollLeft}
						class="rounded-full bg-white p-3 shadow-lg transition-all duration-300 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50"
						aria-label="Scroll left"
					>
						<svg class="h-5 w-5 text-primary-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
						</svg>
					</button>
				</div>
				<div class="absolute -right-4 top-1/3 z-10 -translate-y-1/2 md:-right-8">
					<button
						onclick={() => scroll('right')}
						disabled={!canScrollRight}
						class="rounded-full bg-white p-3 shadow-lg transition-all duration-300 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50"
						aria-label="Scroll right"
					>
						<svg class="h-5 w-5 text-primary-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
						</svg>
					</button>
				</div>
			{/if}

			{#if images.length === 0}
				<div class="rounded-lg border-2 border-dashed border-primary-300 bg-primary-50 p-8 text-center">
					<p class="text-primary-700">Aucune image disponible.</p>
				</div>
			{/if}
		</div>
		{/if}
	</div>
</section>
