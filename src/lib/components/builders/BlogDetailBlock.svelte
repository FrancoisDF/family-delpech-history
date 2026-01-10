<script lang="ts">
	let {
		title = '',
		excerpt = '',
		content = '',
		date = '',
		readTime = '',
		author = '',
		category = '',
		featuredImage = '',
		featuredImageDisplayMode = 'cover'
	} = $props<{
		title?: string;
		excerpt?: string;
		content?: string;
		date?: string;
		readTime?: string;
		author?: string;
		category?: string;
		featuredImage?: string;
		featuredImageDisplayMode?: string;
	}>();
</script>

<article class="min-h-screen ">
	<div class="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
		<!-- Back Link -->
		<a
			href="/histoires"
			class="mb-8 inline-flex items-center gap-2 text-primary-900 transition-colors hover:text-accent"
		>
			<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
				<path
					d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 111.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
				/>
			</svg>
			Retour aux histoires
		</a>

		<!-- Main Content -->
		<div class="rounded-xl bg-white p-8 shadow-lg md:p-12">
			{#if featuredImage}
				<img
					src={featuredImage}
					alt={title}
					class="mb-8 h-96 w-full rounded-lg {featuredImageDisplayMode === 'contain'
						? 'object-contain'
						: 'object-cover'}"
				/>
			{/if}

			<!-- Header -->
			<div class="mb-8 border-b border-primary-200 pb-8">
				<h1 class="mb-4 font-serif text-4xl font-bold text-primary-900">{title}</h1>

				<!-- Meta Information -->
				<div class="flex flex-wrap items-center gap-4">
					{#if author}
						<span class="text-sm font-medium text-primary-600">Par {author}</span>
					{/if}
					{#if date}
						<span class="text-sm text-primary-600">{date}</span>
					{/if}
					{#if readTime}
						<span class="text-sm text-primary-600">•</span>
						<span class="text-sm text-primary-600">{readTime}</span>
					{/if}
					{#if category}
						<span
							class="inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent"
						>
							{category}
						</span>
					{/if}
				</div>
			</div>

			<!-- Excerpt -->
			{#if excerpt}
				<p class="mb-8 text-xl italic leading-relaxed text-primary-700">
					{excerpt}
				</p>
			{/if}

			<!-- Content -->
			{#if content}
				<div class="prose prose-lg max-w-none text-primary-900">
					<div class="mb-6 leading-relaxed">
						{@html content}
					</div>
				</div>
			{/if}

			<!-- Placeholder for more content -->
			<div
				class="mt-12 rounded-lg border-2 border-dashed border-primary-300 bg-primary-50 p-8 text-center"
			>
				<p class="text-primary-700">Contenu complet disponible dans l'éditeur Builder.io</p>
			</div>
		</div>
	</div>
</article>
