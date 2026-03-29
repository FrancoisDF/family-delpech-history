<script lang="ts">
	interface ChatMessage {
		id: string;
		type: 'user' | 'assistant';
		content: string;
		timestamp: Date;
		status?: 'loading' | 'streaming' | 'done';
		sources?: Array<{
			title: string;
			url: string;
			isBuilder: boolean;
			sourceId?: string;
			contentType?: string;
			originPostId?: string;
			originPostUrl?: string;
		}>;
		linkedBlogPosts?: Array<{
			id: string;
			title: string;
			url: string;
		}>;
	}

	import { DEFAULT_SYSTEM_PROMPT } from '$lib/ai/config';
	import type { LoadProgress } from '$lib/ai/generation';
	import type { FamilyChunk } from '$lib/ai/data';
	import { generateBlogUrl } from '$lib/url-utils';
	import { browser } from '$app/environment';
	import { onMount, tick } from 'svelte';

	// Dynamic import handle — loaded only in browser to avoid SSR pulling in sharp/onnx
	let generationModule: typeof import('$lib/ai/generation') | null = null;

	// --- Local LLM loading state ---
	let modelStatus = $state<'idle' | 'loading' | 'ready' | 'error'>('idle');
	let modelProgress = $state<LoadProgress>({ status: 'init', percentage: 0 });
	let modelError = $state<string | null>(null);

	/** Preload the local LLM model on mount (browser only) */
	onMount(async () => {
		try {
			// Dynamic import to avoid SSR loading @xenova/transformers (sharp/onnx)
			generationModule = await import('$lib/ai/generation');
		} catch (err) {
			modelStatus = 'error';
			modelError = 'Impossible de charger le module IA.';
			return;
		}

		modelStatus = 'loading';
		const progressInterval = setInterval(() => {
			if (generationModule) {
				modelProgress = generationModule.getGeneratorProgress();
			}
		}, 300);

		try {
			const gen = await generationModule.loadGenerator();
			clearInterval(progressInterval);
			modelProgress = generationModule.getGeneratorProgress();
			if (gen) {
				modelStatus = 'ready';
			} else {
				modelStatus = 'error';
				modelError = 'Le modèle IA local n\'a pas pu être chargé.';
			}
		} catch (err: any) {
			clearInterval(progressInterval);
			modelStatus = 'error';
			modelError = err?.message || 'Erreur de chargement du modèle';
		}

		// Load saved system prompt
		systemPrompt = generationModule.getSystemPrompt();
	});

	const DEFAULT_MESSAGE: ChatMessage = {
		id: '1',
		type: 'assistant',
		content:
			"Bonjour ! Bienvenue dans l'archive familiale. Je vais vous aider à explorer nos archives en répondant à vos questions. Posez vos questions sur nos ancêtres, nos traditions, et les événements importants qui ont marqué notre histoire.",
		timestamp: new Date()
	};

	const STARTER_QUESTIONS = [
		"Qui était Marie Antoinette ?",
		"Quels étaient les métiers de nos ancêtres ?",
		"Où habitait la famille au 19ème siècle ?",
		"Raconte-moi une anecdote sur la famille."
	];

	const FOLLOW_UP_SUGGESTIONS = [
		"Peux-tu m'en dire plus ?",
		"Quelles sont les sources de cette information ?",
		"Y a-t-il d'autres documents à ce sujet ?",
		"Qui d'autre est mentionné ?"
	];

	function loadMessagesFromStorage(): ChatMessage[] {
		if (!browser) return [DEFAULT_MESSAGE];
		try {
			const stored = sessionStorage.getItem('chatMessages');
			if (stored) {
				const parsed = JSON.parse(stored) as ChatMessage[];
				return parsed.map(m => ({
					...m,
					timestamp: new Date(m.timestamp)
				}));
			}
		} catch (err) {
			console.warn('Failed to load chat history:', err);
		}
		return [DEFAULT_MESSAGE];
	}

	let messages = $state<ChatMessage[]>(loadMessagesFromStorage());
	let hasStartedChat = $state(false);

	let messageInput = $state('');
	let isLoading = $state(false);
	let chatContainer = $state<HTMLDivElement>();
	let inputElement = $state<HTMLInputElement>();

	let showSettings = $state(false);
	let systemPrompt = $state(DEFAULT_SYSTEM_PROMPT);

	function updateMessageById(id: string, patch: Partial<ChatMessage>) {
		messages = messages.map((m) => (m.id === id ? { ...m, ...patch } : m));
	}

	async function scrollToResponseTop() {
		await tick();
		if (!browser) return;

		requestAnimationFrame(() => {
			const lastUserMessage = messages
				.slice()
				.reverse()
				.find((m) => m.type === 'user');

			if (lastUserMessage) {
				const messageElement = document.querySelector(`[data-message-id="${lastUserMessage.id}"]`);
				if (messageElement) {
					messageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}
			}
		});
	}

	function handleSendMessage(text?: string) {
		const content = text || messageInput;
		if (!content.trim()) return;

		hasStartedChat = true;

		const userMessage: ChatMessage = {
			id: Date.now().toString(),
			type: 'user',
			content: content,
			timestamp: new Date()
		};

		messages = [...messages, userMessage];
		messageInput = '';
		isLoading = true;

		// Scroll to show the user message immediately
		(async () => {
			await tick();
			const userMessageElement = document.querySelector(`[data-message-id="${userMessage.id}"]`);
			if (userMessageElement) {
				userMessageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
		})();

		const assistantMessageId = (Date.now() + 1).toString();
		messages = [
			...messages,
			{
				id: assistantMessageId,
				type: 'assistant',
				status: 'loading',
				content: 'Recherche dans les archives…',
				timestamp: new Date(),
				sources: []
			}
		];

		// Scroll to top of the new response
		(async () => {
			await tick();
			await scrollToResponseTop();
		})();

		(async () => {
			try {
				// Step 1: Call the RAG endpoint for semantic search via Supabase
				const res = await fetch('/api/rag-search', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ message: userMessage.content })
				});

				if (!res.ok) {
					const errText = await res.text();
					throw new Error(errText || `HTTP ${res.status}`);
				}

				const data = await res.json();
				const chunks: FamilyChunk[] = data.chunks || [];
				const linkedBlogs = data.linkedBlogPosts || [];

				// Build source references from RAG results
				const sourceReferences = chunks
					.filter((c: any) => c.title)
					.reduce((acc: Array<{ title: string; url: string; isBuilder: boolean; sourceId?: string; contentType?: string }>, c: any) => {
						if (!acc.find(s => s.title === c.title)) {
							acc.push({
								title: c.title,
								url: c.url || '',
								isBuilder: c.isBuilderContent || false,
								sourceId: c.sourceId || c.title,
								contentType: c.contentType || 'document',
								originPostId: c.originPostId || '',
								originPostUrl: c.originPostUrl || ''
							});
						}
						return acc;
					}, [])
					.slice(0, 4);

				if (chunks.length === 0) {
					updateMessageById(assistantMessageId, {
						status: 'done',
						content: "Je n'ai trouvé aucun document correspondant dans les archives familiales. Essayez de reformuler votre question.",
						sources: [],
						linkedBlogPosts: []
					});
					return;
				}

				// Step 2: Generate response using local LLM
				updateMessageById(assistantMessageId, {
					status: 'streaming',
					content: 'Génération de la réponse…'
				});

				const generated = generationModule ? await generationModule.summarizeFromChunks(
					chunks,
					userMessage.content,
					(streamedText: string) => {
						// Live-update the message as tokens stream in
						updateMessageById(assistantMessageId, {
							status: 'streaming',
							content: streamedText,
							sources: sourceReferences
						});
					}
				) : null;

				// Use generated text, or fall back to showing raw context
				const finalContent = generated
					|| chunks.map(c => c.text).join('\n\n').slice(0, 500)
					|| "Je n'ai pas pu générer de réponse.";

				updateMessageById(assistantMessageId, {
					status: 'done',
					content: finalContent,
					sources: sourceReferences,
					linkedBlogPosts: linkedBlogs
				});
			} catch (err) {
				console.error('Chat failed', err);
				updateMessageById(assistantMessageId, {
					status: 'done',
					content: "Erreur: impossible de contacter le service. Veuillez réessayer."
				});
			} finally {
				isLoading = false;
				(async () => {
					await tick();
					setTimeout(scrollToResponseTop, 500);
					inputElement?.focus();
				})();
			}
		})();
	}

	$effect(() => {
		messages.length;
		if (hasStartedChat && messages.length > 1) {
			(async () => {
				await tick();
				await scrollToResponseTop();
			})();
		}
	});

	$effect(() => {
		if (browser) {
			sessionStorage.setItem('chatMessages', JSON.stringify(messages));
		}
	});

	function clearChatHistory() {
		if (browser) {
			sessionStorage.removeItem('chatMessages');
			messages = [DEFAULT_MESSAGE];
			hasStartedChat = false;
		}
	}

	function saveSystemPrompt() {
		generationModule?.setSystemPrompt(systemPrompt);
		showSettings = false;
	}

	function resetSystemPrompt() {
		systemPrompt = DEFAULT_SYSTEM_PROMPT;
		generationModule?.setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
		showSettings = false;
	}

	$effect(() => {
		if (browser) {
			const handleKeydown = (event: KeyboardEvent) => {
				if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'S') {
					event.preventDefault();
					showSettings = true;
				}
			};
			document.addEventListener('keydown', handleKeydown);
			return () => document.removeEventListener('keydown', handleKeydown);
		}
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
	<!-- Header -->
	<section class="flex-shrink-0 border-b border-primary-200 px-4 py-8 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-4xl">
			<div class="flex items-start justify-between">
				<div class="flex-1">
					<h1 class="mb-2 font-serif text-3xl font-bold text-primary-900">Assistant Familial IA</h1>
					<p class="text-primary-700">
						Posez vos questions sur l'histoire de notre famille et explorez nos archives numériques
					</p>
				</div>
				<div class="ml-4 flex flex-shrink-0 gap-2">
					<button
						onclick={clearChatHistory}
						class="rounded-lg border border-primary-300 px-4 py-2 text-sm text-primary-700 transition-all hover:border-primary-500 hover:bg-primary-50"
						title="Start a new chat"
					>
						+ Nouveau Chat
					</button>
				</div>
			</div>

			<!-- Model loading status bar -->
			{#if modelStatus === 'loading'}
				<div class="mt-4 rounded-lg bg-primary-50 p-3">
					<div class="flex items-center gap-2 text-sm text-primary-700">
						<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
						</svg>
						<span>Chargement du modèle IA local…</span>
						{#if modelProgress.percentage > 0}
							<span class="font-mono text-xs">{Math.round(modelProgress.percentage)}%</span>
						{/if}
					</div>
					{#if modelProgress.percentage > 0}
						<div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-primary-200">
							<div
								class="h-full rounded-full bg-accent transition-all duration-300"
								style="width: {modelProgress.percentage}%"
							></div>
						</div>
					{/if}
				</div>
			{:else if modelStatus === 'error'}
				<div class="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
					{modelError || 'Le modèle IA n\'a pas pu être chargé.'} Les réponses seront basées sur les extraits d'archives.
				</div>
			{:else if modelStatus === 'ready'}
				<div class="mt-4 rounded-lg bg-green-50 p-2 text-xs text-green-700">
					Modèle IA local prêt
				</div>
			{/if}
		</div>
	</section>

	<!-- Chat Container -->
	<div bind:this={chatContainer} class="chat-container flex-1 px-4 py-8 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-2xl space-y-6 pb-32">
			{#each messages as message, i (message.id)}
				<div data-message-id={message.id} class="flex gap-4" class:justify-end={message.type === 'user'}>
					{#if message.type === 'assistant'}
						<div class="flex-shrink-0">
							<div
								class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-900 text-cream"
							>
								<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
									<path d="M10 0a10 10 0 110 20 10 10 0 010-20zm0 2a8 8 0 100 16 8 8 0 000-16z" />
								</svg>
							</div>
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
									<p class="text-xs font-semibold text-primary-700">Sources documentaires:</p>
									<div class="space-y-1">
										{#each message.sources as source}
											<div class="space-y-1">
												{#if source.contentType === 'blog_post' || source.isBuilder}
													<a
														href={source.sourceId ? `/histoires/${generateBlogUrl(source.sourceId, source.title)}` : source.url}
														class="block text-xs text-accent hover:underline"
														title={source.title}
													>
														<span class="inline-block rounded bg-accent/20 px-2 py-1 text-primary-900">{source.title}</span>
													</a>
												{:else if source.originPostId || source.originPostUrl}
													<a
														href={source.originPostUrl || `/histoires/${generateBlogUrl(source.originPostId || '', source.title)}`}
														class="block text-xs text-accent hover:underline"
														title={source.title}
													>
														<span class="inline-block rounded bg-primary-100 px-2 py-1 text-primary-800">{source.title}</span>
													</a>
												{:else}
													<span class="inline-block rounded bg-primary-100 px-2 py-1 text-xs text-primary-800">{source.title}</span>
												{/if}
											</div>
										{/each}
									</div>
								</div>
							{/if}

							{#if message.type === 'assistant' && message.linkedBlogPosts && message.linkedBlogPosts.length > 0}
								<div class="mt-3 space-y-2 border-t border-primary-100 pt-3">
									<p class="text-xs font-semibold text-primary-700">Articles connexes:</p>
									<div class="space-y-1">
										{#each message.linkedBlogPosts as blogPost}
											<a
												href={blogPost.url || '#'}
												class="block text-xs text-accent hover:underline"
											>
												<span class="inline-block rounded bg-accent/10 px-2 py-1 text-primary-800">{blogPost.title}</span>
											</a>
										{/each}
									</div>
								</div>
							{/if}
						</div>

						{#if i === 0 && messages.length === 1}
							<div class="mt-4 flex flex-wrap gap-2">
								{#each STARTER_QUESTIONS as question}
									<button
										onclick={() => handleSendMessage(question)}
										class="rounded-full border border-primary-200 bg-white px-3 py-1.5 text-xs text-primary-700 transition-all hover:border-primary-400 hover:bg-primary-50"
									>
										{question}
									</button>
								{/each}
							</div>
						{/if}

						{#if message.type === 'assistant' && i === messages.length - 1 && !isLoading && i > 0}
							<div class="mt-4 flex flex-wrap gap-2">
								{#each FOLLOW_UP_SUGGESTIONS as suggestion}
									<button
										onclick={() => handleSendMessage(suggestion)}
										class="rounded-full border border-accent/30 bg-accent/5 px-3 py-1.5 text-xs text-primary-800 transition-all hover:border-accent hover:bg-accent/10"
									>
										{suggestion}
									</button>
								{/each}
							</div>
						{/if}

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
							<div class="bg-gold flex h-8 w-8 items-center justify-center rounded-full">
								<svg class="h-5 w-5 text-primary-900" fill="currentColor" viewBox="0 0 20 20">
									<path d="M10 0a10 10 0 110 20 10 10 0 010-20zm0 2a8 8 0 100 16 8 8 0 000-16z" />
								</svg>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<!-- Input Area -->
	<div class="sticky bottom-0 border-t border-primary-200 bg-white px-4 py-6 shadow-lg sm:px-6 lg:px-8 z-40">
		<div class="mx-auto max-w-4xl w-full">
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSendMessage();
				}}
				class="flex gap-4"
			>
				<input
					type="text"
					bind:value={messageInput}
					bind:this={inputElement}
					placeholder="Posez une question sur l'histoire de notre famille..."
					class="flex-1 rounded-lg border border-primary-300 bg-cream px-4 py-3 text-primary-900 placeholder-primary-600 outline-none transition-colors focus:border-primary-900 focus:bg-white"
					disabled={isLoading}
				/>
				<button
					type="submit"
					disabled={isLoading || !messageInput.trim()}
					class="rounded-lg bg-primary-900 px-6 py-3 font-semibold text-cream transition-all hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
						<path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5.951-2.975 5.951 2.975a1 1 0 001.169-1.409l-7-14z" />
					</svg>
				</button>
			</form>
		</div>
	</div>

	<!-- Settings Modal -->
	{#if showSettings}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div class="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
				<h2 class="mb-4 font-serif text-2xl font-bold text-primary-900">Personnalité de l'Assistant</h2>

				<div class="mb-4">
					<label for="prompt" class="mb-2 block text-sm font-semibold text-primary-900">
						Instructions système (prompt personnalisé):
					</label>
					<textarea
						id="prompt"
						bind:value={systemPrompt}
						class="w-full rounded-lg border border-primary-300 bg-cream p-3 text-sm text-primary-900 outline-none transition-colors focus:border-primary-900 focus:bg-white"
						rows="6"
						placeholder="Décrivez comment l'assistant doit se comporter..."
					/>
				</div>

				<div class="mb-6 rounded-lg bg-primary-50 p-3">
					<p class="text-xs text-primary-700">
						<strong>Conseil:</strong> Décrivez le rôle, le ton, et le style de réponse souhaité. Par exemple: "Je suis une femme âgée qui raconte l'histoire de ma famille avec tendresse..."
					</p>
				</div>

				<div class="flex gap-3">
					<button
						onclick={saveSystemPrompt}
						class="flex-1 rounded-lg bg-primary-900 px-4 py-2 font-semibold text-cream transition-all hover:bg-primary-800"
					>
						Enregistrer
					</button>
					<button
						onclick={() => (showSettings = false)}
						class="rounded-lg border border-primary-300 px-4 py-2 text-primary-700 transition-all hover:border-primary-500 hover:bg-primary-50"
					>
						Annuler
					</button>
					<button
						onclick={resetSystemPrompt}
						class="rounded-lg border border-primary-300 px-4 py-2 text-xs text-primary-700 transition-all hover:border-primary-500 hover:bg-primary-50"
						title="Restaurer le prompt par défaut"
					>
						Réinitialiser
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	:global(.chat-container) {
		scroll-behavior: smooth;
	}
</style>
