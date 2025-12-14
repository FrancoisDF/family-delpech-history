<script lang="ts">
	import { isSectionCompleted, markSectionCompleted, unmarkSectionCompleted } from '$lib/progress';
	import BlogPostCard from './BlogPostCard.svelte';

	interface BlogPost {
		id: string;
		title: string;
		excerpt?: string;
		date?: string;
		readTime?: string;
		featuredImage?: string;
		category?: string;
		slug?: string;
		handle?: string;
	}

	interface Props {
		id?: string;
		title?: string;
		description?: string;
		audioUrl?: string;
		year?: number;
		isActive?: boolean;
		tags?: string[];
		availablePosts?: BlogPost[];
	}

	let {
		id = '',
		title = '',
		description = '',
		audioUrl = '',
		year = 1800,
		isActive = false,
		tags = [],
		availablePosts = []
	} = $props();

	let isCompleted: boolean = $state(false);
	let isExpanded: boolean = $state(false);

	function handleAudioEnded() {
		markSectionCompleted(id);
		isCompleted = true;
	}

	function toggleCompletion() {
		if (isCompleted) {
			unmarkSectionCompleted(id);
			isCompleted = false;
		} else {
			markSectionCompleted(id);
			isCompleted = true;
		}
	}

	function toggleExpand() {
		isExpanded = !isExpanded;
	}

	function getFilteredPosts() {
		if (tags.length === 0 || availablePosts.length === 0) {
			return [];
		}
		const normalizedTags = tags.map((tag) => tag.toLowerCase().trim());
		return availablePosts.filter((post) => {
			if (!post.category) return false;
			const postCategory = post.category.toLowerCase().trim();
			return normalizedTags.some((tag) => postCategory === tag || postCategory.includes(tag));
		});
	}

	$effect(() => {
		isCompleted = isSectionCompleted(id);
	});
</script>

<div
	class={`group relative rounded-2xl p-8 transition-all md:p-12 ${
		isActive
			? 'border-2 border-accent bg-primary-50 shadow-xl'
			: isCompleted
				? 'border-2 border-accent/30 bg-white shadow-lg hover:shadow-2xl'
				: 'border-2 border-transparent bg-white shadow-lg hover:shadow-2xl'
	}`}
>
	<!-- Timeline Indicator with Completion Status -->
	<div
		class="absolute -left-4 top-4 flex flex-col items-center gap-2 sm:-left-6 sm:top-1/2 sm:-translate-y-1/2 md:top-1/2"
	>
		<button
			onclick={toggleCompletion}
			class={`flex h-7 w-7 items-center justify-center rounded-full transition-all sm:h-8 sm:w-8 ${
				isCompleted
					? 'bg-accent text-white shadow-md'
					: 'border-2 border-primary-300 bg-white hover:border-accent'
			}`}
			type="button"
			aria-label={isCompleted ? 'Marquer comme non écouté' : 'Marquer comme écouté'}
		>
			{#if isCompleted}
				<svg class="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
						clip-rule="evenodd"
					/>
				</svg>
			{/if}
		</button>
		<div
			class="rounded-lg bg-primary-800 px-2 py-0.5 text-xs font-medium text-white sm:px-3 sm:py-1"
		>
			{year}
		</div>
	</div>

	<div class="pl-10 sm:pl-12 md:pl-12">
		<div class="mb-4 flex items-start justify-between">
			<h3 class="font-serif text-3xl font-medium text-primary-800">{title}</h3>
			{#if isCompleted}
				<div class="ml-4 flex-shrink-0">
					<div class="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
						<svg class="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>
				</div>
			{/if}
		</div>

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
				<audio
					{id}
					class="w-full accent-primary-800"
					controls
					controlsList="nodownload"
					onended={handleAudioEnded}
				>
					<source src={audioUrl} type="audio/mpeg" />
					Votre navigateur ne supporte pas l'élément audio.
				</audio>
			</div>
		{/if}

		<!-- Learn More Section -->
		{#if tags.length > 0 && availablePosts.length > 0}
			<div class="mt-8 border-t border-primary-200 pt-8">
				<button
					onclick={toggleExpand}
					class="mb-6 inline-flex items-center gap-3 rounded-lg bg-accent px-6 py-3 font-semibold text-white transition-all hover:shadow-lg"
					type="button"
					aria-expanded={isExpanded}
					aria-label="Toggle related blog posts"
				>
					<span>En savoir plus</span>
					<svg
						class={`h-5 w-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 14l-7 7m0 0l-7-7m7 7V3"
						/>
					</svg>
				</button>

				{#if isExpanded}
					<div class="space-y-6">
						<div class="mb-4">
							<h4 class="text-lg font-semibold text-primary-800">Articles Connexes</h4>
							<p class="text-sm text-primary-600">
								Articles associés aux thèmes : {tags.join(', ')}
							</p>
						</div>

						{#if getFilteredPosts().length > 0}
							<div
								class="grid gap-6 sm:grid-cols-1 md:grid-cols-2"
							>
								{#each getFilteredPosts() as post (post.id)}
									<BlogPostCard
										id={post.id}
										handle={post.handle || post.slug || ''}
										title={post.title}
										excerpt={post.excerpt || ''}
										date={post.date || ''}
										readTime={post.readTime || ''}
										featuredImage={post.featuredImage || ''}
										category={post.category || ''}
									/>
								{/each}
							</div>
						{:else}
							<div class="rounded-lg border-2 border-dashed border-primary-200 bg-primary-50 p-6 text-center">
								<p class="text-primary-700">Aucun article disponible pour ces thèmes.</p>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
