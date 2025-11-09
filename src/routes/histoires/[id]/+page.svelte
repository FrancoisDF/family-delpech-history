<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="min-h-screen bg-gradient-warm">
	<!-- Page Content -->
	<section class="px-4 py-16 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-4xl">
			<!-- Back Link -->
			<a href="/histoires" class="mb-8 inline-flex items-center gap-2 text-primary-900 hover:text-gold transition-colors">
				<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
					<path d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 111.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" />
				</svg>
				Retour aux histoires
			</a>

			<!-- Placeholder Content -->
			<article class="rounded-xl bg-white p-8 shadow-lg md:p-12">
				<h1 class="mb-4 font-serif text-4xl font-bold text-primary-900">Histoire #{$page.params.id}</h1>

				<div class="mb-6 flex items-center gap-4 border-b border-primary-200 pb-6">
					<span class="font-semibold text-primary-900">Date</span>
					<span class="text-sm text-primary-600">•</span>
					<span class="text-sm text-primary-600">Lecture</span>
				</div>

				<div class="prose prose-sm max-w-none text-primary-900">
					<p class="mb-6 text-lg leading-relaxed text-primary-700">
						Cette histoire est actuellement en cours de création. Le contenu sera bientôt disponible
						et géré depuis Builder.io CMS.
					</p>

					<div class="rounded-lg border-2 border-dashed border-primary-300 bg-primary-50 p-8 text-center">
						<svg
							class="mx-auto h-12 w-12 text-primary-300 mb-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 6v6m0 0v6m0-6h6m0 0h6m0-6v6m0-6h-6m0 0H6m0 6v-6m0 6h6"
							/>
						</svg>
						<h2 class="mb-2 font-serif text-xl font-semibold text-primary-900">
							Contenu à Compléter
						</h2>
						<p class="text-primary-700 mb-4">
							Continuez à parcourir nos autres histoires ou revenez plus tard pour découvrir le contenu
							complet de cette section.
						</p>
						<a
							href="/histoires"
							class="inline-block rounded-lg bg-primary-900 px-6 py-2 font-semibold text-cream transition-colors hover:bg-primary-800"
						>
							Voir toutes les histoires
						</a>
					</div>
				</div>
			</article>
		</div>
	</section>
</div>
