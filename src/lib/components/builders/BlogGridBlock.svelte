<script lang="ts">
	import { generateBlogUrl } from '$lib/url-utils';
	import { fetchArticles } from '$lib/components/article.remote';

	let {
		title = 'Histoires de Famille',
		description = '',
		columnCount = 3,
		imageDisplayMode = 'cover'
	} = $props<{
		title?: string;
		description?: string;
		columnCount?: number;
		imageDisplayMode?: string;
	}>();

	let posts = await fetchArticles();

	function getGridClass() {
		switch (columnCount) {
			case 2:
				return 'md:grid-cols-2';
			case 4:
				return 'md:grid-cols-4';
			default:
				return 'md:grid-cols-3';
		}
	}
</script>

<section class=" px-4 py-16 sm:px-6 lg:px-8">
	<div class="mx-auto max-w-6xl">
		{#if title}
			<h2 class="mb-4 text-center font-serif text-4xl font-bold text-primary-900">
				{title}
			</h2>
		{/if}
		{#if description}
			<p class="mb-12 text-center text-lg text-primary-700">
				{description}
			</p>
		{/if}

		{#if posts && posts.length > 0}
			<div class="grid gap-8" style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));">
				{#each posts as post (post.id)}
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
									class="h-full w-full {imageDisplayMode === 'contain'
										? 'object-contain'
										: 'object-cover'} transition-transform duration-500 group-hover:scale-110"
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
									<span class="text-xs font-medium text-primary-600">{post.date}</span>
								{/if}
								{#if post.readTime}
									<span class="text-xs text-primary-500">•</span>
									<span class="text-xs text-primary-600">{post.readTime}</span>
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
					</a>
				{/each}
			</div>
		{:else}
			<div
				class="rounded-lg border-2 border-dashed border-primary-300 bg-primary-50 p-8 text-center"
			>
				<p class="text-primary-700">Aucun article blog disponible pour le moment.</p>
			</div>
		{/if}
	</div>
</section>

<style>
	:global(.line-clamp-2) {
		display: -webkit-box;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
