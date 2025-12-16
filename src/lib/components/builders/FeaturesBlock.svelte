<script lang="ts">
	let {
		title = 'Faits Intéressants',
		features = []
	}: {
		title?: string;
		features?: Array<{ number: string; title: string; description: string }>;
	} = $props();
</script>

<section class=" px-4 py-20 sm:px-6 lg:px-8">
	<div class="mx-auto max-w-6xl">
		<h2 class="mb-12 text-center font-serif text-3xl font-medium text-primary-800">
			{title}
		</h2>
		<div class="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
			{#each features as feature, index (`${feature.title}-${index}`)}
				<div class="rounded-xl bg-white p-8 text-center shadow-sm">
					<div class="mb-4 text-4xl font-bold text-accent">{feature.number}</div>
					<h3 class="mb-2 font-serif font-medium text-primary-800">{feature.title}</h3>
					<p class="text-primary-600">{feature.description}</p>
				</div>
			{/each}
		</div>
	</div>
</section>
