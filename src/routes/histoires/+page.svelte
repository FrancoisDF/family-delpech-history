<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchBuilderContent } from '$lib/builder';
	import BlogPostCard from '$lib/components/BlogPostCard.svelte';

	interface BlogPost {
		id: string;
		title: string;
		excerpt: string;
		date: string;
		readTime: string;
		featuredImage?: string;
		category?: string;
	}

	let blogPosts: BlogPost[] = [
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

	onMount(async () => {
		// Fetch blog posts from Builder.io
		try {
			const builderPosts = await fetchBuilderContent('blog-post');
			if (builderPosts && builderPosts.length > 0) {
				blogPosts = builderPosts.map((post: any) => ({
					id: post.id,
					title: post.data?.title || '',
					excerpt: post.data?.excerpt || '',
					date: post.data?.date || '',
					readTime: post.data?.readTime || '',
					featuredImage: post.data?.featuredImage,
					category: post.data?.category
				}));
			}
		} catch (error) {
			console.error('Error fetching blog posts from Builder.io:', error);
		}
	});
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
					<BlogPostCard
						id={post.id}
						title={post.title}
						excerpt={post.excerpt}
						date={post.date}
						readTime={post.readTime}
						featuredImage={post.featuredImage || ''}
						category={post.category || ''}
					/>
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
