<script lang="ts">
	let {
		title = '',
		content = '',
		type = 'info',
		icon = 'info',
		connectTop = false,
		connectBottom = false
	} = $props();

	const spacingTop = connectTop ? '' : 'pt-8';
	const spacingBottom = connectBottom ? '' : 'pb-8';
	
	const typeStyles = {
		info: 'bg-blue-50 border-blue-300 text-blue-900',
		warning: 'bg-amber-50 border-amber-300 text-amber-900',
		success: 'bg-green-50 border-green-300 text-green-900',
		tip: 'bg-accent/10 border-accent text-primary-900'
	};
	
	const iconPaths = {
		info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
		warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
		success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
		lightbulb: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
	};
</script>

<section class="bg-gradient-warm px-4 {spacingTop} {spacingBottom} sm:px-6 lg:px-8">
	<div class="mx-auto max-w-4xl">
		<div class="rounded-xl border-2 p-6 {typeStyles[type]} md:p-8">
			<div class="flex gap-4">
				<div class="flex-shrink-0">
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={iconPaths[icon]} />
					</svg>
				</div>
				<div class="flex-1">
					{#if title}
						<h3 class="mb-2 font-serif text-xl font-bold">
							{title}
						</h3>
					{/if}
					{#if content}
						<div class="leading-relaxed whitespace-pre-wrap">
							{content}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</section>
