<script lang="ts">
	import { browser } from '$app/env';
	import type { ArticleSectionNavigationConfig } from '#lib/types/article-section-navigation.js';

	let { config }: { config: ArticleSectionNavigationConfig } = $props();

	let activeId = $state('');
	let availableIds = $state<Set<string> | null>(null);

	$effect(() => {
		if (!activeId) activeId = config.sections[0]?.id ?? '';
	});

	const renderedSections = $derived(
		availableIds === null
			? config.sections
			: config.sections.filter((section) => availableIds?.has(section.id) ?? false)
	);
	const hasRenderedSections = $derived(renderedSections.length > 0);

	$effect(() => {
		if (!browser) return;

		const updateAvailableSections = () => {
			const nextIds = new Set<string>(
				config.sections
					.filter((section) => document.getElementById(section.id))
					.map((section) => section.id)
			);
			availableIds = nextIds;

			if (!nextIds.has(activeId)) {
				activeId = config.sections.find((section) => nextIds.has(section.id))?.id ?? '';
			}
		};

		updateAvailableSections();
		const mutationObserver = new MutationObserver(updateAvailableSections);
		mutationObserver.observe(document.body, { childList: true, subtree: true });

		return () => mutationObserver.disconnect();
	});

	$effect(() => {
		if (!browser || !availableIds || availableIds.size === 0) return;

		const visibleSections = new Map<string, number>();
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						visibleSections.set(entry.target.id, entry.intersectionRatio);
					} else {
						visibleSections.delete(entry.target.id);
					}
				}

				const mostVisible = [...visibleSections.entries()].sort((a, b) => b[1] - a[1])[0];
				if (mostVisible) activeId = mostVisible[0];
			},
			{
				rootMargin: '-20% 0px -65% 0px',
				threshold: [0, 0.25, 0.5, 0.75, 1]
			}
		);

		for (const id of availableIds) {
			const section = document.getElementById(id);
			if (section) observer.observe(section);
		}

		return () => observer.disconnect();
	});

	function selectSection(id: string) {
		if (availableIds && !availableIds.has(id)) return;
		activeId = id;
	}
</script>

{#if hasRenderedSections}
	<div class="pointer-events-auto h-full">
		<aside
			class="sticky top-0 z-20 w-full bg-primary-50/95 backdrop-blur lg:top-24 lg:w-52 lg:bg-transparent lg:backdrop-blur-none"
		>
			<div
				class="border-b border-primary-200 px-4 py-3 lg:border-l-2 lg:border-b-0 lg:py-0 lg:pl-5 lg:pr-0"
			>
				{#if config.title}
					<h2 class="hidden font-serif text-xl font-semibold text-primary-900 lg:block">
						{config.title}
					</h2>
				{/if}

				<nav
					aria-label={config.title || 'Sections de l’article'}
					class="mt-0 overflow-x-auto lg:mt-6 lg:overflow-visible"
				>
					<ol class="flex w-max gap-3 lg:block lg:w-auto lg:space-y-4">
						{#each renderedSections as section, index (section.id)}
							<li class="shrink-0">
								<a
									href={`#${section.id}`}
									onclick={() => selectSection(section.id)}
									aria-current={activeId === section.id ? 'location' : undefined}
									class={`group flex gap-3 text-left ${
										activeId === section.id ? 'text-accent' : 'text-primary-700 hover:text-accent'
									}`}
								>
									<span
										class={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
											activeId === section.id
												? 'bg-accent text-white'
												: 'bg-primary-100 text-primary-700 group-hover:bg-accent/15 group-hover:text-accent'
										}`}
									>
										{index + 1}
									</span>
									<span class="sr-only lg:not-sr-only lg:block lg:font-medium">{section.title}</span
									>
								</a>
							</li>
						{/each}
					</ol>
				</nav>
			</div>
		</aside>
	</div>
{/if}
