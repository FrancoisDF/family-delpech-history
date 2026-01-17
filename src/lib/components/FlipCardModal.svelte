<script lang="ts">
	let {
		isOpen = false,
		url = '',
		alt = '',
		caption = '',
		description = '',
		imageDisplayMode = 'cover',
		onClose = undefined
	}: {
		isOpen?: boolean;
		url?: string;
		alt?: string;
		caption?: string;
		description?: string;
		imageDisplayMode?: string;
		onClose?: () => void;
	} = $props();

	const objectFitClass = $derived(
		imageDisplayMode === 'contain' ? 'object-contain' : 'object-cover'
	);

	const handleBackdropClick = (e: MouseEvent) => {
		if (e.target === e.currentTarget) {
			onClose?.();
		}
	};

	const handleEscape = (e: KeyboardEvent) => {
		if (e.key === 'Escape') {
			onClose?.();
		}
	};
</script>

<svelte:window onkeydown={handleEscape} />

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onmousedown={handleBackdropClick}
	>
		<div class="relative max-h-[90vh] max-w-2xl overflow-auto rounded-xl bg-white shadow-2xl">
			<!-- Close Button -->
			<button
				class="absolute right-4 top-4 z-10 rounded-lg bg-black/40 p-2 text-white transition-colors hover:bg-black/60"
				onclick={() => onClose?.()}
				aria-label="Close modal"
			>
				<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>

			<!-- Image Section -->
			{#if url}
				<div class="h-96 w-full overflow-hidden bg-primary-100">
					<img src={url} {alt} class="h-full w-full {objectFitClass}" />
				</div>
			{/if}

			<!-- Content Section -->
			<div class="p-6 sm:p-8">
				{#if caption}
					<h2 class="mb-4 font-serif text-2xl font-bold text-primary-900">
						{caption}
					</h2>
				{/if}

				{#if description}
					<div class="prose prose-lg max-w-none text-primary-900">
						<div class="leading-relaxed">
							{@html description}
						</div>
					</div>
				{:else}
					<p class="text-primary-700">Aucune description disponible</p>
				{/if}
			</div>
		</div>
	</div>
{/if}
