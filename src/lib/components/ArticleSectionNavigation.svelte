<script lang="ts">
	import { browser } from '$app/environment';
	import type { ArticleSectionNavigationConfig } from '$lib/types/article-section-navigation';

	let { config }: { config: ArticleSectionNavigationConfig } = $props();

	let isMobileOpen = $state(false);
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
	const activeIndex = $derived(
		Math.max(
			0,
			renderedSections.findIndex((section) => section.id === activeId)
		)
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
		isMobileOpen = false;
	}
</script>

{#if hasRenderedSections}
	<div class="pointer-events-auto h-full">
		<aside class="hidden lg:sticky lg:top-24 lg:block lg:w-52">
		<div class="border-l-2 border-primary-200 pl-5">
			{#if config.title}
				<h2 class="font-serif text-xl font-semibold text-primary-900">{config.title}</h2>
			{/if}
			{#if config.description}
				<p class="mt-2 text-sm leading-relaxed text-primary-700">{config.description}</p>
			{/if}

			<nav aria-label={config.title || 'Sections de l’article'} class="mt-6">
				<ol class="space-y-4">
					{#each renderedSections as section, index (section.id)}
						<li>
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
								<span>
									<span class="block font-medium">{section.title}</span>
									{#if section.description}
										<span class="mt-1 block text-xs leading-relaxed text-primary-600">
											{section.description}
										</span>
									{/if}
								</span>
							</a>
						</li>
					{/each}
				</ol>
			</nav>
		</div>
	</aside>

	<div class="lg:hidden">
		<button
			type="button"
			aria-expanded={isMobileOpen}
			aria-controls="article-section-navigation-list"
			onclick={() => (isMobileOpen = !isMobileOpen)}
			class="flex w-full items-center justify-between rounded-lg border border-primary-200 bg-white px-4 py-3 text-left shadow-sm"
		>
			<span class="flex items-center gap-3">
				<span class="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
					{activeIndex + 1}
				</span>
				<span class="font-medium text-primary-900">Dans cet article</span>
			</span>
			<svg
				class={`h-5 w-5 text-primary-600 transition-transform ${isMobileOpen ? 'rotate-180' : ''}`}
				viewBox="0 0 20 20"
				fill="currentColor"
				aria-hidden="true"
			>
				<path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
			</svg>
		</button>

		{#if isMobileOpen}
			<nav
				id="article-section-navigation-list"
				aria-label={config.title || 'Sections de l’article'}
				class="mt-2 rounded-lg border border-primary-200 bg-white p-2 shadow-sm"
			>
				<ol>
					{#each renderedSections as section, index (section.id)}
						<li>
							<a
								href={`#${section.id}`}
								onclick={() => selectSection(section.id)}
								class={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
									activeId === section.id
										? 'bg-accent/10 font-semibold text-accent'
										: 'text-primary-800 hover:bg-primary-50'
								}`}
							>
								<span class="w-5 text-center text-xs font-semibold text-primary-600">{index + 1}</span>
								<span>{section.title}</span>
							</a>
						</li>
					{/each}
				</ol>
			</nav>
		{/if}
	</div>
</div>
{/if}
