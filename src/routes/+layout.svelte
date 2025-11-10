<script lang="ts">
	import '../app.css';

	let { children } = $props();
	let isMenuOpen = $state(false);
</script>

<div class="flex min-h-screen flex-col">
	<!-- Navigation -->
	<nav class="sticky top-0 z-50 bg-white shadow-sm border-b border-primary-100">
		<div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
			<!-- Logo/Title -->
			<a href="/" class="flex items-center gap-2">
				<div class="rounded-lg bg-gold px-3 py-2">
					<span class="font-serif text-xl font-bold text-primary-900">Famille</span>
				</div>
				<span class="hidden text-lg font-medium text-primary-800 sm:inline">Histoire de Famille</span>
			</a>

			<!-- Desktop Navigation -->
			<div class="hidden items-center gap-8 md:flex">
				<a href="/" class="text-cream transition-colors hover:text-gold">Accueil</a>
				<a href="/histoires" class="text-cream transition-colors hover:text-gold">Histoires</a>
				<a href="/chat" class="text-cream transition-colors hover:text-gold">Questions</a>
			</div>

			<!-- Mobile Menu Button -->
			<button
				class="md:hidden"
				onclick={() => (isMenuOpen = !isMenuOpen)}
				aria-label="Toggle menu"
			>
				<svg class="h-6 w-6 text-primary-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
					/>
				</svg>
			</button>
		</div>

		<!-- Mobile Navigation -->
		{#if isMenuOpen}
			<div class="border-t border-primary-100 bg-primary-50 px-4 py-4 md:hidden">
				<div class="flex flex-col gap-4">
					<a
						href="/"
						class="text-primary-800 transition-colors hover:text-accent"
						onclick={() => (isMenuOpen = false)}
					>
						Accueil
					</a>
					<a
						href="/histoires"
						class="text-primary-800 transition-colors hover:text-accent"
						onclick={() => (isMenuOpen = false)}
					>
						Histoires
					</a>
					<a
						href="/chat"
						class="text-primary-800 transition-colors hover:text-accent"
						onclick={() => (isMenuOpen = false)}
					>
						Questions
					</a>
				</div>
			</div>
		{/if}
	</nav>

	<!-- Main Content -->
	<main class="flex-1">
		{@render children()}
	</main>

	<!-- Footer -->
	<footer class="bg-primary-900 text-cream">
		<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
			<div class="grid grid-cols-1 gap-8 md:grid-cols-3">
				<div>
					<h3 class="mb-4 font-serif text-lg font-semibold">Histoire de Famille</h3>
					<p class="text-sm text-cream/70">
						Découvrez les histoires et les secrets de notre famille à travers 50 livres d'histoire
						familiale du XIXe siècle.
					</p>
				</div>
				<div>
					<h4 class="mb-4 font-serif font-semibold">Navigation</h4>
					<ul class="space-y-2 text-sm">
						<li><a href="/" class="text-cream/70 hover:text-gold">Accueil</a></li>
						<li><a href="/histoires" class="text-cream/70 hover:text-gold">Histoires</a></li>
						<li><a href="/chat" class="text-cream/70 hover:text-gold">Questions</a></li>
					</ul>
				</div>
				<div>
					<h4 class="mb-4 font-serif font-semibold">Informations</h4>
					<ul class="space-y-2 text-sm">
						<li><a href="#" class="text-cream/70 hover:text-gold">Conditions d'utilisation</a></li>
						<li><a href="#" class="text-cream/70 hover:text-gold">Confidentialité</a></li>
						<li><a href="#" class="text-cream/70 hover:text-gold">Contact</a></li>
					</ul>
				</div>
			</div>
			<div class="border-t border-primary-800 pt-8 text-center text-sm text-cream/50">
				<p>&copy; 2024 Histoire de Famille. Tous droits réservés.</p>
			</div>
		</div>
	</footer>
</div>

<style>
	:global(html) {
		@apply scroll-smooth;
	}
</style>
