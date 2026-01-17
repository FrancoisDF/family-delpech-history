<script lang="ts">
	import FlipCardModal from './FlipCardModal.svelte';

	let {
		url = '',
		alt = '',
		caption = '',
		description = '',
		imageDisplayMode = 'cover'
	}: {
		url?: string;
		alt?: string;
		caption?: string;
		description?: string;
		imageDisplayMode?: string;
	} = $props();

	let isFlipped = $state(false);
	let isHovered = $state(false);
	let isModalOpen = $state(false);

	const maxDescriptionLength = 200;

	const isDescriptionLong = $derived(description.length > maxDescriptionLength);
	const truncatedDescription = $derived(
		isDescriptionLong ? description.substring(0, maxDescriptionLength) + '...' : description
	);

	const handleMouseEnter = () => {
		isHovered = true;
		isFlipped = true;
	};

	const handleMouseLeave = () => {
		isHovered = false;
		isFlipped = false;
	};

	const handleReadMore = (e: MouseEvent) => {
		e.stopPropagation();
		isModalOpen = true;
	};

	const handleCardActivate = () => {
		if (!description || !description.trim()) return;
		// Open the modal on card activation (keyboard/click) to access the full description.
		isModalOpen = true;
	};

	const handleCardKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleCardActivate();
		}
	};

	const objectFitClass = $derived(
		imageDisplayMode === 'contain' ? 'object-contain' : 'object-cover'
	);
</script>

<style>
	.flip-card-inner {
		position: relative;
		width: 100%;
		height: 100%;
		transition: transform 0.6s;
		transform-style: preserve-3d;
	}

	.flip-card-inner.flipped {
		transform: rotateY(180deg);
	}

	.flip-card-front,
	.flip-card-back {
		position: absolute;
		width: 100%;
		height: 100%;
		backface-visibility: hidden;
	}

	.flip-card-back {
		transform: rotateY(180deg);
		background: white;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 1.5rem;
	}
</style>

<FlipCardModal
	isOpen={isModalOpen}
	{url}
	{alt}
	{caption}
	{description}
	{imageDisplayMode}
	onClose={() => (isModalOpen = false)}
/>

<div
	class="relative h-64 w-full overflow-hidden rounded-xl bg-white shadow-md transition-all duration-300"
	class:shadow-xl={isHovered}
	class:scale-105={isHovered}
	role="button"
	tabindex="0"
	aria-label={caption ? `Ouvrir: ${caption}` : 'Ouvrir la carte'}
	onclick={handleCardActivate}
	onkeydown={handleCardKeyDown}
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	onfocus={handleMouseEnter}
	onblur={handleMouseLeave}
>
	<div class="flip-card-inner" class:flipped={isFlipped}>
		<!-- Front: Image -->
		<div class="flip-card-front">
			{#if url}
				<img src={url} {alt} class="h-full w-full {objectFitClass}" />
			{:else}
				<div class="flex h-full w-full items-center justify-center bg-primary-100">
					<div class="text-center">
						<svg
							class="mx-auto h-16 w-16 text-primary-300"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
						<p class="mt-2 text-sm text-primary-600">Image manquante</p>
					</div>
				</div>
			{/if}

			{#if caption}
				<div
					class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3"
				>
					<p class="text-center text-sm text-white">{caption}</p>
				</div>
			{/if}
		</div>

		<!-- Back: Description -->
		<div class="flip-card-back">
			{#if description}
				<div class="flex w-full flex-col items-center justify-between gap-4">
					<div class="prose prose-sm max-w-none text-center text-primary-900">
						<div class="line-clamp-6 leading-relaxed">
							{@html truncatedDescription}
						</div>
					</div>
					{#if isDescriptionLong}
						<button
							class="mt-auto inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-primary-800"
							onclick={handleReadMore}
							type="button"
						>
							Lire plus
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 5l7 7-7 7"
								/>
							</svg>
						</button>
					{/if}
				</div>
			{:else}
				<p class="text-center text-sm text-primary-600">Aucune description disponible</p>
			{/if}
		</div>
	</div>
</div>
