<script lang="ts">
	let { isOpen = false, pdfUrl = '', title = 'PDF Document' } = $props();

	let dialogElement: HTMLDialogElement | undefined;

	function closeModal() {
		isOpen = false;
		dialogElement?.close();
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === dialogElement) {
			closeModal();
		}
	}

	$effect(() => {
		if (isOpen && dialogElement) {
			dialogElement.showModal();
		} else if (!isOpen && dialogElement) {
			dialogElement.close();
		}
	});
</script>

<dialog
	bind:this={dialogElement}
	onclick={handleBackdropClick}
	onclose={() => (isOpen = false)}
	class="w-full max-w-4xl rounded-lg backdrop:bg-black/50"
>
	<div class="flex flex-col gap-4 p-6">
		<div class="flex items-center justify-between">
			<h2 class="font-serif text-2xl font-medium text-primary-800">{title}</h2>
			<button
				onclick={closeModal}
				class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-800 transition-colors hover:bg-primary-200"
				aria-label="Close modal"
				type="button"
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<div class="bg-primary-50 p-4">
			<iframe
				src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
				title={title}
				class="h-[600px] w-full rounded border-none"
			></iframe>
		</div>

		<div class="flex gap-3">
			<a
				href={pdfUrl}
				download
				class="flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-primary-800"
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8m0 8l-9-2m9 2l9-2m-9-8l9 2m-9-2l-9 2m9-2v8m0 8l-9-2m9 2l9-2"
					/>
				</svg>
				Télécharger le PDF
			</a>
			<button
				onclick={closeModal}
				class="rounded-lg border-2 border-primary-700 px-4 py-2 font-semibold text-primary-700 transition-colors hover:bg-primary-50"
				type="button"
			>
				Fermer
			</button>
		</div>
	</div>
</dialog>

<style>
	dialog::backdrop {
		animation: fadeIn 0.2s ease-in-out;
	}

	dialog {
		animation: slideUp 0.3s ease-in-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slideUp {
		from {
			transform: translateY(2rem);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
</style>
