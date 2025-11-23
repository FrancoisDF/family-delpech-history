<script lang="ts">
	interface FooterLink {
		label: string;
		url: string;
	}

	let {
		siteName = 'Histoire de Famille',
		description = '',
		navigationLinks = [],
		infoTitle = 'Informations',
		infoLinks = [],
		copyright = ''
	} = $props<{
		siteName?: string;
		description?: string;
		navigationLinks?: FooterLink[];
		infoTitle?: string;
		infoLinks?: FooterLink[];
		copyright?: string;
	}>();
</script>

<footer class="bg-primary-800 text-white">
	<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
		<div class="grid grid-cols-1 gap-8 md:grid-cols-3">
			<!-- About Section -->
			<div>
				<h3 class="mb-4 font-serif text-lg font-medium">{siteName}</h3>
				<p class="text-sm text-cream/70">
					{description}
				</p>
			</div>

			<!-- Navigation Links -->
			<div>
				<h4 class="mb-4 font-serif font-medium">Navigation</h4>
				<ul class="space-y-2 text-sm">
					{#each navigationLinks as link (link.url)}
						<li>
							<a href={link.url} class="text-white/70 hover:text-accent transition-colors">
								{link.label}
							</a>
						</li>
					{/each}
				</ul>
			</div>

			<!-- Info Links -->
			<div>
				<h4 class="mb-4 font-serif font-semibold">{infoTitle}</h4>
				<ul class="space-y-2 text-sm">
					{#each infoLinks as link (link.url)}
						<li>
							<a href={link.url} class="text-white/70 hover:text-accent transition-colors">
								{link.label}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		</div>

		<!-- Copyright -->
		<div class="border-t border-primary-700 pt-8 text-center text-sm text-white/50">
			<p>{copyright}</p>
		</div>
	</div>
</footer>
