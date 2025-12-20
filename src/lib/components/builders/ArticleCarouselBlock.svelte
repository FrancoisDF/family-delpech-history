<script lang="ts">
	import { extractTagsId } from '$lib/url-utils';
	import { fetchArticlesByTags } from '../article.remote';
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
		tags = [],
		itemsPerSlide = 3,
	}: {
		title?: string;
		tags?: any[];
		itemsPerSlide?: number;
	} = $props();

	const tagsID = extractTagsId(tags || []);

	const relatedArticlesAll = await fetchArticlesByTags(tagsID);

</script>

<ArticleCarousel {title} articles={relatedArticlesAll} {itemsPerSlide} />
