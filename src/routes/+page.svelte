<script lang="ts">
	import HeroBlock from '$lib/components/builders/HeroBlock.svelte';
	import TimelineBlock from '$lib/components/builders/TimelineBlock.svelte';
	import CTABlock from '$lib/components/builders/CTABlock.svelte';
	import FeaturesBlock from '$lib/components/builders/FeaturesBlock.svelte';
	
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	interface Block {
		'@type'?: string;
		component?: {
			name: string;
			options: Record<string, unknown>;
		};
		id?: string;
	}

	const componentMap: Record<string, any> = {
		HeroBlock,
		TimelineBlock,
		CTABlock,
		FeaturesBlock
	};

	const defaultBlocks: Block[] = [
		{
			'@type': '@builder.io/sdk:Element',
			component: {
				name: 'HeroBlock',
				options: {
					title: 'Histoire de Famille',
					description: 'Découvrez les histoires fascinantes de notre famille à travers deux siècles d\'histoire. Des souvenirs préservés, des voix enregistrées, et des secrets révélés.',
					primaryButtonText: 'Lire les Histoires',
					primaryButtonLink: '/histoires',
					secondaryButtonText: 'Poser une Question',
					secondaryButtonLink: '/chat',
					backgroundImage: 'https://upload.wikimedia.org/wikipedia/commons/a/a1/Ex_libris_Delpech_de_Frayssinet.jpg'
				}
			}
		},
		{
			'@type': '@builder.io/sdk:Element',
			component: {
				name: 'TimelineBlock',
				options: {
					title: 'Un Voyage à Travers le Temps',
					description: 'Écoutez et suivez votre progression à travers les différentes périodes de notre histoire'
				}
			}
		},
		{
			'@type': '@builder.io/sdk:Element',
			component: {
				name: 'CTABlock',
				options: {
					title: 'Vous Avez des Questions ?',
					description: 'Explorez nos archives complètes grâce à notre assistant IA. Posez toutes vos questions sur l\'histoire de notre famille.',
					buttonText: 'Accéder à l\'Assistant IA',
					buttonLink: '/chat'
				}
			}
		},
		{
			'@type': '@builder.io/sdk:Element',
			component: {
				name: 'FeaturesBlock',
				options: {
					title: 'Faits Intéressants',
					features: [
						{
							number: '50',
							title: 'Livres Historiques',
							description: 'Explorez 50 livres d\'histoire familiale du XIXe siècle'
						},
						{
							number: '100',
							title: 'Ans d\'Histoire',
							description: 'De 1800 à 1900, un siècle de souvenirs préservés'
						},
						{
							number: '∞',
							title: 'Générations',
							description: 'Une héritage transmis à travers les générations'
						}
					]
				}
			}
		}
	];

	let blocks: Block[] = defaultBlocks;

	// Parse blocks from page content
	if (data.landingPage?.data) {
		const pageData = data.landingPage.data as Record<string, unknown>;
		const rawBlocks = pageData.blocks || pageData.blocksString;
		
		if (typeof rawBlocks === 'string') {
			try {
				blocks = JSON.parse(rawBlocks) as Block[];
			} catch (e) {
				console.error('Failed to parse blocks:', e);
				blocks = defaultBlocks;
			}
		} else if (Array.isArray(rawBlocks)) {
			blocks = rawBlocks as Block[];
		}
	}
</script>

