<script lang="ts">
	import '../../app.css';
	import type { LayoutData } from './$types';

	let { data, children } = $props<{ data: LayoutData; children: any }>();
</script>

<div class="min-h-screen bg-slate-50">
	{@render children()}
</div>
