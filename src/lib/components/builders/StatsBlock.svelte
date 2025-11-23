<script lang="ts">
	let {
		title = 'Le Saviez-Vous ?',
		stats = [],
		columns = 3
	}: {
		title?: string;
		stats?: Array<{ value: string; label: string; description: string }>;
		columns?: number;
	} = $props();
</script>

<section class="bg-primary-700 px-4 py-16 sm:px-6 lg:px-8">
	<div class="mx-auto max-w-6xl">
		{#if title}
			<h2 class="mb-12 text-center font-serif text-3xl font-bold text-white md:text-4xl">
				{title}
			</h2>
		{/if}

		<div class="grid gap-8 md:grid-cols-{columns}">
			{#each stats as stat}
				<div class="text-center">
					<div class="mb-3 font-serif text-5xl font-bold text-accent md:text-6xl">
						{stat.value}
					</div>
					<div class="mb-2 text-xl font-semibold text-white">
						{stat.label}
					</div>
					{#if stat.description}
						<p class="text-sm text-white/80">
							{stat.description}
						</p>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</section>
