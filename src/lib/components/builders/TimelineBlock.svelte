<script lang="ts">
	import Timeline from '$lib/components/Timeline.svelte';
	import { fetchSections } from '../section.remote';
	import { fetchRelatedArticles } from '../article.remote';

	let {
		title = 'Un Voyage à Travers le Temps',
		description = 'Écoutez et suivez votre progression à travers les différentes périodes de notre histoire',
	}: {
		title?: string;
		description?: string;
	} = $props();

	let sections = await fetchSections();
	let articles = await fetchRelatedArticles();
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
	<Timeline {sections} {articles} />
</section>
