<script lang="ts">
	let {
		image = '',
		imageAlt = '',
		title = '',
		content = '',
		imagePosition = 'left',
		imageWidth = 'w-1/2'
	} = $props();
</script>

<section class="bg-gradient-warm px-4 py-12 sm:px-6 lg:px-8">
	<div class="mx-auto max-w-6xl">
		<div class="rounded-xl bg-white p-8 shadow-md md:p-12">
			<div class="flex flex-col {imagePosition === 'right' ? 'md:flex-row-reverse' : 'md:flex-row'} gap-8 items-center">
				{#if image}
					<div class="flex-shrink-0 {imageWidth}">
						<img 
							src={image} 
							alt={imageAlt} 
							class="rounded-lg object-cover w-full h-auto shadow-md"
						/>
					</div>
				{/if}
				
				<div class="flex-1">
					{#if title}
						<h3 class="mb-4 font-serif text-2xl font-bold text-primary-900 md:text-3xl">
							{title}
						</h3>
					{/if}
					{#if content}
						<div class="prose prose-lg max-w-none">
							<p class="leading-relaxed text-primary-700 whitespace-pre-wrap">
								{content}
							</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</section>
