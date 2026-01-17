<script lang="ts">
	interface Props {
		pdfUrl?: string;
		pdfTitle?: string;
		onOpenModal?: (url: string, title: string) => void;
	}

	let { pdfUrl = '', pdfTitle = 'PDF Document', onOpenModal }: Props = $props();

	function handleOpenPDF() {
		if (onOpenModal) {
			onOpenModal(pdfUrl, pdfTitle);
		}
	}

	function handleDownload() {
		const link = document.createElement('a');
		link.href = pdfUrl;
		link.download = `${pdfTitle}.pdf`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
</script>

{#if pdfUrl}
	<div class="flex gap-3">
		<button
			onclick={handleOpenPDF}
			class="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-800"
			type="button"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
				/>
			</svg>
			Voir le PDF
		</button>
		<button
			onclick={handleDownload}
			class="inline-flex items-center gap-2 rounded-lg border-2 border-primary-700 px-6 py-3 font-semibold text-primary-700 transition-colors hover:bg-primary-50"
			type="button"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
{/if}
