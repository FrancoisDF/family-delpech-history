<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchBuilderContent } from '$lib/builder';
	import Timeline from '$lib/components/Timeline.svelte';

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

		// Handle exclusive audio playback
		const audioElements = document.querySelectorAll('audio');
		audioElements.forEach((audio) => {
			audio.addEventListener('play', () => {
				audioElements.forEach((other) => {
					if (other !== audio) other.pause();
				});
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

	<!-- Soft Overlay for Text Readability -->
	<div class="absolute inset-0 bg-black/25"></div>

	<!-- Content Container -->
	<div class="relative z-10">
		<!-- Hero Section - Full Screen -->
		<section class="relative overflow-hidden flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-4xl text-center">
			<h1 class="mb-6 font-serif text-5xl font-medium tracking-tight text-white md:text-6xl lg:text-7xl">
				Histoire de Famille
			</h1>
			<p class="mb-8 text-xl leading-relaxed text-white/80 md:text-2xl lg:text-3xl">
				Découvrez les histoires fascinantes de notre famille à travers deux siècles d'histoire.
				Des souvenirs préservés, des voix enregistrées, et des secrets révélés.
			</p>
			<div class="flex flex-col sm:flex-row justify-center gap-4">
				<a
					href="/histoires"
					class="inline-block rounded-lg bg-primary-700 px-8 py-3 font-semibold text-white transition-colors hover:bg-primary-800"
				>
					Lire les Histoires
				</a>
				<a
					href="/chat"
					class="inline-block rounded-lg border-2 border-white px-8 py-3 font-semibold text-white transition-colors hover:bg-white hover:text-primary-800"
				>
					Poser une Question
				</a>
			</div>
		</div>
	</section>

		<!-- Storytelling Sections - Timeline -->
		<section class="bg-gradient-warm">
			<div class="px-4 py-12 sm:px-6 lg:px-8">
				<div class="mx-auto max-w-5xl">
					<h2 class="mb-8 text-center font-serif text-4xl font-bold text-primary-900">
						Un Voyage à Travers le Temps
					</h2>
					<p class="mb-12 text-center text-lg text-primary-700">
						Écoutez et suivez votre progression à travers les différentes périodes de notre histoire
					</p>
				</div>
			</div>
			<Timeline sections={storySections} />
		</section>

		<!-- Call to Action Section -->
		<section class="bg-primary-700 px-4 py-20 text-center sm:px-6 lg:px-8">
		<div class="mx-auto max-w-2xl">
			<h2 class="mb-6 font-serif text-3xl font-medium text-white">Vous Avez des Questions ?</h2>
			<p class="mb-8 text-lg text-white/70">
				Explorez nos archives complètes grâce à notre assistant IA. Posez toutes vos questions sur
				l'histoire de notre famille.
			</p>
			<a
				href="/chat"
				class="inline-block rounded-lg bg-accent px-8 py-4 font-semibold text-white transition-all hover:scale-105 hover:shadow-lg"
			>
				Accéder à l'Assistant IA
			</a>
		</div>
	</section>

		<!-- Interesting Facts Section -->
		<section class="px-4 py-20 sm:px-6 lg:px-8 bg-gradient-warm">
			<div class="mx-auto max-w-5xl">
				<h2 class="mb-12 text-center font-serif text-3xl font-medium text-primary-800">
					Faits Intéressants
				</h2>
				<div class="grid gap-8 md:grid-cols-3">
					<div class="rounded-xl bg-white p-8 text-center shadow-sm">
						<div class="mb-4 text-4xl font-bold text-accent">50</div>
						<h3 class="mb-2 font-serif font-medium text-primary-800">Livres Historiques</h3>
						<p class="text-primary-600">Explorez 50 livres d'histoire familiale du XIXe siècle</p>
					</div>
					<div class="rounded-xl bg-white p-8 text-center shadow-sm">
						<div class="mb-4 text-4xl font-bold text-accent">100</div>
						<h3 class="mb-2 font-serif font-medium text-primary-800">Ans d'Histoire</h3>
						<p class="text-primary-600">De 1800 à 1900, un siècle de souvenirs préservés</p>
					</div>
					<div class="rounded-xl bg-white p-8 text-center shadow-sm">
						<div class="mb-4 text-4xl font-bold text-accent">∞</div>
						<h3 class="mb-2 font-serif font-medium text-primary-800">Générations</h3>
						<p class="text-primary-600">Une héritage transmis à travers les générations</p>
					</div>
				</div>
			</div>
		</section>
	</div>
</div>
