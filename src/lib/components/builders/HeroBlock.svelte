<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';

	let {
		title = 'Histoire de Famille',
		description = 'Default description',
		primaryButtonText = 'Primary Button',
		primaryButtonLink = '/',
		secondaryButtonText = 'Secondary Button',
		secondaryButtonLink = '/',
		backgroundImage = ''
	} = $props();

	// reactive state used for the background transform
	let bgTranslate = $state(0); // px
	let bgScale = $state(1); // unitless

	// reference to the root section so we can calculate intersection/scroll
	let heroEl = $state<HTMLElement>();

	// RAF id for cleanup
	let rafId: number | null = null;

	// respect prefers-reduced-motion users
	let prefersReducedMotion = false;

	function clamp(v: number, a = 0, b = 1) {
		return Math.max(a, Math.min(b, v));
	}

	function update() {
		if (!heroEl || prefersReducedMotion) return;

		const rect = heroEl.getBoundingClientRect();
		const vh = window.innerHeight || document.documentElement.clientHeight;

		// progress 0 -> 1 as the hero moves into view (when top at bottom -> top at top)
		// clamp to [0, 1]
		const progress = clamp(1 - rect.top / vh, 0, 1);

		// tweak these to control effect strength
		const maxTranslate = 40; // px to move up
		const maxScaleDelta = 0.06; // scale up to 1.06

		bgTranslate = -Math.round(progress * maxTranslate);
		bgScale = 1 + progress * maxScaleDelta;
	}

	function onScroll() {
		// throttle via RAF
		if (rafId != null) return;
		rafId = requestAnimationFrame(() => {
			update();
			rafId = null;
		});
	}

	onMount(() => {
		prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		// initial update
		update();

		// listen on scroll and resize for responsiveness
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll);

		return () => {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
			if (rafId != null) cancelAnimationFrame(rafId);
		};
	});
</script>

<section
	bind:this={heroEl}
	class="relative flex h-screen max-h-[800px] items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8"
>
	{#if backgroundImage}
		<!-- Background layer: transforms on scroll for a parallax-esque, scale-up effect -->
		<div class="absolute inset-0 overflow-hidden" aria-hidden="true">
			<div
				class="absolute inset-0 bg-cover bg-center will-change-transform"
				style={`background-image: url('${backgroundImage}'); transform: translateY(${bgTranslate}px) scale(${bgScale});`}
			></div>
		</div>
	{/if}

	<div class="absolute inset-0 bg-black/60"></div>

	<div class="relative z-10 mx-auto max-w-4xl text-center">
		<h1
			class="mb-6 font-serif text-5xl font-medium tracking-tight text-white md:text-6xl lg:text-7xl"
		>
			{title}
		</h1>
		<p class="mb-8 text-xl leading-relaxed text-white/80 md:text-2xl lg:text-3xl">
			{description}
		</p>
		<div class="flex flex-col justify-center gap-4 sm:flex-row">
			<a
				href={resolve(primaryButtonLink as any)}
				class="inline-block rounded-lg bg-primary-700 px-8 py-3 font-semibold text-white transition-colors hover:bg-primary-800"
			>
				{primaryButtonText}
			</a>
			<a
				href={resolve(secondaryButtonLink as any)}
				class="inline-block rounded-lg border-2 border-white px-8 py-3 font-semibold text-white transition-colors hover:bg-white hover:text-primary-800"
			>
				{secondaryButtonText}
			</a>
		</div>
	</div>
</section>
