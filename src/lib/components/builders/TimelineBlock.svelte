<script lang="ts">
	import Timeline from '$lib/components/Timeline.svelte';

	let {
		title = 'Un Voyage à Travers le Temps',
		description = 'Écoutez et suivez votre progression à travers les différentes périodes de notre histoire',
		sections = []
	}: {
		title?: string;
		description?: string;
		sections?: any[];
	} = $props();
</script>

<section class="bg-gradient-warm">
	<div class="px-4 py-12 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-6xl">
			<h2 class="mb-8 text-center font-serif text-4xl font-bold text-primary-900">
				{title}
			</h2>
			<p class="mb-12 text-center text-lg text-primary-700">
				{description}
			</p>
		</div>
	</div>
	<Timeline {sections} />
</section>
