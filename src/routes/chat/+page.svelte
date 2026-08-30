<script lang="ts">
	import { browser } from '$app/environment';
	import { tick } from 'svelte';

	interface ChatSource {
		id: string;
		title: string;
		url?: string;
		sourceType: string;
		score: number;
	}

	interface ChatMessage {
		id: string;
		type: 'user' | 'assistant';
		content: string;
		timestamp: Date;
		status?: 'loading' | 'streaming' | 'done' | 'error';
		sources?: ChatSource[];
	}

	interface StreamEvent {
		type: 'text' | 'done' | 'error';
		text?: string;
		message?: string;
		sources?: ChatSource[];
	}

	const DEFAULT_MESSAGE: ChatMessage = {
		id: 'welcome',
		type: 'assistant',
		content:
			"Bonjour ! Bienvenue dans l'archive familiale. Posez vos questions sur nos ancêtres, nos traditions et les événements importants de notre histoire. Je réponds uniquement à partir des documents retrouvés dans les archives.",
		timestamp: new Date(),
		status: 'done'
	};

	const STARTER_QUESTIONS = [
		'Qui était Marie Antoinette ?',
		'Quels étaient les métiers de nos ancêtres ?',
		'Où habitait la famille au 19ème siècle ?',
		'Raconte-moi une anecdote sur la famille.'
	];

	const FOLLOW_UP_SUGGESTIONS = [
		"Peux-tu m'en dire plus ?",
		'Quelles sont les sources de cette information ?',
		"Y a-t-il d'autres documents à ce sujet ?",
		'Qui d’autre est mentionné ?'
	];

	function loadMessages(): ChatMessage[] {
		if (!browser) return [DEFAULT_MESSAGE];
		try {
			const stored = sessionStorage.getItem('chatMessages');
			if (!stored) return [DEFAULT_MESSAGE];
			return (JSON.parse(stored) as ChatMessage[]).map((message) => ({
				...message,
				timestamp: new Date(message.timestamp)
			}));
		} catch {
			return [DEFAULT_MESSAGE];
		}
	}

	let messages = $state<ChatMessage[]>(loadMessages());
	let messageInput = $state('');
	let isLoading = $state(false);
	let inputElement = $state<HTMLInputElement>();

	function updateMessage(id: string, patch: Partial<ChatMessage>) {
		messages = messages.map((message) => (message.id === id ? { ...message, ...patch } : message));
	}

	async function scrollToResponse() {
		await tick();
		const lastAssistant = messages
			.slice()
			.reverse()
			.find((message) => message.type === 'assistant');
		if (lastAssistant) {
			document.querySelector(`[data-message-id="${lastAssistant.id}"]`)?.scrollIntoView({
			behavior: 'smooth',
			block: 'start'
		});
		}
	}

	async function readStream(response: Response, assistantId: string) {
		if (!response.body) throw new Error('Réponse vide du service.');
		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = '';
		let content = '';
		let completed = false;

		const processEvent = (line: string) => {
			if (!line.startsWith('data: ')) return;
			const raw = line.slice(6);
			if (raw === '[DONE]') return;
			const event = JSON.parse(raw) as StreamEvent;
			if (event.type === 'text' && event.text) {
				content += event.text;
				updateMessage(assistantId, { content, status: 'streaming' });
			} else if (event.type === 'done') {
				completed = true;
				updateMessage(assistantId, { status: 'done', sources: event.sources || [] });
			} else if (event.type === 'error') {
				throw new Error(event.message || 'La réponse n’a pas pu être générée.');
			}
		};

		while (true) {
			const { value, done } = await reader.read();
			buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
			const events = buffer.split('\n\n');
			buffer = events.pop() || '';
			for (const event of events) processEvent(event);
			if (done) break;
		}
		if (buffer.trim()) processEvent(buffer);
		if (!completed) throw new Error('La réponse a été interrompue. Veuillez réessayer.');
	}

	async function handleSendMessage(text?: string) {
		const content = (text ?? messageInput).trim();
		if (!content || isLoading) return;

		const history = messages
			.filter(
					(message) =>
						message.id !== 'welcome' && message.status !== 'loading' && message.status !== 'error'
				)
			.slice(-6)
			.map((message) => ({
				role: message.type,
				content: message.content
			}));
		const userMessage: ChatMessage = {
			id: crypto.randomUUID(),
			type: 'user',
			content,
			timestamp: new Date(),
			status: 'done'
		};
		const assistantId = crypto.randomUUID();
		messages = [
			...messages,
			userMessage,
			{
				id: assistantId,
				type: 'assistant',
				content: 'Je consulte les archives…',
				timestamp: new Date(),
				status: 'loading',
				sources: []
			}
		];
		messageInput = '';
		isLoading = true;
		await scrollToResponse();

		try {
			const response = await fetch('/api/ai-vercel-chat', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ message: content, history })
			});
			if (!response.ok) {
				const body = await response.json().catch(() => null);
					throw new Error(body?.message || 'Le service est momentanément indisponible.');
							}
			await readStream(response, assistantId);
		} catch (cause) {
			console.error('Chat request failed', cause);
			updateMessage(assistantId, {
				status: 'error',
				content: cause instanceof Error ? cause.message : 'La consultation a échoué. Veuillez réessayer.'
			});
		} finally {
			isLoading = false;
			await tick();
			inputElement?.focus();
		}
	}

	function clearChatHistory() {
		if (browser) sessionStorage.removeItem('chatMessages');
		messages = [DEFAULT_MESSAGE];
	}

	$effect(() => {
		if (browser) sessionStorage.setItem('chatMessages', JSON.stringify(messages));
	});
