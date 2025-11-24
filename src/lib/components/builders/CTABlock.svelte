<script lang="ts">
	import { resolve } from '$app/paths';
	// Use $props with an explicit inline type so the component stays in
	// runes mode (Svelte 5) and editors understand the prop types.
	let {
		title = 'Vous Avez des Questions ?',
		description = 'Explorez nos archives complètes grâce à notre assistant IA.',
		buttonText = "Accéder à l'Assistant IA",
		buttonLink = '/chat'
	} = $props<{
		title?: string;
		description?: string;
		buttonText?: string;
		buttonLink?: string;
	}>();
</script>

<section class="bg-primary-700 px-4 py-20 text-center sm:px-6 lg:px-8">
	<div class="mx-auto max-w-4xl">
		<h2 class="mb-6 font-serif text-3xl font-medium text-white">{title}</h2>
		<p class="mb-8 text-lg text-white/70">
			{description}
		</p>
		<a
			href={resolve(buttonLink as any)}
			class="inline-block rounded-lg bg-accent px-8 py-4 font-semibold text-white transition-all hover:scale-105 hover:shadow-lg"
		>
			{buttonText}
		</a>
	</div>
</section>
