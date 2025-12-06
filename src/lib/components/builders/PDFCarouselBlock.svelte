<script lang="ts">
	interface PDFItem {
		id?: string;
		title: string;
		description?: string;
		pdfFile: any;
	}

	interface Props {
		title?: string;
		description?: string;
		pdfs?: PDFItem[];
	}

	let { title = 'Documents', description = '', pdfs = [] } = $props();

	let isPDFModalOpen = $state(false);
	let selectedPdfUrl = $state('');
	let selectedPdfTitle = $state('');
	let modalElement: HTMLDialogElement | undefined = $state();

	function openPDFModal(pdfUrl: string, pdfTitle: string) {
		selectedPdfUrl = pdfUrl;
		selectedPdfTitle = pdfTitle;
		isPDFModalOpen = true;
		modalElement?.showModal();
	}

	function closePDFModal() {
		isPDFModalOpen = false;
		modalElement?.close();
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === modalElement) {
			closePDFModal();
		}
	}

	function handleDownload(pdfUrl: string, pdfTitle: string) {
		const link = document.createElement('a');
		link.href = pdfUrl;
		link.download = `${pdfTitle}.pdf`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	// Helper: the Builder file input may be a string URL or a file object
	function getPdfUrl(pdfFile: any): string {
		if (!pdfFile) return '';
		if (typeof pdfFile === 'string') return pdfFile;
		// builder file shapes may vary — try common locations
		if (typeof pdfFile === 'object') {
			if (typeof pdfFile.url === 'string') return pdfFile.url;
			if (pdfFile.file && typeof pdfFile.file.url === 'string') return pdfFile.file.url;
			if (typeof pdfFile.path === 'string') return pdfFile.path;
		}
		return '';
	}

	$effect(() => {
		if (isPDFModalOpen && modalElement && !modalElement.open) {
			modalElement.showModal();
		} else if (!isPDFModalOpen && modalElement && modalElement.open) {
			modalElement.close();
		}
	});
</script>

<section class="bg-primary-50 px-4 py-12 sm:px-6 lg:px-8">
	<div class="mx-auto max-w-6xl">
		{#if title}
			<div class="mb-8 text-center">
				<h2 class="mb-4 font-serif text-3xl font-medium text-primary-800 sm:text-4xl">{title}</h2>
				{#if description}
					<p class="text-base text-primary-600 sm:text-lg">{description}</p>
				{/if}
			</div>
		{/if}

		{#if pdfs && pdfs.length > 0}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{#each pdfs as pdf, i (pdf.id ?? `${pdf.title || 'pdf'}-${i}`)}
					<div class="flex flex-col rounded-lg bg-white p-4 shadow-md transition-shadow hover:shadow-lg">
						<div class="mb-3 flex items-center gap-4">
							<svg class="h-8 w-8 text-primary-700" fill="currentColor" viewBox="0 0 20 20">
								<path
									d="M4 4a2 2 0 012-2h4.586A2 2 0 0113 2.586L15.414 5A2 2 0 0116 6.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
								/>
							</svg>
							<h3 class="mb-2 line-clamp-2 font-serif text-base font-medium text-primary-800">{pdf.title}</h3>
						</div>


						{#if pdf.description}
							<p class="mb-4 flex-grow text-xs text-primary-600 line-clamp-2 sm:text-sm">{pdf.description}</p>
						{/if}

						<div class="flex gap-2">
							<button
								onclick={() => openPDFModal(getPdfUrl(pdf.pdfFile), pdf.title)}
								class="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-primary-700 px-2 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-800"
								type="button"
								title="Voir le PDF"
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
									/>
								</svg>
								Voir
							</button>
							<button
								onclick={() => handleDownload(getPdfUrl(pdf.pdfFile), pdf.title)}
								class="inline-flex flex-1 items-center justify-center gap-1 rounded-md border-2 border-primary-700 px-2 py-2 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary-50"
								type="button"
								title="Télécharger le PDF"
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
									/>
								</svg>
								Télécharger
							</button>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="rounded-lg border-2 border-dashed border-primary-300 p-8 text-center">
				<svg class="mx-auto mb-4 h-12 w-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
					/>
				</svg>
				<p class="text-primary-600">Aucun document disponible</p>
			</div>
		{/if}
	</div>

	<!-- PDF Modal -->
	{#if isPDFModalOpen}
		<dialog
			bind:this={modalElement}
			onclick={handleBackdropClick}
			onclose={() => (isPDFModalOpen = false)}
			class="w-full max-w-4xl rounded-lg backdrop:bg-black/50"
		>
			<div class="flex flex-col gap-4 p-6">
				<div class="flex items-center justify-between">
					<h2 class="font-serif text-2xl font-medium text-primary-800">{selectedPdfTitle}</h2>
					<button
						onclick={closePDFModal}
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
						src={`${selectedPdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
						title={selectedPdfTitle}
						class="h-[600px] w-full rounded border-none"
					></iframe>
				</div>

				<div class="flex gap-3">
					<a
						href={selectedPdfUrl}
						download={`${selectedPdfTitle}.pdf`}
						class="flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-primary-800"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
							/>
						</svg>
						Télécharger le PDF
					</a>
					<button
						onclick={closePDFModal}
						class="rounded-lg border-2 border-primary-700 px-4 py-2 font-semibold text-primary-700 transition-colors hover:bg-primary-50"
						type="button"
					>
						Fermer
					</button>
				</div>
			</div>
		</dialog>
	{/if}
</section>
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
