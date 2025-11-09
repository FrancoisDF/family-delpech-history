<script lang="ts">
	export let id: string = '';
	export let title: string = '';
	export let description: string = '';
	export let audioUrl: string = '';
	export let year: number = 1800;
</script>

<div class="group relative rounded-2xl bg-white p-8 shadow-lg transition-all hover:shadow-2xl md:p-12">
	<!-- Timeline Year Indicator -->
	<div
		class="absolute -left-4 top-1/2 hidden -translate-y-1/2 transform md:flex md:flex-col md:items-center"
	>
		<div class="h-2 w-2 rounded-full bg-gold"></div>
		<div class="mt-2 rounded-lg bg-primary-900 px-3 py-1 text-xs font-bold text-cream">
			{year}
		</div>
	</div>

	<div class="md:pl-12">
		<h3 class="mb-4 font-serif text-3xl font-bold text-primary-900">{title}</h3>

		<p class="mb-8 text-lg leading-relaxed text-primary-700">{description}</p>

		<!-- Audio Player -->
		{#if audioUrl}
			<div class="rounded-lg bg-primary-50 p-6">
				<div class="mb-3 flex items-center gap-2">
					<svg
						class="h-5 w-5 text-primary-900"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path d="M9 3a6 6 0 100 12A6 6 0 009 3z" />
					</svg>
					<span class="text-sm font-semibold text-primary-900">Récit Audio</span>
				</div>
				<audio
					id={id}
					class="w-full accent-primary-900"
					controls
					controlsList="nodownload"
				>
					<source src={audioUrl} type="audio/mpeg" />
					Votre navigateur ne supporte pas l'élément audio.
				</audio>
			</div>
		{/if}
	</div>
</div>
