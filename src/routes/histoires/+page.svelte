<script lang="ts">
	interface BlogPost {
		id: string;
		title: string;
		excerpt: string;
		date: string;
		readTime: string;
	}

	const blogPosts: BlogPost[] = [
		{
			id: '1',
			title: 'Le Grand Voyage de 1852 : De France en Angleterre',
			excerpt:
				'Découvrez le récit fascinant du voyage qui a changé le cours de notre histoire familiale.',
			date: '1852',
			readTime: '8 min'
		},
		{
			id: '2',
			title: 'Le Dîner Avec le Roi : Une Soirée Mémorable',
			excerpt:
				'Une nuit inoubliable à la cour royale qui a marqué le prestige de notre famille à jamais.',
			date: '1875',
			readTime: '6 min'
		},
		{
			id: '3',
			title: 'Les Secrets des Archives Familiales',
			excerpt:
				'Explorez les documents et lettres cachés qui révèlent les mystères de notre passé.',
			date: '1890',
			readTime: '10 min'
		}
	];
</script>

<div class="min-h-screen bg-gradient-warm">
	<!-- Page Header -->
	<section class="border-b border-primary-200 px-4 py-16 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-4xl text-center">
			<h1 class="mb-4 font-serif text-5xl font-bold text-primary-900">Histoires de Famille</h1>
			<p class="text-lg text-primary-700">
				Plongez dans les récits fascinants de nos ancêtres et découvrez les moments qui ont façonné
				notre histoire.
			</p>
		</div>
	</section>

	<!-- Blog Posts Grid -->
	<section class="px-4 py-16 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-4xl">
			<div class="space-y-8">
				{#each blogPosts as post (post.id)}
					<article
						class="group rounded-xl border border-primary-200 bg-white p-8 shadow-md transition-all hover:shadow-lg hover:border-gold"
					>
						<div class="mb-4 flex items-center gap-4">
							<span class="font-semibold text-primary-900">{post.date}</span>
							<span class="text-sm text-primary-600">•</span>
							<span class="text-sm text-primary-600">{post.readTime} de lecture</span>
						</div>
						<h2 class="mb-3 font-serif text-2xl font-bold text-primary-900 transition-colors group-hover:text-gold">
							{post.title}
						</h2>
						<p class="mb-6 text-primary-700">{post.excerpt}</p>
						<a
							href={`/histoires/${post.id}`}
							class="inline-block font-semibold text-primary-900 transition-colors hover:text-gold"
						>
							Lire l'article complet →
						</a>
					</article>
				{/each}
			</div>

			<!-- CMS Integration Notice -->
			<div class="mt-16 rounded-xl border-2 border-dashed border-primary-300 bg-primary-50 p-8 text-center">
				<h3 class="mb-2 font-serif text-xl font-semibold text-primary-900">
					Contenu Géré par Builder.io CMS
				</h3>
				<p class="text-primary-700">
					Cette section est gérée depuis Builder.io CMS pour faciliter la publication et la mise à jour
					des histoires familiales.
				</p>
			</div>
		</div>
	</section>
</div>
