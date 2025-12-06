<script lang="ts">
	import { Content } from '@builder.io/sdk-svelte';
	import { PUBLIC_BUILDER_API_KEY } from '$env/static/public';
	import { builderComponents } from '$lib/components/builders';
	import type { PageData } from './$types';
	import ArticleCarouselBlock from '$lib/components/builders/ArticleCarouselBlock.svelte';
	import ArticleHeaderBlock from '$lib/components/builders/ArticleHeaderBlock.svelte';
	import PageNotFound from '$lib/components/PageNotFound.svelte';
	import CTABlock from '$lib/components/builders/CTABlock.svelte';
	import PDFModal from '$lib/components/PDFModal.svelte';

	let { data } = $props<{ data: PageData }>();

	const post = data.post;
	let isPDFModalOpen = $state(false);
	let pdfModalUrl = $state('');
	let pdfModalTitle = $state('');

	function openPDFModal(url: string, title: string) {
		pdfModalUrl = url;
		pdfModalTitle = title;
		isPDFModalOpen = true;
	}

	const pageTitle = post?.data?.title
		? `${post.data.title} - Histoire de Famille`
		: 'Histoire de Famille';
	const pageDescription =
		post?.data?.excerpt ||
		'Découvrez les histoires et les secrets de notre famille à travers 50 livres d\'histoire familiale du XIXe siècle.';
</script>


<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={pageDescription} />
</svelte:head>

{#if post}
	<ArticleHeaderBlock
		title={post.data?.title || ''}
		excerpt={post.data?.excerpt || ''}
		date={post.data?.date || ''}
		readTime={post.data?.readTime || ''}
		category={post.data?.category || ''}
		featuredImage={post.data?.featuredImage || ''}
		author={post.data?.author || ''}
		pdfFile={post.data?.pdfFile || ''}
		onOpenPDFModal={openPDFModal}
	/>

	<Content
		model="blog-articles"
		content={post}
		apiKey={PUBLIC_BUILDER_API_KEY}
		customComponents={builderComponents}
	/>

	{#if data.relatedArticles && data.relatedArticles.length > 0}
		<ArticleCarouselBlock
			title="Articles Connexes"
			articles={data.relatedArticles}
			itemsPerSlide={3}
		/>
	{/if}
	{#if data.siteConfig }
		<CTABlock
			title={data.siteConfig.ctaBlockTitle as string}
			description={data.siteConfig.ctaBlockDescription as string}
			buttonLink={data.siteConfig.ctaBlockButtonLink as string}
			buttonText={data.siteConfig.ctaBlockButtonText as string}
		/>
	{/if}

	<PDFModal isOpen={isPDFModalOpen} pdfUrl={pdfModalUrl} title={pdfModalTitle} />
{:else}
	<PageNotFound
		title="Histoire non trouvée"
		message="L'histoire que vous recherchez n'existe pas ou a été supprimée."
		ctaText="Retour aux histoires"
		ctaHref="/histoires"
	/>
{/if}
