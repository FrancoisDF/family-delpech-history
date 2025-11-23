<script lang="ts">
	let {
		imageUrl = '',
		imageAlt = '',
		caption = '',
		imageSize = 'full',
		alignment = 'center',
		roundedCorners = true,
		connectTop = false,
		connectBottom = false
	} = $props();

	const sizeClasses = {
		small: 'max-w-md',
		medium: 'max-w-2xl',
		large: 'max-w-4xl',
		full: 'max-w-6xl'
	};

	const alignmentClasses = {
		left: 'mr-auto',
		center: 'mx-auto',
		right: 'ml-auto'
	};

	const spacingTop = $derived(connectTop ? '' : 'pt-8');
	const spacingBottom = $derived(connectBottom ? '' : 'pb-8');
</script>

<section class="bg-gradient-warm px-4 {spacingTop} {spacingBottom} sm:px-6 lg:px-8">
	<div class="mx-auto max-w-6xl">
		<figure class="{sizeClasses[imageSize]} {alignmentClasses[alignment]}">
			{#if imageUrl}
				<img
					src={imageUrl}
					alt={imageAlt}
					class="h-auto w-full object-cover {roundedCorners ? 'rounded-xl' : ''} shadow-md"
				/>
			{:else}
				<div
					class="flex h-64 items-center justify-center bg-primary-100 {roundedCorners
						? 'rounded-xl'
						: ''}"
				>
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
								d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
						<p class="mt-2 text-sm text-primary-600">Ajouter une image</p>
					</div>
				</div>
			{/if}

			{#if caption}
				<figcaption class="mt-3 text-center text-sm italic text-primary-700">
					{caption}
				</figcaption>
			{/if}
		</figure>
	</div>
</section>
