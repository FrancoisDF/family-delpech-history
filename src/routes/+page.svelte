<script lang="ts">
	import { Content } from '@builder.io/sdk-svelte';
	import { PUBLIC_BUILDER_API_KEY } from '$env/static/public';
	import { builderComponents } from '$lib/components/builders';
	import PageNotFound from '$lib/components/PageNotFound.svelte';

	import type { PageData } from './$types';
	import CTABlock from '$lib/components/builders/CTABlock.svelte';

	let { data }: { data: PageData } = $props();
	const pageTitle = data?.pageContent?.data?.title || '';
	const pageDescription =
		data?.pageContent?.data?.description || '';
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

	{#if data.siteConfig }
		<CTABlock
			title={data.siteConfig.ctaBlockTitle as string}
			description={data.siteConfig.ctaBlockDescription as string}
			buttonLink={data.siteConfig.ctaBlockButtonLink as string}
			buttonText={data.siteConfig.ctaBlockButtonText as string}
		/>
	{/if}
{/if}
