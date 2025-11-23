<script lang="ts">
	let {
		title = '',
		content = '',
		image = '',
		imageAlt = '',
		imagePosition = 'none',
		backgroundColor = 'bg-white',
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

	const shadowClasses = $derived(connectTop || connectBottom ? '' : 'shadow-lg');
</script>

<section class="bg-gradient-warm px-4 {spacingTop} {spacingBottom} sm:px-6 lg:px-8">
	<div class="mx-auto max-w-4xl">
		<div class="{roundedClasses} {shadowClasses} {backgroundColor} p-8 md:p-12">
			{#if title}
				<h2 class="mb-6 font-serif text-3xl font-bold text-primary-900">
					{title}
				</h2>
			{/if}

			{#if imagePosition === 'top' && image}
				<figure class="mb-6">
					<img src={image} alt={imageAlt} class="h-auto w-full rounded-lg object-cover" />
					{#if imageAlt}
						<figcaption class="mt-2 text-center text-sm italic text-primary-700">
							{imageAlt}
						</figcaption>
					{/if}
				</figure>
			{/if}

			{#if imagePosition === 'left' && image}
				<div class="mb-6 flex flex-col gap-6 md:flex-row">
					<figure class="md:w-1/2">
						<img src={image} alt={imageAlt} class="h-auto w-full rounded-lg object-cover" />
						{#if imageAlt}
							<figcaption class="mt-2 text-sm italic text-primary-700">
								{imageAlt}
							</figcaption>
						{/if}
					</figure>
					<div class="prose prose-lg max-w-none md:w-1/2">
						<div class="leading-relaxed text-primary-900">
							{@html content}
						</div>
					</div>
				</div>
			{:else if imagePosition === 'right' && image}
				<div class="mb-6 flex flex-col gap-6 md:flex-row-reverse">
					<figure class="md:w-1/2">
						<img src={image} alt={imageAlt} class="h-auto w-full rounded-lg object-cover" />
						{#if imageAlt}
							<figcaption class="mt-2 text-sm italic text-primary-700">
								{imageAlt}
							</figcaption>
						{/if}
					</figure>
					<div class="prose prose-lg max-w-none md:w-1/2">
						<div class="leading-relaxed text-primary-900">
							{@html content}
						</div>
					</div>
				</div>
			{:else}
				<div class="prose prose-lg max-w-none">
					<div class="leading-relaxed text-primary-900">
						{@html content}
					</div>
				</div>
			{/if}

			{#if imagePosition === 'bottom' && image}
				<figure class="mt-6">
					<img src={image} alt={imageAlt} class="h-auto w-full rounded-lg object-cover" />
					{#if imageAlt}
						<figcaption class="mt-2 text-center text-sm italic text-primary-700">
							{imageAlt}
						</figcaption>
					{/if}
				</figure>
			{/if}
		</div>
	</div>
</section>
