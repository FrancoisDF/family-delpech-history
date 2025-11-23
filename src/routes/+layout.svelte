<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import type { LayoutData } from './$types';

	let { data, children } = $props<{ data: LayoutData; children: any }>();

	// Default fallback config
	interface SiteConfig {
		siteName?: string;
		headerLogo?: string;
		headerLinks?: Array<{ label: string; url: string; ariaLabel?: string }>;
		footerDescription?: string;
		footerLinks?: Array<{ label: string; url: string }>;
		footerInfoTitle?: string;
		footerInfoLinks?: Array<{ label: string; url: string }>;
		footerCopyright?: string;
	}

	const defaultConfig: SiteConfig = {
		siteName: 'Histoire de Famille',
		headerLogo: 'Histoire de Famille',
		headerLinks: [
			{ label: 'Accueil', url: '/', ariaLabel: 'Retour à la page d\'accueil' },
			{ label: 'Histoires', url: '/histoires', ariaLabel: 'Voir toutes les histoires' },
			{ label: 'Questions', url: '/chat', ariaLabel: 'Poser une question à notre assistant' }
		],
		footerDescription: 'Découvrez les histoires et les secrets de notre famille à travers 50 livres d\'histoire familiale du XIXe siècle.',
		footerLinks: [
			{ label: 'Accueil', url: '/' },
			{ label: 'Histoires', url: '/histoires' },
			{ label: 'Questions', url: '/chat' }
		],
		footerInfoTitle: 'Informations',
		footerInfoLinks: [
			{ label: 'Conditions d\'utilisation', url: '#' },
			{ label: 'Confidentialité', url: '#' },
			{ label: 'Contact', url: '#' }
		],
		footerCopyright: '© 2024 Histoire de Famille. Tous droits réservés.'
	};

	// Merge server-loaded config with defaults to ensure all fields are present
	const config: SiteConfig = {
		...defaultConfig,
		...(data.siteConfig || {})
	};
</script>

<div class="flex min-h-screen flex-col">
	<!-- Header -->
	<Header
		logo={config.headerLogo ?? defaultConfig.headerLogo}
		links={config.headerLinks ?? defaultConfig.headerLinks}
	/>

	<!-- Main Content -->
	<main class="flex-1">
		{@render children()}
	</main>

	<!-- Footer -->
	<Footer
		siteName={config.siteName ?? defaultConfig.siteName}
		description={config.footerDescription ?? defaultConfig.footerDescription}
		navigationLinks={config.footerLinks ?? defaultConfig.footerLinks}
		infoTitle={config.footerInfoTitle ?? defaultConfig.footerInfoTitle}
		infoLinks={config.footerInfoLinks ?? defaultConfig.footerInfoLinks}
		copyright={config.footerCopyright ?? defaultConfig.footerCopyright}
	/>
</div>

<style>
	:global(html) {
		@apply scroll-smooth;
	}
</style>
