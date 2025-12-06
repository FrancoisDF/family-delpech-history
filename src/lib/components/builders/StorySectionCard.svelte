<script lang="ts">
	interface Props {
		title?: string;
		description?: string;
		audioUrl?: string;
		year?: number;
	}

	let { title = '', description = '', audioUrl = '', year = 1800 } = $props();
</script>

<div class="group relative rounded-2xl border-2 border-transparent bg-white p-8 shadow-lg transition-all hover:shadow-2xl md:p-12">

	<div class="mx-auto max-w-4xl">
		<h3 class="mb-4 font-serif text-3xl font-medium text-primary-800">{title}</h3>

		<p class="mb-8 text-lg leading-relaxed text-primary-700">{description}</p>

		<!-- Audio Player -->
		{#if audioUrl}
			<div class="rounded-lg bg-primary-50 p-6">
				<div class="mb-3 flex items-center gap-2">
					<svg class="h-5 w-5 text-primary-800" fill="currentColor" viewBox="0 0 20 20">
						<path d="M9 3a6 6 0 100 12A6 6 0 009 3z" />
					</svg>
					<span class="text-sm font-medium text-primary-800">Récit Audio</span>
				</div>
				<audio class="w-full accent-primary-800" controls controlsList="nodownload">
					<source src={audioUrl} type="audio/mpeg" />
					Votre navigateur ne supporte pas l'élément audio.
				</audio>
			</div>
		{/if}
	</div>
</div>
