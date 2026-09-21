<script lang="ts">
	import type { PageData } from './$types';
	import ChroniqueReader from '#lib/components/ChroniqueReader.svelte';
	import PageNotFound from '#lib/components/PageNotFound.svelte';

	let { data }: { data: PageData } = $props();
	let pageTitle = $derived(
		data.chronique ? `${data.chronique.title} - Histoire de Famille` : 'Chronique introuvable'
	);
</script>

<svelte:head>
	<title>{pageTitle}</title>
	{#if data.chronique?.excerpt}
		<meta name="description" content={data.chronique.excerpt} />
	{/if}
</svelte:head>

{#if data.chronique}
	<ChroniqueReader chronique={data.chronique} />
{:else}
	<PageNotFound
		title="Chronique non trouvée"
		message="La chronique que vous recherchez n’existe pas ou a été supprimée."
		ctaText="Retour aux chroniques"
		ctaHref="/chroniques"
	/>
{/if}
