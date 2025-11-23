<script lang="ts">
	let {
		content = '',
		textSize = 'text-lg',
		textAlign = 'text-left',
		connectTop = false,
		connectBottom = false
	} = $props();

	const spacingTop = connectTop ? '' : 'pt-8';
	const spacingBottom = connectBottom ? '' : 'pb-8';
</script>

<section class="bg-gradient-warm px-4 {spacingTop} {spacingBottom} sm:px-6 lg:px-8">
	<div class="mx-auto max-w-4xl">
		<div class="prose prose-lg max-w-none {textAlign}">
			<p class="{textSize} leading-relaxed text-primary-900 whitespace-pre-wrap">
				{content}
			</p>
		</div>
	</div>
</section>
