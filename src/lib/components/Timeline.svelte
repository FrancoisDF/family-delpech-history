<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { getLastListenedId } from '$lib/progress';
	import StorySectionCard from './StorySectionCard.svelte';

	interface Section {
		id: string;
		title: string;
		description: string;
		audioUrl: string;
		year: number;
	}

	interface Props {
		sections?: Section[];
	}

	let { sections = [] } = $props<Props>();

	let timelineContainer: HTMLElement;
	let lastListenedId: string | null = $state(null);
	let activeSectionId: string | null = $state(null);
	let progressPercentage: number = $state(0);
	let completedCount: number = $state(0);

	onMount(() => {
		lastListenedId = getLastListenedId();
		activeSectionId = lastListenedId;
		updateProgress();

		// Scroll to last listened section if exists
		if (lastListenedId && timelineContainer) {
			setTimeout(() => {
				const activeElement = document.getElementById(`section-${lastListenedId}`);
				if (activeElement) {
					activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
				}
			}, 100);
		}

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

	function continueListen() {
		if (lastListenedId) {
			scrollToSection(lastListenedId);
			// Auto-play the audio after scrolling
			setTimeout(() => {
				const audio = document.getElementById(lastListenedId) as HTMLAudioElement;
				if (audio) {
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
		<div class="sticky top-0 z-20 bg-gradient-to-b from-primary-50 to-transparent px-4 py-6 sm:px-6 lg:px-8">
			<div class="mx-auto max-w-5xl">
				<button
					onclick={continueListen}
					class="inline-flex items-center gap-3 rounded-lg bg-accent px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
				>
					<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
					</svg>
					Continuer depuis la dernière écoute
				</button>
			</div>
		</div>
	{/if}

	<!-- Progress Bar -->
	<div class="sticky top-16 z-20 bg-white px-4 py-4 sm:px-6 lg:px-8 shadow-sm">
		<div class="mx-auto max-w-5xl">
			<div class="mb-2 flex items-center justify-between">
				<span class="text-sm font-medium text-primary-700">Progression: {Math.round(progressPercentage)}%</span>
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

	<!-- Timeline Container -->
	<div bind:this={timelineContainer} class="relative px-4 py-16 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-5xl">
			<!-- Timeline Line -->
			<div class="absolute left-4 top-0 h-full w-0.5 bg-gradient-to-b from-transparent via-primary-200 to-transparent sm:left-6 md:left-1/2 md:-translate-x-1/2 lg:left-1/2 lg:-translate-x-1/2"></div>

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
							isActive={activeSectionId === section.id}
						/>
					</div>
				{/each}
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
