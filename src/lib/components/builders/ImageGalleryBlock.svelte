<script lang="ts">
	import FlipCard from '../FlipCard.svelte';

	let {
		title = '',
		images = [],
		columns = 3,
		connectTop = false,
		connectBottom = false
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
	} = $props();

	const spacingTop = $derived(connectTop ? '' : 'pt-12');
	const spacingBottom = $derived(connectBottom ? '' : 'pb-12');
</script>

<section class=" px-4 {spacingTop} {spacingBottom} sm:px-6 lg:px-8">
	<div class="mx-auto max-w-6xl">
		{#if title}
			<h2 class="mb-8 text-center font-serif text-3xl font-bold text-primary-900">
				{title}
			</h2>
		{/if}

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
	</div>
</section>
