<script lang="ts">
	let {
		videoUrl = '',
		title = '',
		caption = '',
		aspectRatio = '16/9',
		connectTop = false,
		connectBottom = false
	} = $props();

	const spacingTop = $derived(connectTop ? '' : 'pt-12');
	const spacingBottom = $derived(connectBottom ? '' : 'pb-12');

	// Dynamic classes for connected sections
	const roundedClasses = $derived(
		connectTop && connectBottom
			? 'rounded-none'
			: connectTop
				? 'rounded-t-none rounded-b-xl'
				: connectBottom
					? 'rounded-t-xl rounded-b-none'
					: 'rounded-xl'
	);

	const shadowClasses = $derived(connectTop || connectBottom ? '' : 'shadow-md');
</script>

<section class=" px-4 {spacingTop} {spacingBottom} sm:px-6 lg:px-8">
	<div class="mx-auto max-w-4xl">
		{#if title}
			<h2 class="mb-6 text-center font-serif text-2xl font-bold text-primary-900">
				{title}
			</h2>
		{/if}

		<div class="{roundedClasses} {shadowClasses} overflow-hidden bg-white p-4">
			<div style="aspect-ratio: {aspectRatio};" class="relative">
				{#if videoUrl}
					<iframe
						src={videoUrl}
						title={title || 'Video'}
						class="absolute inset-0 h-full w-full"
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowfullscreen
					></iframe>
				{:else}
					<div class="flex h-full items-center justify-center bg-primary-100">
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
									stroke-width="2"
									d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
								/>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<p class="mt-2 text-primary-600">Ajouter un lien vidéo</p>
						</div>
					</div>
				{/if}
			</div>

			{#if caption}
				<p class="mt-4 text-center text-sm text-primary-700">
					{caption}
				</p>
			{/if}
		</div>
	</div>
</section>