<div class="relative">
	{#each blocks as block (block.id || block.component?.name || Math.random())}
		{@const Component = block.component?.name ? componentMap[block.component.name] : null}
		{@const options = block.component?.options || {}}
		
		{#if Component}
			<svelte:component this={Component} {...options} sections={data.storySections || []} />
		{/if}
	{/each}

	<!-- Fallback: if no blocks from Builder, render default structure -->
	{#if blocks.length === 0}
		<div class="relative">
			<!-- Parallax Background -->
			<div
				class="parallax-bg absolute inset-0"
				style="background-image: url('https://upload.wikimedia.org/wikipedia/commons/a/a1/Ex_libris_Delpech_de_Frayssinet.jpg');"
			></div>

			<!-- Soft Overlay for Text Readability -->
			<div class="absolute inset-0 bg-black/25"></div>

			<!-- Content Container -->
			<div class="relative z-10">
				<!-- Hero Section -->
				<section class="relative overflow-hidden flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
					<div class="mx-auto max-w-4xl text-center">
						<h1 class="mb-6 font-serif text-5xl font-medium tracking-tight text-white md:text-6xl lg:text-7xl">
							Histoire de Famille
						</h1>
						<p class="mb-8 text-xl leading-relaxed text-white/80 md:text-2xl lg:text-3xl">
							Découvrez les histoires fascinantes de notre famille à travers deux siècles d'histoire.
							Des souvenirs préservés, des voix enregistrées, et des secrets révélés.
						</p>
						<div class="flex flex-col sm:flex-row justify-center gap-4">
							<a
								href="/histoires"
								class="inline-block rounded-lg bg-primary-700 px-8 py-3 font-semibold text-white transition-colors hover:bg-primary-800"
							>
								Lire les Histoires
							</a>
							<a
								href="/chat"
								class="inline-block rounded-lg border-2 border-white px-8 py-3 font-semibold text-white transition-colors hover:bg-white hover:text-primary-800"
							>
								Poser une Question
							</a>
						</div>
					</div>
				</section>

				<!-- Storytelling Sections - Timeline -->
				<section class="bg-gradient-warm">
					<div class="px-4 py-12 sm:px-6 lg:px-8">
						<div class="mx-auto max-w-5xl">
							<h2 class="mb-8 text-center font-serif text-4xl font-bold text-primary-900">
								Un Voyage à Travers le Temps
							</h2>
							<p class="mb-12 text-center text-lg text-primary-700">
								Écoutez et suivez votre progression à travers les différentes périodes de notre histoire
							</p>
						</div>
					</div>
					{#if data.storySections && data.storySections.length > 0}
						<div class="px-4 py-12 sm:px-6 lg:px-8">
							<div class="mx-auto max-w-5xl space-y-8">
								{#each data.storySections as section (section.id)}
									<div class="group relative rounded-2xl p-8 transition-all md:p-12 border-2 border-transparent bg-white shadow-lg hover:shadow-2xl">
										<div class="absolute -left-4 top-4 flex flex-col items-center gap-2 sm:-left-6 sm:top-1/2 sm:-translate-y-1/2">
											<div class="flex h-7 w-7 items-center justify-center rounded-full border-2 border-primary-300 bg-white sm:h-8 sm:w-8"></div>
											<div class="rounded-lg bg-primary-800 px-2 py-0.5 text-xs font-medium text-white sm:px-3 sm:py-1">
												{section.year}
											</div>
										</div>
										<div class="pl-10 sm:pl-12 md:pl-12">
											<h3 class="mb-4 font-serif text-3xl font-medium text-primary-800">{section.title}</h3>
											<p class="mb-8 text-lg leading-relaxed text-primary-700">{section.description}</p>
											{#if section.audioUrl}
												<div class="rounded-lg bg-primary-50 p-6">
													<div class="mb-3 flex items-center gap-2">
														<svg class="h-5 w-5 text-primary-800" fill="currentColor" viewBox="0 0 20 20">
															<path d="M9 3a6 6 0 100 12A6 6 0 009 3z" />
														</svg>
														<span class="text-sm font-medium text-primary-800">Récit Audio</span>
													</div>
													<audio class="w-full accent-primary-800" controls controlsList="nodownload">
														<source src={section.audioUrl} type="audio/mpeg" />
														Votre navigateur ne supporte pas l'élément audio.
													</audio>
												</div>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</section>

				<!-- Call to Action Section -->
				<section class="bg-primary-700 px-4 py-20 text-center sm:px-6 lg:px-8">
					<div class="mx-auto max-w-2xl">
						<h2 class="mb-6 font-serif text-3xl font-medium text-white">Vous Avez des Questions ?</h2>
						<p class="mb-8 text-lg text-white/70">
							Explorez nos archives complètes grâce à notre assistant IA. Posez toutes vos questions sur
							l'histoire de notre famille.
						</p>
						<a
							href="/chat"
							class="inline-block rounded-lg bg-accent px-8 py-4 font-semibold text-white transition-all hover:scale-105 hover:shadow-lg"
						>
							Accéder à l'Assistant IA
						</a>
					</div>
				</section>

				<!-- Interesting Facts Section -->
				<section class="px-4 py-20 sm:px-6 lg:px-8 bg-gradient-warm">
					<div class="mx-auto max-w-5xl">
						<h2 class="mb-12 text-center font-serif text-3xl font-medium text-primary-800">
							Faits Intéressants
						</h2>
						<div class="grid gap-8 md:grid-cols-3">
							<div class="rounded-xl bg-white p-8 text-center shadow-sm">
								<div class="mb-4 text-4xl font-bold text-accent">50</div>
								<h3 class="mb-2 font-serif font-medium text-primary-800">Livres Historiques</h3>
								<p class="text-primary-600">Explorez 50 livres d'histoire familiale du XIXe siècle</p>
							</div>
							<div class="rounded-xl bg-white p-8 text-center shadow-sm">
								<div class="mb-4 text-4xl font-bold text-accent">100</div>
								<h3 class="mb-2 font-serif font-medium text-primary-800">Ans d'Histoire</h3>
								<p class="text-primary-600">De 1800 à 1900, un siècle de souvenirs préservés</p>
							</div>
							<div class="rounded-xl bg-white p-8 text-center shadow-sm">
								<div class="mb-4 text-4xl font-bold text-accent">∞</div>
								<h3 class="mb-2 font-serif font-medium text-primary-800">Générations</h3>
								<p class="text-primary-600">Une héritage transmis à travers les générations</p>
							</div>
						</div>
					</div>
				</section>
			</div>
		</div>
	{/if}
</div>
