<script lang="ts">
	let {
		quote = '',
		author = '',
		authorTitle = '',
		style = 'centered',
		connectTop = false,
		connectBottom = false
	} = $props();

	const spacingTop = connectTop ? '' : 'pt-12';
	const spacingBottom = connectBottom ? '' : 'pb-12';
</script>

<section class="bg-gradient-warm px-4 {spacingTop} {spacingBottom} sm:px-6 lg:px-8">
	<div class="mx-auto max-w-4xl">
		{#if style === 'centered'}
			<blockquote class="rounded-xl bg-white p-8 text-center shadow-md md:p-12">
				<svg class="mx-auto mb-4 h-10 w-10 text-accent" fill="currentColor" viewBox="0 0 24 24">
					<path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
				</svg>
				<p class="mb-6 font-serif text-xl italic leading-relaxed text-primary-900 md:text-2xl">
					{quote}
				</p>
				{#if author}
					<footer class="mt-4">
						<p class="font-semibold text-primary-800">{author}</p>
						{#if authorTitle}
							<p class="text-sm text-primary-600">{authorTitle}</p>
						{/if}
					</footer>
				{/if}
			</blockquote>
		{:else}
			<div class="border-l-4 border-accent bg-white p-6 shadow-md md:p-8">
				<p class="mb-4 font-serif text-lg italic leading-relaxed text-primary-900 md:text-xl">
					"{quote}"
				</p>
				{#if author}
					<footer class="text-right">
						<p class="font-semibold text-primary-800">— {author}</p>
						{#if authorTitle}
							<p class="text-sm text-primary-600">{authorTitle}</p>
						{/if}
					</footer>
				{/if}
			</div>
		{/if}
	</div>
</section>
