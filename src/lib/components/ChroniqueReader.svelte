<script lang="ts">
	import { Content } from '@builder.io/sdk-svelte';
	import { PUBLIC_BUILDER_API_KEY } from '$env/static/public';
	import { builderComponents } from '$lib/components/builders';
	import ArticleHeaderBlock from '$lib/components/builders/ArticleHeaderBlock.svelte';
	import ArticleSectionNavigation from '$lib/components/ArticleSectionNavigation.svelte';
	import { normalizeArticleSectionNavigation } from '$lib/types/article-section-navigation';
	import type { ArticleSectionNavigationConfig } from '$lib/types/article-section-navigation';
	import type { BuilderContent, ResolvedChronique } from '$lib/server/builder';

	let { chronique }: { chronique: ResolvedChronique } = $props();

	function toAnchorId(value: string): string {
		return value
			.normalize('NFKD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-zA-Z0-9_-]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.toLowerCase();
	}

	function scopeBuilderContent(content: BuilderContent | undefined, prefix: string): BuilderContent | undefined {
		if (!content) return undefined;
		const data = content.data || {};
		const blocks = Array.isArray(data.blocks)
			? data.blocks.map((block) => {
					if (!block || typeof block !== 'object') return block;
					const rawBlock = block as Record<string, unknown>;
					const blockData =
						rawBlock.data && typeof rawBlock.data === 'object'
							? (rawBlock.data as Record<string, unknown>)
							: null;
					if (!blockData || typeof blockData.anchorId !== 'string' || !blockData.anchorId.trim()) {
						return block;
					}
					return {
						...rawBlock,
						data: { ...blockData, anchorId: `${prefix}-${toAnchorId(blockData.anchorId)}` }
					};
				})
			: data.blocks;

		return { ...content, data: { ...data, blocks } };
	}

	let introContent = $derived<BuilderContent>({
		id: `${chronique.id}-introduction`,
		data: { blocks: chronique.introBlocks }
	});
	let introNavigation = $derived(normalizeArticleSectionNavigation(chronique.sectionNavigation));
	let navigation = $derived.by((): ArticleSectionNavigationConfig => ({
		enabled: true,
		title: introNavigation?.title || 'Dans cette chronique',
		description: introNavigation?.description,
		sections: [
			{ id: `${toAnchorId(chronique.id)}-introduction`, title: 'Introduction' },
			...chronique.articles.map((article, index) => ({
				id: `${toAnchorId(chronique.id)}-article-${index + 1}`,
				title:
					chronique.referencedArticles[index]?.label || article.title || `Article ${index + 1}`,
				description: article.excerpt
			}))
		]
	}));

	let articleEntries = $derived(
		chronique.articles.map((article, index) => ({
			article,
			content: scopeBuilderContent(article.builderContent, `${toAnchorId(chronique.id)}-article-${index + 1}`),
			sectionId: `${toAnchorId(chronique.id)}-article-${index + 1}`
		}))
	);
</script>

<div class="bg-primary-50/30">
	<div class="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
		<a
			href="/histoires"
			class="inline-flex items-center gap-2 text-primary-900 transition-colors hover:text-accent"
		>
			<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
				<path d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 111.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" />
			</svg>
			Retour aux histoires
		</a>
	</div>

	<div class="mx-auto max-w-4xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
		<div class="mb-8 flex flex-wrap items-center gap-3">
			<span class="rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
				Chronique
			</span>
			{#if chronique.date}
				<span class="text-sm font-medium text-primary-600">{chronique.date}</span>
			{/if}
		</div>
		<h1 class="font-serif text-4xl font-bold text-primary-900 md:text-5xl">{chronique.title}</h1>
		{#if chronique.excerpt}
			<p class="mt-6 text-xl italic leading-relaxed text-primary-700">{chronique.excerpt}</p>
		{/if}
	</div>

	<div class="article-content-shell relative">
		<div class="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:absolute lg:inset-0 lg:px-8 lg:pb-0 lg:pointer-events-none">
			<ArticleSectionNavigation config={navigation} />
		</div>

		<section id={`${toAnchorId(chronique.id)}-introduction`} class="scroll-mt-28">
			<Content
				model="chronique"
				content={introContent}
				apiKey={PUBLIC_BUILDER_API_KEY}
				customComponents={builderComponents}
			/>
		</section>

		{#each articleEntries as entry, index (entry.sectionId)}
			<section id={entry.sectionId} class="scroll-mt-28 border-t border-primary-200 pt-12">
				<div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
					<div class="mb-5 flex items-center gap-3">
						<span class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-800 text-sm font-semibold text-white">
							{index + 1}
						</span>
						<span class="text-sm font-semibold uppercase tracking-widest text-primary-600">Article de la chronique</span>
					</div>
				</div>
				<ArticleHeaderBlock
					title={entry.article.title}
					excerpt={entry.article.excerpt || ''}
					date={entry.article.date || ''}
					readTime={entry.article.readTime || ''}
					category={entry.article.category || ''}
					featuredImage={entry.article.featuredImage || ''}
					featuredImageDisplayMode={entry.article.featuredImageDisplayMode || 'cover'}
					author={entry.article.author || ''}
					pdfFile=""
					onOpenPDFModal={() => {}}
				/>
				{#if entry.content}
					<Content
						model="blog-articles"
						content={entry.content}
						apiKey={PUBLIC_BUILDER_API_KEY}
						customComponents={builderComponents}
					/>
				{/if}
			</section>
		{/each}
	</div>
</div>
