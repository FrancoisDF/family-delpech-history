<script lang="ts">
	let {
		content = '',
		textSize = 'text-lg',
		textAlign = 'text-left',
		connectTop = false,
		connectBottom = false
	} = $props();

	const spacingTop = $derived(connectTop ? '' : 'pt-8');
	const spacingBottom = $derived(connectBottom ? '' : 'pb-8');
</script>

<section class="bg-gradient-warm px-4 {spacingTop} {spacingBottom} sm:px-6 lg:px-8">
	<div class="mx-auto max-w-4xl">
		<div class="prose prose-lg max-w-none {textAlign}">
			<div class="{textSize} text-primary-900">
				{@html content}
			</div>
		</div>
	</div>
</section>
