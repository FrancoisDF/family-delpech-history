<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchBuilderContent } from '$lib/builder';
	import StorySectionCard from '$lib/components/StorySectionCard.svelte';

	interface StorySection {
		id: string;
		title: string;
		description: string;
		audioUrl: string;
		year: number;
	}

	let storySections: StorySection[] = [
		{
			id: '1',
			title: 'Les Débuts - 1800',
			description:
				'Le commencement de notre lignée au tournant du XIXe siècle. Une époque de changements et de nouvelles opportunités qui ont façonné le destin de notre famille.',
			audioUrl: '/audio/section-1.mp3',
			year: 1800
		},
		{
			id: '2',
			title: 'L\'Expansion - 1830',
			description:
				'Durant les années 1830, notre famille s\'est étendue à travers plusieurs régions de France. Les mariages et les alliances ont consolidé notre position dans la société.',
			audioUrl: '/audio/section-2.mp3',
			year: 1830
		},
		{
			id: '3',
			title: 'Les Voyages - 1850',
			description:
				'Les aventures transatlantiques et les voyages d\'Angleterre ont marqué cette période. Des histoires de courage et de découverte qui ont inspiré les générations futures.',
			audioUrl: '/audio/section-3.mp3',
			year: 1850
		},
		{
			id: '4',
			title: 'L\'Age d\'Or - 1870',
			description:
				'Une période de prospérité et de raffinement culturel. Les dîners de prestige et les rencontres avec les personnalités influentes de l\'époque ont marqué cette ère.',
			audioUrl: '/audio/section-4.mp3',
			year: 1870
		},
		{
			id: '5',
			title: 'L\'Héritage - 1900',
			description:
				'À l\'aube du nouveau siècle, notre famille a consolidé son héritage. Les traditions établies durant le XIXe siècle continuent à nous guider.',
			audioUrl: '/audio/section-5.mp3',
			year: 1900
		}
	];

	let activeAudio: string | null = null;

	onMount(async () => {
		// Fetch story sections from Builder.io
		try {
			const builderSections = await fetchBuilderContent('story-section');
			if (builderSections && builderSections.length > 0) {
				storySections = builderSections.map((section: any) => ({
					id: section.id,
					title: section.data?.title || '',
					description: section.data?.description || '',
					audioUrl: section.data?.audioUrl || '',
					year: section.data?.year || 1800
				}));
			}
		} catch (error) {
			console.error('Error fetching story sections from Builder.io:', error);
		}

		// Handle audio playback
		const audioElements = document.querySelectorAll('audio');
		audioElements.forEach((audio) => {
			audio.addEventListener('play', () => {
				audioElements.forEach((other) => {
					if (other !== audio) other.pause();
				});
				activeAudio = audio.id;
			});
		});
	});
</script>

