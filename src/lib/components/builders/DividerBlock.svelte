<script lang="ts">
	let {
		style = 'solid',
		thickness = 'medium',
		spacing = 'medium'
	} = $props();
	
	const spacingClasses = {
		small: 'py-4',
		medium: 'py-8',
		large: 'py-12'
	};
	
	const thicknessClasses = {
		thin: 'border-t',
		medium: 'border-t-2',
		thick: 'border-t-4'
	};
</script>

<section class="bg-gradient-warm px-4 {spacingClasses[spacing]} sm:px-6 lg:px-8">
	<div class="mx-auto max-w-4xl">
		{#if style === 'solid'}
			<hr class="{thicknessClasses[thickness]} border-primary-300" />
		{:else if style === 'dashed'}
			<hr class="{thicknessClasses[thickness]} border-dashed border-primary-300" />
		{:else if style === 'decorative'}
			<div class="flex items-center justify-center">
				<div class="flex gap-2">
					<span class="h-2 w-2 rounded-full bg-accent"></span>
					<span class="h-2 w-2 rounded-full bg-accent"></span>
					<span class="h-2 w-2 rounded-full bg-accent"></span>
				</div>
			</div>
		{/if}
	</div>
</section>
