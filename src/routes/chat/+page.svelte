<script lang="ts">
	import { onMount } from 'svelte';

	interface ChatMessage {
		id: string;
		type: 'user' | 'assistant';
		content: string;
		timestamp: Date;
	}

	let messages: ChatMessage[] = [
		{
			id: '1',
			type: 'assistant',
			content:
				'Bonjour ! Je suis votre assistant IA spécialisé dans l\'histoire de votre famille. N\'hésitez pas à me poser des questions sur nos ancêtres, nos traditions, et les événements importants qui ont marqué notre histoire. Je suis ici pour vous aider à explorer notre héritage familial.',
			timestamp: new Date()
		}
	];

	let messageInput = '';
	let isLoading = false;
	let chatContainer: HTMLDivElement;

	function handleSendMessage() {
		if (!messageInput.trim()) return;

		// Add user message
		const userMessage: ChatMessage = {
			id: Date.now().toString(),
			type: 'user',
			content: messageInput,
			timestamp: new Date()
		};

		messages = [...messages, userMessage];
		messageInput = '';
		isLoading = true;

		// Simulate API response
		setTimeout(() => {
			const assistantMessage: ChatMessage = {
				id: (Date.now() + 1).toString(),
				type: 'assistant',
				content:
					'Merci pour votre question ! En attente de la configuration de l\'API. Cette section sera bientôt connectée à notre système IA pour répondre en temps réel à vos questions sur l\'histoire familiale.',
				timestamp: new Date()
			};

			messages = [...messages, assistantMessage];
			isLoading = false;

			// Auto-scroll to bottom
			if (chatContainer) {
				setTimeout(() => {
					chatContainer.scrollTop = chatContainer.scrollHeight;
				}, 0);
			}
		}, 1000);
	}

	onMount(() => {
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	});
</script>

<div class="flex min-h-screen flex-col bg-gradient-warm">
	<!-- Header -->
	<section class="border-b border-primary-200 px-4 py-8 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-4xl">
			<h1 class="mb-2 font-serif text-3xl font-bold text-primary-900">Assistant Familial IA</h1>
			<p class="text-primary-700">
				Posez vos questions sur l'histoire de notre famille et explorez nos archives numériques
			</p>
		</div>
	</section>

	<!-- Chat Container -->
	<div class="flex flex-1 flex-col">
		<div
			bind:this={chatContainer}
			class="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8"
		>
			<div class="mx-auto max-w-2xl space-y-6">
				{#each messages as message (message.id)}
					<div
						class="flex gap-4"
						class:justify-end={message.type === 'user'}
					>
						{#if message.type === 'assistant'}
							<div class="flex-shrink-0">
								<div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-900 text-cream">
									<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
										<path d="M10 0a10 10 0 110 20 10 10 0 010-20zm0 2a8 8 0 100 16 8 8 0 000-16z" />
									</svg>
								</div>
							</div>
						{/if}

						<div
							class="flex max-w-xs flex-col"
							class:max-w-md={message.type === 'user'}
						>
							<div
								class="rounded-lg p-4"
								class:bg-white={message.type === 'assistant'}
								class:bg-primary-900={message.type === 'user'}
								class:text-primary-900={message.type === 'assistant'}
								class:text-cream={message.type === 'user'}
							>
								<p>{message.content}</p>
							</div>
							<span
								class="mt-1 text-xs text-primary-600"
								class:text-right={message.type === 'user'}
							>
								{message.timestamp.toLocaleTimeString('fr-FR', {
									hour: '2-digit',
									minute: '2-digit'
								})}
							</span>
						</div>

						{#if message.type === 'user'}
							<div class="flex-shrink-0">
								<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gold">
									<svg class="h-5 w-5 text-primary-900" fill="currentColor" viewBox="0 0 20 20">
										<path d="M10 0a10 10 0 110 20 10 10 0 010-20zm0 2a8 8 0 100 16 8 8 0 000-16z" />
									</svg>
								</div>
							</div>
						{/if}
					</div>
				{/each}

				{#if isLoading}
					<div class="flex gap-4">
						<div class="flex-shrink-0">
							<div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-900 text-cream">
								<svg class="h-5 w-5 animate-spin" fill="currentColor" viewBox="0 0 20 20">
									<path d="M10 0a10 10 0 110 20 10 10 0 010-20zm0 2a8 8 0 100 16 8 8 0 000-16z" />
								</svg>
							</div>
						</div>
						<div class="flex items-center gap-2 rounded-lg bg-white p-4 text-primary-900">
							<span class="animate-pulse">●</span>
							<span class="animate-pulse delay-100">●</span>
							<span class="animate-pulse delay-200">●</span>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Input Area -->
		<div class="border-t border-primary-200 bg-white px-4 py-6 sm:px-6 lg:px-8">
			<div class="mx-auto max-w-2xl">
				<form onsubmit={(e) => { e.preventDefault(); handleSendMessage(); }} class="flex gap-4">
					<input
						type="text"
						bind:value={messageInput}
						placeholder="Posez une question sur l'histoire de notre famille..."
						class="flex-1 rounded-lg border border-primary-300 bg-cream px-4 py-3 text-primary-900 placeholder-primary-600 outline-none transition-colors focus:border-primary-900 focus:bg-white"
						disabled={isLoading}
					/>
					<button
						type="submit"
						disabled={isLoading || !messageInput.trim()}
						class="rounded-lg bg-primary-900 px-6 py-3 font-semibold text-cream transition-all hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
							<path
								d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5.951-2.975 5.951 2.975a1 1 0 001.169-1.409l-7-14z"
							/>
						</svg>
					</button>
				</form>
			</div>
		</div>
	</div>
</div>

<style>
	.delay-100 {
		animation-delay: 0.1s;
	}

	.delay-200 {
		animation-delay: 0.2s;
	}
</style>
