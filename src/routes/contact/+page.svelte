<script lang="ts">
	import { onMount } from 'svelte';
	import * as emailjs from '@emailjs/browser';
	interface FormData {
		name: string;
		email: string;
		phone: string;
		msg: string;
	}

	let form: FormData = $state({
		name: '',
		email: '',
		phone: '',
		msg: ''
	});

	let loading = $state(false);
	let success = $state(false);
	let error = $state(false);
	let errorMessage = $state('');
	let emailjsReady = $state(false);

	// Initialize EmailJS with your public key
	onMount(async () => {
		try {
			emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
			emailjsReady = true;
		} catch (err) {
			console.warn('EmailJS module not available. Install @emailjs/browser to enable email sending.');
			errorMessage = 'Le service d\'email n\'est pas configuré. Veuillez contacter l\'administrateur.';
		}
	});

	function validateForm(): boolean {
		if (!form.name.trim()) {
			errorMessage = 'Le nom est requis';
			return false;
		}
		if (!form.email.trim()) {
			errorMessage = 'L\'email est requis';
			return false;
		}
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(form.email)) {
			errorMessage = 'Veuillez entrer un email valide';
			return false;
		}
		if (!form.msg.trim()) {
			errorMessage = 'Le message est requis';
			return false;
		}
		return true;
	}

	async function handleSubmit() {
		loading = true;
		error = false;
		errorMessage = '';

		if (!validateForm()) {
			loading = false;
			error = true;
			setTimeout(() => {
				error = false;
			}, 3000);
			return;
		}

		if (!emailjsReady || !emailjs) {
			errorMessage = 'Le service d\'email n\'est pas disponible. Veuillez réessayer plus tard.';
			error = true;
			loading = false;
			setTimeout(() => {
				error = false;
			}, 3000);
			return;
		}

		try {
			const result = await emailjs.default.send(
				import.meta.env.VITE_EMAILJS_SERVICE_ID,
				import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
				{
					email: form.email,
					name: form.name,
					phone: form.phone || 'Non fourni',
					msg: form.msg
				},
				import.meta.env.VITE_EMAILJS_PUBLIC_KEY
			);

			if (result.status === 200) {
				form = { name: '', email: '', phone: '', msg: '' };
				success = true;
				setTimeout(() => {
					success = false;
				}, 5000);
			}
			console.log('Email sent successfully:', result.text);
			loading = false;
		} catch (err) {
			console.error('Failed to send email:', err);
			errorMessage = 'Erreur lors de l\'envoi de votre message. Veuillez réessayer.';
			error = true;
			setTimeout(() => {
				error = false;
			}, 3000);
			loading = false;
		}
	}
</script>

<div class="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
	<!-- Page Title -->
	<div class="mb-12 text-center">
		<h1 class="mb-4 font-serif text-4xl font-bold text-gray-900">Nous Contacter</h1>
		<p class="text-lg text-gray-600">
			Avez-vous des questions ? Nous serions heureux de vous entendre.
		</p>
	</div>

	<!-- Contact Form -->
	<div class="rounded-lg bg-white p-8 shadow-lg">
		{#if !emailjsReady}
			<div class="mb-6 rounded-md bg-yellow-50 p-4">
				<p class="text-sm text-yellow-700">
					Le service d'email est en cours de configuration. Veuillez patienter...
				</p>
			</div>
		{/if}

		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-6">
			<!-- Name Field -->
			<div>
				<label for="name" class="block text-sm font-medium text-gray-700">Nom</label>
				<input
					type="text"
					id="name"
					bind:value={form.name}
					placeholder="Votre nom"
					disabled={loading}
					class="mt-2 block w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
				/>
			</div>

			<!-- Email Field -->
			<div>
				<label for="email" class="block text-sm font-medium text-gray-700">Email</label>
				<input
					type="email"
					id="email"
					bind:value={form.email}
					placeholder="votre.email@example.com"
					disabled={loading}
					class="mt-2 block w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
				/>
			</div>

			<!-- Phone Field (Optional) -->
			<div>
				<label for="phone" class="block text-sm font-medium text-gray-700">
					Téléphone (optionnel)
				</label>
				<input
					type="tel"
					id="phone"
					bind:value={form.phone}
					placeholder="+33 6 12 34 56 78"
					disabled={loading}
					class="mt-2 block w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
				/>
			</div>

			<!-- Message Field -->
			<div>
				<label for="msg" class="block text-sm font-medium text-gray-700">Message</label>
				<textarea
					id="msg"
					bind:value={form.msg}
					placeholder="Votre message..."
					rows={6}
					disabled={loading}
					class="mt-2 block w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
				/>
			</div>

			<!-- Success Message -->
			{#if success}
				<div class="rounded-md bg-green-50 p-4">
					<p class="text-green-700">
						Merci ! Votre message a été envoyé avec succès. Nous vous répondrons bientôt.
					</p>
				</div>
			{/if}

			<!-- Error Message -->
			{#if error}
				<div class="rounded-md bg-red-50 p-4">
					<p class="text-red-700">{errorMessage}</p>
				</div>
			{/if}

			<!-- Submit Button -->
			<button
				type="submit"
				disabled={loading || success || !emailjsReady}
				class="w-full rounded-md bg-primary-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-400"
				title={!emailjsReady ? 'Service email non disponible - Veuillez installer @emailjs/browser' : ''}
			>
				{loading ? 'Envoi en cours...' : 'Envoyer le message'}
			</button>
		</form>
	</div>

	<!-- Contact Info Section -->
	<div class="mt-12 grid grid-cols-1 gap-8 md:grid-cols-1">
		<div class="text-center">
			<div class="mb-4 flex justify-center">
				<div class="rounded-lg bg-primary-100 p-3">
					<svg
						class="h-6 w-6 text-primary-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
						/>
					</svg>
				</div>
			</div>
			<h3 class="font-semibold text-gray-900">Email</h3>
			<p class="mt-2 text-gray-600">contact@histoiredefamille.fr</p>
		</div>
<!-- 
		<div class="text-center">
			<div class="mb-4 flex justify-center">
				<div class="rounded-lg bg-primary-100 p-3">
					<svg
						class="h-6 w-6 text-primary-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
						/>
					</svg>
				</div>
			</div>
			<h3 class="font-semibold text-gray-900">Téléphone</h3>
			<p class="mt-2 text-gray-600">+33 (0)1 23 45 67 89</p>
		</div>

		<div class="text-center">
			<div class="mb-4 flex justify-center">
				<div class="rounded-lg bg-primary-100 p-3">
					<svg
						class="h-6 w-6 text-primary-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
						/>
					</svg>
				</div>
			</div>
			<h3 class="font-semibold text-gray-900">Adresse</h3>
			<p class="mt-2 text-gray-600">123 Rue de la Famille<br />75000 Paris, France</p>
		</div>
		-->
	</div>
</div>
