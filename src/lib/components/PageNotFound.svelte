<script lang="ts">
	import { resolve } from '$app/paths';
	// Svelte 5 runes: use $props() for component props
	let {
		title = 'Page non trouvée',
		message = 'Désolé, la page demandée est introuvable.',
		ctaText = "Retour à l'accueil",
		ctaHref = '/'
	}: { title?: string; message?: string; ctaText?: string; ctaHref?: string } = $props();
</script>

<section class="flex min-h-screen items-center justify-center  px-4 py-16">
	<div class="mx-auto max-w-3xl text-center">
		<h1 class="mb-4 font-serif text-4xl font-bold text-primary-900">{title}</h1>
		<p class="mb-6 text-lg text-primary-800">{message}</p>
		<a
			href={resolve(ctaHref as any)}
			class="inline-block rounded-lg bg-primary-700 px-6 py-3 font-semibold text-white hover:bg-primary-800"
			>{ctaText}</a
		>
	</div>
</section>
