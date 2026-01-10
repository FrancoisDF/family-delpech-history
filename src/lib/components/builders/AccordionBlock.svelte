<script lang="ts">
	import PDFModal from '../PDFModal.svelte';

	let {
		title = 'Documents',
		sections = [],
		connectTop = false,
		connectBottom = false
	}: {
		title?: string;
		sections?: Array<{
			name: string;
			documents: Array<{ name: string; description?: string; file: string; actionType: 'view' | 'download' }>;
		}>;
		connectTop?: boolean;
		connectBottom?: boolean;
	} = $props();

	let openSections = $state<Record<number, boolean>>({});
	let isPdfModalOpen = $state(false);
	let selectedPdfUrl = $state('');
	let selectedPdfTitle = $state('');

	const spacingTop = $derived(connectTop ? '' : 'pt-12');
	const spacingBottom = $derived(connectBottom ? '' : 'pb-12');

	function toggleSection(index: number) {
		openSections[index] = !openSections[index];
	}

	function handleViewDocument(file: string, docName: string) {
		selectedPdfUrl = file;
		selectedPdfTitle = docName;
		isPdfModalOpen = true;
	}

	function handleDownloadDocument(file: string, docName: string) {
		const link = document.createElement('a');
		link.href = file;
		link.download = docName || 'document';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
</script>

<PDFModal
	isOpen={isPdfModalOpen}
	pdfUrl={selectedPdfUrl}
	title={selectedPdfTitle}
/>

<section class=" px-4 {spacingTop} {spacingBottom} sm:px-6 lg:px-8">
	<div class="mx-auto max-w-4xl">
		{#if title}
			<h2 class="mb-8 text-center font-serif text-3xl font-bold text-primary-900">
				{title}
			</h2>
		{/if}

		<div class="space-y-4">
			{#each sections as section, index (index)}
				<div class="overflow-hidden rounded-lg bg-white shadow-md">
					<button
						onclick={() => toggleSection(index)}
						class="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-primary-50"
					>
						<h3 class="pr-4 font-serif text-lg font-semibold text-primary-900">
							{section.name}
						</h3>
						<svg
							class="h-5 w-5 flex-shrink-0 text-accent transition-transform"
							class:rotate-180={openSections[index]}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 9l-7 7-7-7"
							/>
						</svg>
					</button>

					{#if openSections[index]}
						<div class="border-t border-primary-200 p-6">
							{#if section.documents && section.documents.length > 0}
								<ul class="space-y-3">
									{#each section.documents as doc}
										<li
											class="flex items-start justify-between rounded-lg border border-primary-200 p-4 transition-colors hover:bg-primary-50"
										>
											<div class="flex flex-1 flex-col gap-2">
												<div class="flex items-center gap-3">
													<svg
														class="h-5 w-5 flex-shrink-0 text-primary-600"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
														/>
													</svg>
													<span class="font-medium text-primary-900">{doc.name}</span>
												</div>
												{#if doc.description}
													<p class="ml-8 text-sm text-primary-600">
														{doc.description}
													</p>
												{/if}
											</div>

											<div class="flex flex-shrink-0 gap-2 ml-4">
												<button
													class="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-2 py-2 md:px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-800 whitespace-nowrap"
													onclick={() => handleViewDocument(doc.file, doc.name)}
													type="button"
													title="Voir le document"
												>
													<svg
														class="h-4 w-4"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
														/>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
														/>
													</svg>
													<span class="hidden md:inline">Voir</span>
												</button>
												<button
													class="inline-flex items-center gap-2 rounded-lg border-2 border-primary-700 px-2 py-2 md:px-4 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-50 whitespace-nowrap"
													onclick={() => handleDownloadDocument(doc.file, doc.name)}
													type="button"
													title="Télécharger le document"
												>
													<svg
														class="h-4 w-4"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
														/>
													</svg>
													<span class="hidden md:inline">Télécharger</span>
												</button>
											</div>
										</li>
									{/each}
								</ul>
							{:else}
								<p class="text-center text-sm text-primary-600">Aucun document disponible</p>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</section>
