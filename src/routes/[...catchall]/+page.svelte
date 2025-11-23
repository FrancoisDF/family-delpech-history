<script lang="ts">
	import { Content } from '@builder.io/sdk-svelte';
	import { PUBLIC_BUILDER_API_KEY } from '$env/static/public';
	import { builderComponents } from '$lib/components/builders';
	import PageNotFound from '$lib/components/PageNotFound.svelte';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const pageTitle = data?.pageContent?.data?.title || 'Histoire de Famille';
	const pageDescription =
		data?.pageContent?.data?.description ||
		'Découvrez les histoires et les secrets de notre famille à travers 50 livres d\'histoire familiale du XIXe siècle.';
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={pageDescription} />
</svelte:head>

{#if !data?.pageContent}
	<PageNotFound />
{:else}
	<Content
		model="page"
		content={data.pageContent}
		data={{ sections: data.storySections, articles: data.blogArticles }}
		apiKey={PUBLIC_BUILDER_API_KEY}
		customComponents={builderComponents}
	/>
{/if}
