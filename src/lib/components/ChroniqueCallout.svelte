<script lang="ts">
	import type { Chronique } from '#lib/server/builder.js';

	let { chroniques }: { chroniques: Chronique[] } = $props();
</script>

{#if chroniques.length > 0}
	<aside class="mx-auto max-w-4xl px-4 pb-10 sm:px-6 lg:px-8" aria-label="Chroniques associées">
		<div
			class="rounded-xl border border-accent/30 bg-accent/10 p-5 sm:flex sm:items-center sm:justify-between sm:gap-6"
		>
			<div>
				<p class="text-sm font-semibold uppercase tracking-widest text-accent">
					À lire dans son contexte
				</p>
				<h2 class="mt-1 font-serif text-xl font-semibold text-primary-900">
					Voir cet article dans sa chronique complète
				</h2>
			</div>
			<nav
				class="mt-4 flex flex-col gap-2 sm:mt-0 sm:items-end"
				aria-label="Chroniques contenant cet article"
			>
				{#each chroniques as chronique (chronique.id)}
					<a
						href={`/chroniques/${chronique.handle}`}
						class="inline-flex items-center gap-2 font-semibold text-accent transition-colors hover:text-accent/80"
					>
						{chronique.title}
						<svg
							class="h-4 w-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5l7 7-7 7"
							/>
						</svg>
					</a>
				{/each}
			</nav>
		</div>
	</aside>
{/if}
