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

	interface Block {
		'@type'?: string;
		component?: {
			name: string;
			options: Record<string, unknown>;
		};
		id?: string;
	}

	let { data } = $props<{ data: PageData }>();

	const componentMap: Record<string, any> = {
		BlogGridBlock
	};

	const defaultBlogPosts: BlogPost[] = [
		{
			id: '1',
			title: 'Le Grand Voyage de 1852 : De France en Angleterre',
			excerpt:
				'Découvrez le récit fascinant du voyage qui a changé le cours de notre histoire familiale.',
			date: '1852',
			readTime: '8 min',
			category: 'Voyages'
		},
		{
			id: '2',
			title: 'Le Dîner Avec le Roi : Une Soirée Mémorable',
			excerpt:
				'Une nuit inoubliable à la cour royale qui a marqué le prestige de notre famille à jamais.',
			date: '1875',
			readTime: '6 min',
			category: 'Événements'
		},
		{
			id: '3',
			title: 'Les Secrets des Archives Familiales',
			excerpt:
				'Explorez les documents et lettres cachés qui révèlent les mystères de notre passé.',
			date: '1890',
			readTime: '10 min',
			category: 'Archives'
		}
	];

	const blogPosts: BlogPost[] = (data.blogPosts && data.blogPosts.length > 0 ? data.blogPosts : defaultBlogPosts) as BlogPost[];

	let blocks: Block[] = [];

	// Parse blocks from blog section
	if (data.blogSection?.data) {
		const pageData = data.blogSection.data as Record<string, unknown>;
		const rawBlocks = pageData.blocks || pageData.blocksString;

		if (typeof rawBlocks === 'string') {
			try {
				blocks = JSON.parse(rawBlocks) as Block[];
			} catch (e) {
				console.error('Failed to parse blocks:', e);
				blocks = [];
			}
		} else if (Array.isArray(rawBlocks)) {
			blocks = rawBlocks as Block[];
		}
	}

	// If no blocks from Builder, render default grid
	const shouldUseBuilderContent = blocks && blocks.length > 0;
</script>

<div class="bg-gradient-warm">
	{#if shouldUseBuilderContent}
		<!-- Render blocks from Builder -->
		<div class="relative">
			{#each blocks as block (block.id || block.component?.name || Math.random())}
				{@const Component = block.component?.name ? componentMap[block.component.name] : null}
				{@const options = block.component?.options || {}}

				{#if Component}
					<svelte:component this={Component} {...options} posts={blogPosts} />
				{/if}
			{/each}
		</div>
	{:else}
		<!-- Default fallback: render basic blog grid -->
		<BlogGridBlock
			title="Histoires de Famille"
			description="Plongez dans les récits fascinants de nos ancêtres et découvrez les moments qui ont façonné notre histoire."
			posts={blogPosts}
		/>
	{/if}
</div>
