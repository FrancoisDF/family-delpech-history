<script lang="ts">
	interface Article {
		id: string;
		title: string;
		excerpt: string;
		date: string;
		readTime: string;
		featuredImage?: string;
		category?: string;
		handle?: string;
	}

	let {
		articles = [],
		title = 'Articles Connexes',
		itemsPerSlide = 3
	}: {
		articles?: Article[];
		title?: string;
		itemsPerSlide?: number;
	} = $props();

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

	function handleCardClick(article: Article) {
		const slug = article.handle || article.id;
		window.location.href = `/histoires/${slug}`;
	}
</script>

<section class="bg-gradient-warm px-4 py-16 sm:px-6 lg:px-8">
	<div class="mx-auto max-w-6xl">
		{#if title}
			<h2 class="mb-12 text-center font-serif text-3xl font-bold text-primary-900 md:text-4xl">
				{title}
			</h2>
		{/if}

		{#if articles.length > 0}
			<div class="relative">
				<!-- Scroll Container -->
				<div
					bind:this={scrollContainer}
					class="flex gap-8 overflow-x-auto scroll-smooth pb-4"
					style="scroll-behavior: smooth; scrollbar-width: none;"
				>
					{#each articles as article (article.id)}
						<div
							data-carousel-item
							class="group w-full flex-shrink-0 cursor-pointer overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:shadow-xl sm:w-1/2 lg:w-1/3"
							onclick={() => handleCardClick(article)}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									handleCardClick(article);
								}
							}}
							role="button"
							tabindex="0"
						>
							<!-- Featured Image -->
							<div
								class="relative h-56 overflow-hidden bg-gradient-to-br from-primary-100 to-primary-200"
							>
								{#if article.featuredImage}
									<img
										src={article.featuredImage}
										alt={article.title}
										class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
									/>
								{:else}
									<div class="flex h-full items-center justify-center">
										<svg
											class="h-16 w-16 text-primary-300"
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
								{/if}
							</div>

							<!-- Content -->
							<div class="flex flex-col p-6">
								<!-- Meta Information -->
								<div class="mb-3 flex flex-wrap items-center gap-2">
									{#if article.category}
										<span
											class="inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent"
										>
											{article.category}
										</span>
									{/if}
									{#if article.date}
										<span class="text-xs font-medium text-primary-600">{article.date}</span>
									{/if}
									{#if article.readTime}
										<span class="text-xs text-primary-500">•</span>
										<span class="text-xs text-primary-600">{article.readTime}</span>
									{/if}
								</div>

								<!-- Title -->
								<h3
									class="mb-3 line-clamp-2 font-serif text-lg font-medium text-primary-800 transition-colors duration-300 group-hover:text-accent"
								>
									{article.title}
								</h3>

								<!-- Excerpt -->
								{#if article.excerpt}
									<p class="mb-4 line-clamp-2 flex-1 text-sm leading-relaxed text-primary-700">
										{article.excerpt}
									</p>
								{/if}

								<!-- Read More Link -->
								<div
									class="inline-flex items-center gap-2 font-semibold text-accent transition-all duration-300 group-hover:gap-3"
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
						</div>
					{/each}
				</div>

				<!-- Navigation Buttons -->
				{#if canScrollLeft || canScrollRight}
					<div class="absolute -left-4 top-1/3 z-10 -translate-y-1/2 md:-left-8">
						<button
							onclick={() => scroll('left')}
							disabled={!canScrollLeft}
							class="rounded-full bg-white p-3 shadow-lg transition-all duration-300 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50"
							aria-label="Scroll left"
						>
							<svg
								class="h-5 w-5 text-primary-900"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 19l-7-7 7-7"
								/>
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
							<svg
								class="h-5 w-5 text-primary-900"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 5l7 7-7 7"
								/>
							</svg>
						</button>
					</div>
				{/if}
			</div>
		{:else}
			<div
				class="rounded-lg border-2 border-dashed border-primary-300 bg-primary-50 p-8 text-center"
			>
				<p class="text-primary-700">Aucun article connexe disponible.</p>
			</div>
		{/if}
	</div>
</section>

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
