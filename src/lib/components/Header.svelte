<script lang="ts">
	interface HeaderLink {
		label: string;
		url: string;
		ariaLabel?: string;
	}

	let {
		logo = 'Histoire de Famille',
		links = []
	} = $props<{
		logo?: string | null;
		links?: HeaderLink[] | null;
	}>();

	let isMenuOpen = $state(false);

	// Safe getters with defaults
	const headerLogo = logo || 'Histoire de Famille';
	const headerLinks = (links && Array.isArray(links) && links.length > 0) ? links : [];
</script>

<nav class="sticky top-0 z-50 bg-white shadow-sm border-b border-primary-100">
	<div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
		<!-- Logo/Title -->
		<a href="/" class="flex items-center gap-2">
			<span class="hidden text-lg font-medium text-primary-800 sm:inline">{headerLogo}</span>
		</a>

		<!-- Desktop Navigation -->
		<div class="hidden items-center gap-8 md:flex">
			{#each headerLinks as link (link.url)}
				<a
					href={link.url}
					aria-label={link.ariaLabel || link.label}
					class="text-primary-800 transition-colors hover:text-accent"
				>
					{link.label}
				</a>
			{/each}
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
				{#each headerLinks as link (link.url)}
					<a
						href={link.url}
						aria-label={link.ariaLabel || link.label}
						class="text-primary-800 transition-colors hover:text-accent"
						onclick={() => (isMenuOpen = false)}
					>
						{link.label}
					</a>
				{/each}
			</div>
		</div>
	{/if}
</nav>
