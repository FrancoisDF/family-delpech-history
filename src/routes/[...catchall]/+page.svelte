<script lang="ts">
	import { Content } from '@builder.io/sdk-svelte';
	import { PUBLIC_BUILDER_API_KEY } from '$env/static/public';
	import { builderComponents } from '$lib/components/builders';
	import PageNotFound from '$lib/components/PageNotFound.svelte';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

{#if !data?.landingPage}
	<PageNotFound />
{:else}
	<Content
		model="page"
		content={data.landingPage}
		data={{ sections: data.storySections }}
		apiKey={PUBLIC_BUILDER_API_KEY}
		customComponents={builderComponents}
	/>
{/if}
