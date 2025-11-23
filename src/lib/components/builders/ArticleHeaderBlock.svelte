<script lang="ts">
	let {
		title = 'Article Title',
		excerpt = '',
		date = '',
		readTime = '',
		author = '',
		category = '',
		featuredImage = ''
	} = $props();
</script>

<div class="bg-gradient-warm">
	<div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
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
	</div>

	<!-- Featured Image -->
	{#if featuredImage}
		<div class="mx-auto max-w-4xl overflow-hidden rounded-xl">
			<img src={featuredImage} alt={title} class="h-96 w-full object-cover" />
		</div>
	{/if}

	<!-- Article Header -->
	<div class="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
		<div class="rounded-xl bg-white p-8 shadow-lg md:p-12">
			<h1 class="mb-4 font-serif text-4xl font-bold text-primary-900 md:text-5xl">{title}</h1>

			<!-- Meta Information -->
			<div class="flex flex-wrap items-center gap-4 border-b border-primary-200 pb-6">
				{#if author}
					<span class="text-sm font-medium text-primary-600">Par {author}</span>
				{/if}
				{#if date}
					<span class="font-semibold text-primary-900">{date}</span>
				{/if}
				{#if readTime}
					<span class="text-sm text-primary-600">•</span>
					<span class="text-sm text-primary-600">{readTime}</span>
				{/if}
				{#if category}
					<span
						class="text-accent-700 inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold"
					>
						{category}
					</span>
				{/if}
			</div>

			<!-- Excerpt -->
			{#if excerpt}
				<p class="mt-6 text-xl italic leading-relaxed text-primary-700">
					{excerpt}
				</p>
			{/if}
		</div>
	</div>
</div>
