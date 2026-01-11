<script lang="ts">
	let {
		title = 'Article Title',
		excerpt = '',
		date = '',
		readTime = '',
		author = '',
		category = '',
		featuredImage = '',
		featuredImageDisplayMode = 'cover',
		pdfFile = '',
		onOpenPDFModal
	} = $props();

	function handleDownload() {
		const link = document.createElement('a');
		link.href = pdfFile;
		link.download = `${title}.pdf`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
</script>

<div class="">
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

	
	<!-- Article Header -->
	<div class="mx-auto max-w-4xl px-4 pb-12 sm:px-6 lg:px-8">
		<div>
			<!-- Featured Image -->
			{#if featuredImage}
				<div class="mx-auto max-w-4xl overflow-hidden rounded-xl">
					<img
						src={featuredImage}
						alt={title}
						class="h-96 w-full {featuredImageDisplayMode === 'contain'
							? 'object-contain'
							: 'object-cover'}"
					/>
				</div>
			{/if}
			<h1 class="mb-4 font-serif text-4xl font-bold text-primary-900 md:text-5xl pt-6">{title}</h1>

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

			<!-- PDF Actions -->
			{#if pdfFile}
				<div class="mt-8 flex gap-3">
					<button
						onclick={() => onOpenPDFModal?.(pdfFile, title)}
						class="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-800"
						type="button"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
							/>
						</svg>
						Voir le PDF
					</button>
					<button
						onclick={handleDownload}
						class="inline-flex items-center gap-2 rounded-lg border-2 border-primary-700 px-6 py-3 font-semibold text-primary-700 transition-colors hover:bg-primary-50"
						type="button"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
							/>
						</svg>
						Télécharger
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>
