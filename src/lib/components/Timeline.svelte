<script lang="ts">
	import { browser } from '$app/environment';
	import { getLastListenedId } from '$lib/progress';
	import StorySectionCard from './StorySectionCard.svelte';
	import { fetchSections } from './section.remote';
	import { fetchRelatedArticles } from './article.remote';

	interface BlogPost {
		id: string;
		title: string;
		excerpt?: string;
		date?: string;
		readTime?: string;
		featuredImage?: string;
		category?: string;
		slug?: string;
	}

	interface Section {
		id: string;
		title: string;
		description: string;
		audioUrl: string;
		year: number;
		tags?: string[];
		blog?: BlogPost | null;
	}

	let { sections: initialSections, articles: initialArticles, showProgression = true } = $props<{
		sections?: Section[];
		articles?: BlogPost[];
		showProgression?: boolean;
	}>();

	let sections = initialSections ?? (await fetchSections()) ?? [];
	let articles = initialArticles ?? (await fetchRelatedArticles()) ?? [];

	let timelineContainer = $state<HTMLElement>();
	let scrubberContainer = $state<HTMLElement>();
	let lastListenedId = $state<string | null>(null);
	let activeSectionId = $state<string | null>(null);
	let progressPercentage = $state(0);
	let completedCount = $state(0);

	// Get unique years sorted in descending order (newest first)
	const uniqueYears = [...new Set(sections.map((s) => s.year))].sort((a, b) => b - a);

	$effect(() => {
		lastListenedId = getLastListenedId();
		activeSectionId = lastListenedId;
		// updateProgress();

		// Scroll to last listened section if exists
		// if (lastListenedId && timelineContainer) {
		// 	setTimeout(() => {
		// 		const activeElement = document.getElementById(`section-${lastListenedId}`);
		// 		if (activeElement) {
		// 			activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
		// 		}
		// 	}, 100);
		// }

		// Listen for progress updates to sync the progress bar
		const handleProgressUpdated = () => {
			updateProgress();
			lastListenedId = getLastListenedId();
		};

		window.addEventListener('progressUpdated', handleProgressUpdated);
		window.addEventListener('sectionCompleted', handleProgressUpdated);

		return () => {
			window.removeEventListener('progressUpdated', handleProgressUpdated);
			window.removeEventListener('sectionCompleted', handleProgressUpdated);
		};
	});

	// Track visible sections with Intersection Observer
	let visibleSections = $state<Map<string, number>>(new Map());
	let updateTimeout: ReturnType<typeof setTimeout>;

	$effect(() => {
		if (!browser) return;

		const observer = new IntersectionObserver(
			(entries) => {
				// Update visibility map for all entries
				for (const entry of entries) {
					const sectionId = entry.target.id.replace('section-', '');
					if (entry.isIntersecting) {
						visibleSections.set(sectionId, entry.intersectionRatio);
					} else {
						visibleSections.delete(sectionId);
					}
				}

				// Debounce the active section update
				clearTimeout(updateTimeout);
				updateTimeout = setTimeout(() => {
					if (visibleSections.size > 0) {
						// Find the section with the highest intersection ratio
						let mostVisibleId = Array.from(visibleSections.entries()).reduce((prev, current) =>
							current[1] > prev[1] ? current : prev
						)[0];

						activeSectionId = mostVisibleId;
					}
				}, 100);
			},
			{
				root: null,
				rootMargin: '-40% 0px -40% 0px',
				threshold: [0, 0.1, 0.25, 0.5, 0.75, 1]
			}
		);

		// Observe all section elements
		const sectionElements = document.querySelectorAll('[id^="section-"]');
		sectionElements.forEach((element) => {
			observer.observe(element);
		});

		return () => {
			clearTimeout(updateTimeout);
			sectionElements.forEach((element) => {
				observer.unobserve(element);
			});
		};
	});

	function updateProgress() {
		if (!browser || sections.length === 0) {
			progressPercentage = 0;
			completedCount = 0;
			return;
		}

		// Get completed sections from localStorage
		const stored = localStorage.getItem('storyProgress');
		let count = 0;
		if (stored) {
			try {
				const progress = JSON.parse(stored);
				count = progress.completedSections.length;
			} catch {
				count = 0;
			}
		}

		completedCount = count;
		progressPercentage = (count / sections.length) * 100;
	}

	function scrollToSection(sectionId: string) {
		activeSectionId = sectionId;
		const element = document.getElementById(`section-${sectionId}`);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	}

	function scrollToYear(year: number) {
		// Find the first section with this year
		const section = sections.find((s) => s.year === year);
		if (section) {
			scrollToSection(section.id);
		}
	}

	function getActiveYear(): number | null {
		if (!activeSectionId) return null;
		const section = sections.find((s) => s.id === activeSectionId);
		return section?.year ?? null;
	}

	function continueListen() {
		if (lastListenedId) {
			scrollToSection(lastListenedId);
			// Auto-play the audio after scrolling
			setTimeout(() => {
				const audio = document.getElementById(lastListenedId || '') as HTMLAudioElement;
				if (audio && lastListenedId) {
					audio.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
					// Try to play after a short delay
					setTimeout(() => {
						audio.play().catch(() => {
							// Autoplay might be blocked by browser policy
							console.log('Autoplay was blocked. User will need to click play.');
						});
					}, 300);
				}
			}, 200);
		}
	}
