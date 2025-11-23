<script lang="ts">
	import { Content } from '@builder.io/sdk-svelte';
	import { PUBLIC_BUILDER_API_KEY } from '$env/static/public';
	import { builderComponents } from '$lib/components/builders';
	import type { PageData } from './$types';
	import ArticleCarouselBlock from '$lib/components/builders/ArticleCarouselBlock.svelte';
	import ArticleHeaderBlock from '$lib/components/builders/ArticleHeaderBlock.svelte';
	import CTABlock from '$lib/components/builders/CTABlock.svelte';

	let { data } = $props<{ data: PageData }>();

	const post = data.post;
</script>

{#if post}
	<ArticleHeaderBlock
		title={post.data?.title || ''}
		excerpt={post.data?.excerpt || ''}
		date={post.data?.date || ''}
		readTime={post.data?.readTime || ''}
		category={post.data?.category || ''}
		featuredImage={post.data?.featuredImage || ''}
		author={post.data?.author || ''}
	/>

	<Content model="blog-articles" content={post} apiKey={PUBLIC_BUILDER_API_KEY} customComponents={builderComponents} />

	{#if data.relatedArticles && data.relatedArticles.length > 0}
		<ArticleCarouselBlock
			title="Articles Connexes"
			articles={data.relatedArticles}
			itemsPerSlide={3}
		/>
	{/if}
{:else}
	<section class="min-h-screen bg-gradient-warm px-4 py-16 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-4xl">
			<article class="rounded-xl bg-white p-8 shadow-lg md:p-12">
				<div class="text-center">
					<h1 class="mb-4 font-serif text-4xl font-bold text-primary-900">Histoire non trouvée</h1>
					<p class="mb-8 text-lg text-primary-700">
						L'histoire que vous recherchez n'existe pas ou a été supprimée.
					</p>
					<a
						href="/histoires"
						class="inline-block rounded-lg bg-primary-900 px-6 py-2 font-semibold text-cream transition-colors hover:bg-primary-800"
					>
						Retour aux histoires
					</a>
				</div>
			</article>
		</div>
	</section>
{/if}
<CTABlock></CTABlock>