<div class="relative">
	<!-- Parallax Background -->
	<div
		class="parallax-bg absolute inset-0"
		style="background-image: url('https://upload.wikimedia.org/wikipedia/commons/a/a1/Ex_libris_Delpech_de_Frayssinet.jpg');"
	></div>

	<!-- Dark Overlay for Text Readability -->
	<div class="absolute inset-0 bg-black/40"></div>

	<!-- Content Container -->
	<div class="relative z-10">
		<!-- Hero Section - Full Screen -->
		<section class="relative overflow-hidden flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-4xl text-center">
			<h1 class="mb-6 font-serif text-5xl font-bold tracking-tight text-cream md:text-6xl lg:text-7xl">
				Histoire de Famille
			</h1>
			<p class="mb-8 text-xl leading-relaxed text-cream/90 md:text-2xl lg:text-3xl">
				Découvrez les histoires fascinantes de notre famille à travers deux siècles d'histoire.
				Des souvenirs préservés, des voix enregistrées, et des secrets révélés.
			</p>
			<div class="flex flex-col sm:flex-row justify-center gap-4">
				<a
					href="/histoires"
					class="inline-block rounded-lg bg-gold px-8 py-3 font-semibold text-primary-900 transition-colors hover:bg-gold/90"
				>
					Lire les Histoires
				</a>
				<a
					href="/chat"
					class="inline-block rounded-lg border-2 border-cream px-8 py-3 font-semibold text-cream transition-colors hover:bg-cream hover:text-primary-900"
				>
					Poser une Question
				</a>
			</div>
		</div>
	</section>

		<!-- Storytelling Sections -->
		<section class="px-4 py-24 sm:px-6 lg:px-8 bg-gradient-warm">
		<div class="mx-auto max-w-5xl">
			<h2 class="mb-16 text-center font-serif text-4xl font-bold text-primary-900">
				Un Voyage à Travers le Temps
			</h2>

			<div class="space-y-16">
				{#each storySections as section (section.id)}
					<div class="group relative rounded-2xl bg-white p-8 shadow-lg transition-all hover:shadow-2xl md:p-12">
						<!-- Timeline Year Indicator -->
						<div
							class="absolute -left-4 top-1/2 hidden -translate-y-1/2 transform md:flex md:flex-col md:items-center"
						>
							<div class="h-2 w-2 rounded-full bg-gold"></div>
							<div class="mt-2 rounded-lg bg-primary-900 px-3 py-1 text-xs font-bold text-cream">
								{section.year}
							</div>
						</div>

						<div class="md:pl-12">
							<h3 class="mb-4 font-serif text-3xl font-bold text-primary-900">{section.title}</h3>

							<p class="mb-8 text-lg leading-relaxed text-primary-700">{section.description}</p>

							<!-- Audio Player -->
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
									id={section.id}
									class="w-full accent-primary-900"
									controls
									controlsList="nodownload"
								>
									<source src={section.audioUrl} type="audio/mpeg" />
									Votre navigateur ne supporte pas l'élément audio.
								</audio>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

		<!-- Call to Action Section -->
		<section class="bg-primary-900 px-4 py-20 text-center sm:px-6 lg:px-8">
		<div class="mx-auto max-w-2xl">
			<h2 class="mb-6 font-serif text-3xl font-bold text-cream">Vous Avez des Questions ?</h2>
			<p class="mb-8 text-lg text-cream/80">
				Explorez nos archives complètes grâce à notre assistant IA. Posez toutes vos questions sur
				l'histoire de notre famille.
			</p>
			<a
				href="/chat"
				class="inline-block rounded-lg bg-gold px-8 py-4 font-semibold text-primary-900 transition-all hover:scale-105 hover:shadow-lg"
			>
				Accéder à l'Assistant IA
			</a>
		</div>
	</section>

		<!-- Interesting Facts Section -->
		<section class="px-4 py-20 sm:px-6 lg:px-8 bg-gradient-warm">
			<div class="mx-auto max-w-5xl">
				<h2 class="mb-12 text-center font-serif text-3xl font-bold text-primary-900">
					Faits Intéressants
				</h2>
				<div class="grid gap-8 md:grid-cols-3">
					<div class="rounded-xl bg-white p-8 text-center shadow-md">
						<div class="mb-4 text-4xl font-bold text-gold">50</div>
						<h3 class="mb-2 font-serif font-semibold text-primary-900">Livres Historiques</h3>
						<p class="text-primary-700">Explorez 50 livres d'histoire familiale du XIXe siècle</p>
					</div>
					<div class="rounded-xl bg-white p-8 text-center shadow-md">
						<div class="mb-4 text-4xl font-bold text-gold">100</div>
						<h3 class="mb-2 font-serif font-semibold text-primary-900">Ans d'Histoire</h3>
						<p class="text-primary-700">De 1800 à 1900, un siècle de souvenirs préservés</p>
					</div>
					<div class="rounded-xl bg-white p-8 text-center shadow-md">
						<div class="mb-4 text-4xl font-bold text-gold">∞</div>
						<h3 class="mb-2 font-serif font-semibold text-primary-900">Générations</h3>
						<p class="text-primary-700">Une héritage transmis à travers les générations</p>
					</div>
				</div>
			</div>
		</section>
	</div>
</div>
