<script lang="ts">
	let {
		content = '',
		backgroundColor = 'bg-gradient-warm'
	} = $props();
</script>

<section class={backgroundColor}>
	<div class="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
		<div class="rounded-xl bg-white p-8 shadow-lg md:p-12">
			{#if content}
				<div class="prose prose-sm max-w-none">
					<div class="text-primary-900 whitespace-pre-wrap leading-relaxed text-lg">
						{content}
					</div>
				</div>
			{:else}
				<div class="rounded-lg border-2 border-dashed border-primary-300 bg-primary-50 p-8 text-center">
					<p class="text-primary-700">Contenu à ajouter dans Builder.io CMS</p>
				</div>
			{/if}
		</div>
	</div>
</section>
