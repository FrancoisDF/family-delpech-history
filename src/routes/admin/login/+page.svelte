<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form } = $props<{ form: ActionData }>();
</script>

<svelte:head>
	<title>Admin - Connexion</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
	<div class="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-lg">
		<div class="mb-6 text-center">
			<h1 class="font-serif text-2xl font-bold text-slate-900">Administration</h1>
			<p class="mt-1 text-sm text-slate-500">Connectez-vous pour acceder a la console.</p>
		</div>

		{#if form?.error}
			<div class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
				{form.error}
			</div>
		{/if}

		<form method="POST" use:enhance class="space-y-4">
			<div>
				<label for="password" class="mb-1 block text-sm font-semibold text-slate-700">
					Mot de passe
				</label>
				<input
					id="password"
					name="password"
					type="password"
					autocomplete="current-password"
					required
					class="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 outline-none focus:border-slate-700 focus:ring-1 focus:ring-slate-700"
					placeholder="Entrez le mot de passe"
				/>
			</div>

			<button
				type="submit"
				class="w-full rounded-lg bg-slate-900 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-slate-800"
			>
				Se connecter
			</button>
		</form>
	</div>
</div>