</script>

<div class="relative">
	<!-- Continue Button (visible if there's progress) -->
	{#if lastListenedId}
		<div
			class="sticky top-0 z-20 bg-gradient-to-b from-primary-50 to-transparent px-4 py-6 sm:px-6 lg:px-8"
		>
			<div class="mx-auto max-w-5xl">
				<button
					onclick={continueListen}
					class="inline-flex items-center gap-3 rounded-lg bg-accent px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
				>
					<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
							clip-rule="evenodd"
						/>
					</svg>
					Continuer depuis la dernière écoute
				</button>
			</div>
		</div>
	{/if}

	<!-- Progress Bar -->
	{#if showProgression}
		<div class="sticky top-14 z-20 bg-white px-4 py-4 shadow-sm sm:px-6 lg:px-8">
			<div class="mx-auto max-w-5xl">
				<div class="mb-2 flex items-center justify-between">
					<span class="text-sm font-medium text-primary-700"
						>Progression: {Math.round(progressPercentage)}%</span
					>
					<span class="text-sm text-primary-600">{completedCount}/{sections.length}</span>
				</div>
				<div class="h-2 w-full overflow-hidden rounded-full bg-primary-100">
					<div
						class="h-full bg-gradient-to-r from-accent to-primary-700 transition-all duration-500"
						style="width: {progressPercentage}%"
					></div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Timeline Container -->
	<div bind:this={timelineContainer} class="relative px-4 py-16 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-7xl flex gap-8">
			<!-- Main Content -->
			<div class="flex-1 relative">
				<!-- Timeline Line -->
				<div
					class="absolute left-4 top-0 h-full w-0.5 bg-gradient-to-b from-transparent via-primary-200 to-transparent sm:left-6 md:left-1/2 md:-translate-x-1/2"
				></div>

				<!-- Sections -->
				<div class="space-y-12 md:space-y-20">
					{#each sections as section (section.id)}
						<div
							id={`section-${section.id}`}
							class={`transition-all duration-300 ${
								activeSectionId === section.id ? 'scroll-my-20' : ''
							}`}
						>
							<StorySectionCard
								id={section.id}
								title={section.title}
								description={section.description}
								audioUrl={section.audioUrl}
								year={section.year}
								tags={section.tags || []}
								availablePosts={articles}
								isActive={activeSectionId === section.id}
								blog={section.blog || null}
							/>
						</div>
					{/each}
				</div>
			</div>

			<!-- Timeline Items Scrubber (Right) -->
			<div
				bind:this={scrubberContainer}
				class="hidden w-16 lg:flex lg:flex-col lg:items-center lg:py-8 sticky top-28 h-fit"
			>
				<div class="space-y-2 flex flex-col justify-center bg-gradient-to-b from-primary-900/5 to-primary-900/10 rounded-lg p-3">
					{#each sections as section (section.id)}
						{@const isActive = activeSectionId === section.id}
						<button
							onclick={() => scrollToSection(section.id)}
							class={`group relative flex h-6 items-center justify-center rounded text-xs font-semibold transition-all duration-200 ${
								isActive
									? 'bg-accent text-white shadow-md scale-110'
									: 'text-primary-600 hover:text-accent hover:bg-primary-100'
							}`}
							title={`Aller à ${section.title}`}
							type="button"
						>
							{section.year}
						</button>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	:global(.scroll-my-20) {
		scroll-margin-top: 8rem;
		scroll-margin-bottom: 8rem;
	}
</style>
