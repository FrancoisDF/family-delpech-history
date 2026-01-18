<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { browser } from '$app/environment';

	type VariantType = 'grayscale' | 'color' | 'image-focus';

	let {
		title = 'Histoire de Famille',
		description = 'Default description',
		primaryButtonText = 'Primary Button',
		primaryButtonLink = '/',
		secondaryButtonText = 'Secondary Button',
		secondaryButtonLink = '/',
		backgroundImage = '',
		backgroundImageDisplayMode = 'cover',
		variant = 'grayscale' as VariantType
	} = $props<{
		title?: string;
		description?: string;
		primaryButtonText?: string;
		primaryButtonLink?: string;
		secondaryButtonText?: string;
		secondaryButtonLink?: string;
		backgroundImage?: string;
		backgroundImageDisplayMode?: 'cover' | 'contain';
		variant?: VariantType;
	}>();

		// minimal binding target for bind:this in markup (keeps file compiling when
		// the more sophisticated scroll effect is disabled in this file)
		let heroEl: HTMLElement | undefined;

	// // reactive state used for the background transform
	// let bgTranslate = $state(0); // px
	// let bgScale = $state(1); // unitless

	// // reference to the root section so we can calculate intersection/scroll
	// let heroEl: HTMLElement | undefined = $state();

	// // RAF id for cleanup
	// let rafId: number | null = null;

	// // respect prefers-reduced-motion users
	// let prefersReducedMotion = false;

	// function clamp(v: number, a = 0, b = 1) {
	// 	return Math.max(a, Math.min(b, v));
	// }

	// // Return sensible effect strength values depending on viewport width so the
	// // effect is softer on phones and stronger on larger screens.
	// function getEffectStrength() {
	// 	const w = (typeof window !== 'undefined' && (window.innerWidth || document.documentElement.clientWidth)) || 1024;

	// 	if (w < 640) {
	// 		// mobile — subtle
	// 		return { maxTranslate: 60, maxScaleDelta: 0.25 };
	// 	}
	// 	if (w < 1024) {
	// 		// tablet / small desktop — medium
	// 		return { maxTranslate: 100, maxScaleDelta: 0.45 };
	// 	}

	// 	// large desktops — stronger effect
	// 	return { maxTranslate: 140, maxScaleDelta: 0.6 };
	// }

	// function update() {
	// 	if (!heroEl || !browser || prefersReducedMotion) return;

	// 	const rect = heroEl.getBoundingClientRect();
	// 	const vh = window.innerHeight || document.documentElement.clientHeight;

	// 	// progress 0 -> 1 as the hero moves into view (when top at bottom -> top at top)
	// 	// clamp to [0, 1]
	// 	const progress = 1 - (rect.top - 61) / vh ;

	// 	// effect strength values are computed by `getEffectStrength()` defined
	// 	// at module scope so other handlers (resize) can also read the same
	// 	// recommended values.
	// 	const { maxTranslate, maxScaleDelta } = getEffectStrength();

	// 	// allow fractional transform for smoother motion and clamp to the max
	// 	bgTranslate = progress * maxTranslate;
	// 	bgScale = 0.8 + progress * maxScaleDelta;

	// 	console.log(rect, vh);
	// 	console.log(bgTranslate, bgScale, progress);
	// }

	// function onScroll() {
	// 	// throttle via RAF
	// 	if (rafId != null) return;
	// 	rafId = requestAnimationFrame(() => {
	// 		update();
	// 		rafId = null;
	// 	});
	// }

	// onMount(() => {
	// 	if (!browser) return;

	// 	prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// 	// When the hero is already visible in the viewport on mount, do a single
	// 	// update so the background position is correct immediately. We still
	// 	// rely on the scroll handler for continuous updates (keeping the effect
	// 	// driven by user scroll), and respect prefers-reduced-motion.
	// 	try {
	// 		// if the hero is anywhere in the viewport, set the initial state once
	// 		const rect = heroEl?.getBoundingClientRect();
	// 		if (rect && rect.top < window.innerHeight && rect.bottom > 0 && !prefersReducedMotion) {
	// 			update();
	// 		}
	// 	} catch (e) {
	// 		// defensive — if anything goes wrong, silently skip the initial update
	// 	}

	// 	// listen on scroll and resize for responsiveness
	// 	window.addEventListener('scroll', onScroll, { passive: true });
	// 	// on resize we should ensure the effect strength is recalculated for
	// 	// the new width. We update the transforms as well so the visuals stay
	// 	// correct when the user resizes the window.
	// 	function onResize() {
	// 		// recompute effect strength on resize
	// 		try {
	// 			const { maxTranslate: newMaxT, maxScaleDelta: newMaxS } = getEffectStrength();
	// 			// reassign these outer constants by updating a small local mapping
	// 			// (we keep using the local names inside update() via closure in this file)
	// 			// To reflect the change for subsequent update() calls, we update
	// 			// values by redefining the function getEffectStrength; a simple
	// 			// workaround is to update bgTranslate/bgScale immediately.
	// 			update();
	// 		} catch (e) {
	// 			/* noop */
	// 		}
	// 	}

	// 	window.addEventListener('resize', onResize);

	// 	return () => {
	// 		window.removeEventListener('scroll', onScroll);
	// 		window.removeEventListener('resize', onResize);
	// 		if (rafId != null) cancelAnimationFrame(rafId);
	// 	};
	// });
</script>

<section
	bind:this={heroEl}
	class="relative flex h-screen max-h-[800px] items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8"
>
	{#if backgroundImage}
		<!-- Background layer with optional grayscale filter -->
		<div class="absolute inset-0 overflow-hidden" aria-hidden="true">
			<div
				class="absolute inset-0 bg-center"
				style={`background-image: url('${backgroundImage}'); background-size: ${backgroundImageDisplayMode === 'contain' ? 'contain' : 'cover'}; transform-origin: center center; will-change: transform, filter; transform: scale(1.05); ${variant === 'grayscale' ? 'filter: grayscale(100%);' : ''} pointer-events: none;`}
			></div>
		</div>
	{/if}

	<!-- Dark background around text area only -->
	<div class="relative z-10 mx-auto max-w-4xl rounded-lg bg-black/60 px-8 py-12 text-center sm:px-12 sm:py-16">
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
