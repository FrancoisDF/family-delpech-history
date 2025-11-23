<script lang="ts">
	let {
		content = '',
		backgroundColor = 'bg-gradient-warm',
		textSize = 'text-base',
		maxWidth = 'max-w-4xl',
		connectTop = false,
		connectBottom = false
	} = $props();

	const spacingTop = $derived(connectTop ? '' : 'pt-12');
	const spacingBottom = $derived(connectBottom ? '' : 'pb-12');

	// Dynamic classes for connected sections
	const roundedClasses = $derived(
		connectTop && connectBottom
			? 'rounded-none'
			: connectTop
				? 'rounded-t-none rounded-b-xl'
				: connectBottom
					? 'rounded-t-xl rounded-b-none'
					: 'rounded-xl'
	);

	const shadowClasses = $derived(connectTop || connectBottom ? '' : 'shadow-lg');

	// Convert markdown-like syntax to HTML
	function parseMarkdown(text: string): string {
		if (!text) return '';

		let html = text;

		// Headers
		html = html.replace(
			/^### (.*$)/gim,
			'<h3 class="mb-4 mt-8 font-serif text-2xl font-bold text-primary-900">$1</h3>'
		);
		html = html.replace(
			/^## (.*$)/gim,
			'<h2 class="mb-6 mt-10 font-serif text-3xl font-bold text-primary-900">$1</h2>'
		);
		html = html.replace(
			/^# (.*$)/gim,
			'<h1 class="mb-6 mt-10 font-serif text-4xl font-bold text-primary-900">$1</h1>'
		);

		// Bold
		html = html.replace(
			/\*\*(.*?)\*\*/g,
			'<strong class="font-semibold text-primary-900">$1</strong>'
		);

		// Italic
		html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

		// Links
		html = html.replace(
			/\[(.*?)\]\((.*?)\)/g,
			'<a href="$2" class="text-accent underline hover:text-primary-900">$1</a>'
		);

		// Line breaks
		html = html.replace(/\n\n/g, '</p><p class="mb-4 leading-relaxed text-primary-900">');

		// Lists
		html = html.replace(/^\* (.*$)/gim, '<li class="ml-6 list-disc">$1</li>');
		html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-6 list-decimal">$1</li>');

		// Wrap in paragraph
		if (!html.includes('<h1') && !html.includes('<h2') && !html.includes('<h3')) {
			html = '<p class="mb-4 leading-relaxed text-primary-900">' + html + '</p>';
		}

		return html;
	}
</script>

<section class="{backgroundColor} px-4 {spacingTop} {spacingBottom} sm:px-6 lg:px-8">
	<div class="mx-auto {maxWidth}">
		<div class="{roundedClasses} {shadowClasses} bg-white p-8 md:p-12">
			{#if content}
				<div class="prose prose-lg max-w-none {textSize}">
					{@html parseMarkdown(content)}
				</div>
			{:else}
				<div
					class="rounded-lg border-2 border-dashed border-primary-300 bg-primary-50 p-8 text-center"
				>
					<p class="text-primary-700">Ajouter votre contenu en Markdown...</p>
					<p class="mt-2 text-xs text-primary-600">
						Supporte: # Titres, **gras**, *italique*, [liens](url), listes
					</p>
				</div>
			{/if}
		</div>
	</div>
</section>

<style>
	:global(.prose) {
		color: inherit;
	}

	:global(.prose h1),
	:global(.prose h2),
	:global(.prose h3) {
		margin-top: 0;
	}

	:global(.prose p:last-child) {
		margin-bottom: 0;
	}

	:global(.prose ul),
	:global(.prose ol) {
		margin: 1rem 0;
	}

	:global(.prose li) {
		margin: 0.5rem 0;
	}
</style>
