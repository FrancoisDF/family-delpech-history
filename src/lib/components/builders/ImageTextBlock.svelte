<script lang="ts">
	let {
		image = '',
		imageAlt = '',
		title = '',
		content = '',
		imagePosition = 'left',
		imageWidth = 'w-1/2',
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

<section class="bg-gradient-warm px-4 {spacingTop} {spacingBottom} sm:px-6 lg:px-8">
	<div class="mx-auto max-w-6xl">
		<div class="{roundedClasses} {shadowClasses} bg-white p-8 md:p-12">
			<div
				class="flex flex-col {imagePosition === 'right'
					? 'md:flex-row-reverse'
					: 'md:flex-row'} items-center gap-8"
			>
				{#if image}
					<div class="flex-shrink-0 {imageWidth}">
						<img
							src={image}
							alt={imageAlt}
							class="h-auto w-full rounded-lg object-cover shadow-md"
						/>
					</div>
				{/if}

				<div class="flex-1">
					{#if title}
						<h3 class="mb-4 font-serif text-2xl font-bold text-primary-900 md:text-3xl">
							{title}
						</h3>
					{/if}
					{#if content}
						<div class="prose prose-lg max-w-none">
							<div class="leading-relaxed text-primary-700">
								{@html content}
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</section>
