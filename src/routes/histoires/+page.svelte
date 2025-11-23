<script lang="ts">
	import BlogGridBlock from '$lib/components/builders/BlogGridBlock.svelte';
	import type { PageData } from './$types';

	interface BlogPost {
		id: string;
		title: string;
		excerpt: string;
		date: string;
		readTime: string;
		featuredImage?: string;
		category?: string;
		slug?: string;
		content?: string;
		author?: string;
	}

	let { data } = $props<{ data: PageData }>();

	// If no blocks from Builder, render default grid
</script>

<div class="bg-gradient-warm">
	<!-- Default fallback: render basic blog grid -->
	<BlogGridBlock
		title="Histoires de Famille"
		description="Plongez dans les récits fascinants de nos ancêtres et découvrez les moments qui ont façonné notre histoire."
		posts={data.blogPosts}
	/>
</div>
