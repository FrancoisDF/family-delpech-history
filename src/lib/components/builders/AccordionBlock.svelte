<script lang="ts">

	let { title = 'Questions Fréquentes', items = [] }: { title?: string; items?: Array<{ question: string; answer: string }> } = $props();

	let openItems = $state<Record<number, boolean>>({});

	function toggleItem(index: number) {
		openItems[index] = !openItems[index];
	}
</script>

<section class="bg-gradient-warm px-4 py-12 sm:px-6 lg:px-8">
	<div class="mx-auto max-w-4xl">
		{#if title}
			<h2 class="mb-8 text-center font-serif text-3xl font-bold text-primary-900">
				{title}
			</h2>
		{/if}
		
		<div class="space-y-4">
			{#each items as item, index (index)}
				<div class="overflow-hidden rounded-lg bg-white shadow-md">
					<button
						onclick={() => toggleItem(index)}
						class="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-primary-50"
					>
						<h3 class="font-serif text-lg font-semibold text-primary-900 pr-4">
							{item.question}
						</h3>
						<svg
							class="h-5 w-5 flex-shrink-0 text-accent transition-transform"
							class:rotate-180={openItems[index]}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>
					
					{#if openItems[index]}
						<div class="border-t border-primary-200 p-6">
							<p class="leading-relaxed text-primary-700 whitespace-pre-wrap">
								{item.answer}
							</p>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</section>