</script>

<svelte:head>
	<title>Assistant Familial IA - Histoire de Famille</title>
	<meta
		name="description"
		content="Posez vos questions sur l'histoire de notre famille et explorez nos archives numériques avec notre assistant IA."
	/>
</svelte:head>

<div class="flex min-h-screen flex-col">
	<section class="flex-shrink-0 border-b border-primary-200 px-4 py-8 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-4xl">
			<div class="flex items-start justify-between gap-4">
				<div>
					<h1 class="mb-2 font-serif text-3xl font-bold text-primary-900">Assistant Familial IA</h1>
					<p class="text-primary-700">
						Posez vos questions sur l'histoire de notre famille et explorez nos archives numériques.
					</p>
				</div>
				<button
					onclick={clearChatHistory}
					class="rounded-lg border border-primary-300 px-4 py-2 text-sm text-primary-700 transition-all hover:border-primary-500 hover:bg-primary-50"
				>
					+ Nouveau Chat
				</button>
			</div>
		</div>
	</section>

	<div class="chat-container flex-1 px-4 py-8 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-2xl space-y-6 pb-32">
			{#each messages as message, index (message.id)}
				<div data-message-id={message.id} class="flex gap-4" class:justify-end={message.type === 'user'}>
					{#if message.type === 'assistant'}
						<div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-900 text-cream">
							<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 0a10 10 0 110 20 10 10 0 010-20zm0 2a8 8 0 100 16 8 8 0 000-16z" /></svg>
						</div>
					{/if}
					<div class="flex max-w-xs flex-col lg:max-w-2xl" class:max-w-md={message.type === 'user'}>
						<div
							class="rounded-lg p-4 shadow-sm"
							class:bg-white={message.type === 'assistant'}
							class:bg-primary-900={message.type === 'user'}
							class:text-primary-900={message.type === 'assistant'}
							class:text-cream={message.type === 'user'}
						>
							<p class="whitespace-pre-wrap">{message.content}</p>
							{#if message.type === 'assistant' && message.sources && message.sources.length > 0}
								<div class="mt-4 space-y-2 border-t border-primary-100 pt-3">
									<p class="text-xs font-semibold text-primary-700">Sources vérifiées :</p>
									{#each message.sources as source}
										{#if source.url}
											<a
											href={source.url}
											target={source.url.startsWith('/') ? undefined : '_blank'}
											rel={source.url.startsWith('/') ? undefined : 'noopener noreferrer'}
											class="block text-xs text-accent hover:underline"
										>
											{source.title}
										</a>
									{:else}
										<p class="text-xs text-primary-700">{source.title}</p>
									{/if}
								{/each}
								</div>
							{/if}
						</div>
						{#if index === 0 && messages.length === 1}
							<div class="mt-4 flex flex-wrap gap-2">
								{#each STARTER_QUESTIONS as question}
									<button onclick={() => handleSendMessage(question)} class="rounded-full border border-primary-200 bg-white px-3 py-1.5 text-xs text-primary-700 transition-all hover:border-primary-400 hover:bg-primary-50">{question}</button>
								{/each}
							</div>
						{/if}
						{#if message.type === 'assistant' && index === messages.length - 1 && !isLoading && index > 0}
							<div class="mt-4 flex flex-wrap gap-2">
								{#each FOLLOW_UP_SUGGESTIONS as suggestion}
									<button onclick={() => handleSendMessage(suggestion)} class="rounded-full border border-accent/30 bg-accent/5 px-3 py-1.5 text-xs text-primary-800 transition-all hover:border-accent hover:bg-accent/10">{suggestion}</button>
								{/each}
							</div>
						{/if}
						<span class="mt-1 text-xs text-primary-600" class:text-right={message.type === 'user'}>
							{message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
						</span>
					</div>
					{#if message.type === 'user'}
						<div class="bg-gold flex h-8 w-8 flex-shrink-0 items-center justify-center">
							<svg class="h-5 w-5 text-primary-900" fill="currentColor" viewBox="0 0 20 20"><path d="M10 0a10 10 0 110 20 10 10 0 010-20zm0 2a8 8 0 100 16 8 8 0 000-16z" /></svg>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<div class="sticky bottom-0 z-40 border-t border-primary-200 bg-white px-4 py-6 shadow-lg sm:px-6 lg:px-8">
		<div class="mx-auto w-full max-w-4xl">
			<form onsubmit={(event) => { event.preventDefault(); handleSendMessage(); }} class="flex gap-4">
				<input
					type="text"
					bind:value={messageInput}
					bind:this={inputElement}
					placeholder="Posez une question sur l'histoire de notre famille..."
					class="flex-1 rounded-lg border border-primary-300 bg-cream px-4 py-3 text-primary-900 placeholder-primary-600 outline-none transition-colors focus:border-primary-900 focus:bg-white"
					disabled={isLoading}
				/>
				<button type="submit" disabled={isLoading || !messageInput.trim()} class="rounded-lg bg-primary-900 px-6 py-3 font-semibold text-cream transition-all hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50">
					{isLoading ? '…' : 'Envoyer'}
				</button>
			</form>
			<p class="mt-2 text-xs text-primary-600">Les réponses s’appuient uniquement sur les archives familiales disponibles.</p>
		</div>
	</div>
</div>

<style>
	:global(.chat-container) { scroll-behavior: smooth; }
</style>
