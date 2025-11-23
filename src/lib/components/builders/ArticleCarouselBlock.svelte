<script lang="ts">
	import ArticleCarousel from '../ArticleCarousel.svelte';

	interface Article {
		id: string;
		title: string;
		excerpt: string;
		date: string;
		readTime: string;
		featuredImage?: string;
		category?: string;
	}

	let {
		title = 'Articles Connexes',
		articles = [],
		itemsPerSlide = 3
	}: {
		title?: string;
		articles?: Article[];
		itemsPerSlide?: number;
	} = $props();
</script>

<ArticleCarousel {title} {articles} {itemsPerSlide} />
