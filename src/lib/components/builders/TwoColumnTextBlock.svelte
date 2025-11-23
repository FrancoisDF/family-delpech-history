<script lang="ts">
	let {
		leftContent = '',
		rightContent = '',
		title = '',
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
		{#if title}
			<h2 class="mb-8 text-center font-serif text-3xl font-bold text-primary-900">
				{title}
			</h2>
		{/if}

		<div class="{roundedClasses} {shadowClasses} grid gap-8 bg-white p-8 md:grid-cols-2 md:p-12">
			<div class="prose prose-lg max-w-none">
				<p class="whitespace-pre-wrap leading-relaxed text-primary-900">
					{leftContent}
				</p>
			</div>

			<div
				class="prose prose-lg max-w-none border-t pt-8 md:border-l md:border-t-0 md:pl-8 md:pt-0"
			>
				<p class="whitespace-pre-wrap leading-relaxed text-primary-900">
					{rightContent}
				</p>
			</div>
		</div>
	</div>
</section>
