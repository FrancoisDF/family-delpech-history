<script lang="ts">
	let {
		leftContent = '',
		rightContent = '',
		title = ''
	} = $props();
</script>

<section class="bg-gradient-warm px-4 py-12 sm:px-6 lg:px-8">
	<div class="mx-auto max-w-6xl">
		{#if title}
			<h2 class="mb-8 text-center font-serif text-3xl font-bold text-primary-900">
				{title}
			</h2>
		{/if}
		
		<div class="grid gap-8 rounded-xl bg-white p-8 shadow-md md:grid-cols-2 md:p-12">
			<div class="prose prose-lg max-w-none">
				<p class="leading-relaxed text-primary-900 whitespace-pre-wrap">
					{leftContent}
				</p>
			</div>
			
			<div class="prose prose-lg max-w-none border-t pt-8 md:border-l md:border-t-0 md:pl-8 md:pt-0">
				<p class="leading-relaxed text-primary-900 whitespace-pre-wrap">
					{rightContent}
				</p>
			</div>
		</div>
	</div>
</section>
