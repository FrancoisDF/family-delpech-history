<script lang="ts">
	let {
		title = 'Histoire de Famille',
		description = 'Default description',
		primaryButtonText = 'Primary Button',
		primaryButtonLink = '/',
		secondaryButtonText = 'Secondary Button',
		secondaryButtonLink = '/',
		backgroundImage = ''
	} = $props();
</script>

<section
	class="relative flex min-h-screen items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8"
>
	{#if backgroundImage}
		<div
			class="absolute inset-0"
			style="background-image: url('{backgroundImage}'); background-size: cover; background-position: center;"
		></div>
	{/if}

	<div class="absolute inset-0 bg-black/25"></div>

	<div class="relative z-10 mx-auto max-w-4xl text-center">
		<h1
			class="mb-6 font-serif text-5xl font-medium tracking-tight text-white md:text-6xl lg:text-7xl"
		>
			{title}
		</h1>
		<p class="mb-8 text-xl leading-relaxed text-white/80 md:text-2xl lg:text-3xl">
			{description}
		</p>
		<div class="flex flex-col justify-center gap-4 sm:flex-row">
			<a
				href={primaryButtonLink}
				class="inline-block rounded-lg bg-primary-700 px-8 py-3 font-semibold text-white transition-colors hover:bg-primary-800"
			>
				{primaryButtonText}
			</a>
			<a
				href={secondaryButtonLink}
				class="inline-block rounded-lg border-2 border-white px-8 py-3 font-semibold text-white transition-colors hover:bg-white hover:text-primary-800"
			>
				{secondaryButtonText}
			</a>
		</div>
	</div>
</section>
