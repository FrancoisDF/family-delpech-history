<script lang="ts">
	interface ChatMessage {
		id: string;
		type: 'user' | 'assistant';
		content: string;
		timestamp: Date;
		sources?: Array<{ title: string; url: string; isBuilder: boolean; sourceId?: string }>;
	}


	import { searchFamilyData } from '$lib/ai/search';
	import { ENABLE_LOCAL_LLM, DEFAULT_SYSTEM_PROMPT } from '$lib/ai/config';
	import {
		summarizeFromChunks,
		isSummarizerLoading,
		getGeneratorProgress,
		cancelModelLoading,
		getSystemPrompt,
		setSystemPrompt
	} from '$lib/ai/generation';
	import { generateBlogUrl } from '$lib/url-utils';
	import { browser } from '$app/environment';
	import { tick } from 'svelte';

	interface LoadProgress {
		status: 'init' | 'downloading' | 'done' | 'error' | 'cancelled';
		percentage: number;
		file?: string;
	}

	let currentProgress = $state<LoadProgress>({ status: 'init', percentage: 0 });
	let networkWarning = $state('');

	// Check network connection on mount
	$effect(() => {
		if (browser && 'connection' in navigator) {
			const conn = (navigator as any).connection;
			if (conn.saveData || conn.effectiveType === '2g' || conn.effectiveType === '3g') {
				networkWarning = "Connexion lente détectée. Le téléchargement de l'IA (~350MB) est plus rapide en WiFi.";
			}
		}
	});

	// Poll for progress when loading
	$effect(() => {
		let interval: any;
		if (isLoading && isSummarizerLoading()) {
			interval = setInterval(() => {
				currentProgress = getGeneratorProgress();
			}, 200);
		} else {
			currentProgress = getGeneratorProgress();
		}
		return () => clearInterval(interval);
	});

	const DEFAULT_MESSAGE: ChatMessage = {
		id: '1',
		type: 'assistant',
		content:
			"Bonjour ! Bienvenue dans l'archive familiale. Je vais vous aider à explorer nos archives en répondant à vos questions. Actuellement, vous verrez les passages pertinents directement des documents archivés. Posez vos questions sur nos ancêtres, nos traditions, et les événements importants qui ont marqué notre histoire.",
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
			const stored = localStorage.getItem('chatMessages');
			if (stored) {
				const parsed = JSON.parse(stored) as ChatMessage[];
				// Convert timestamp strings back to Date objects
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

	let messageInput = $state('');
	let isLoading = $state(false);
	let chatContainer = $state<HTMLDivElement>();
	let inputElement = $state<HTMLInputElement>();

	let showSettings = $state(false);
	let systemPrompt = $state(DEFAULT_SYSTEM_PROMPT);

	async function scrollToBottom() {
		// Wait for DOM to be fully rendered
		await tick();

		if (!chatContainer || !browser) return;

		// Use requestAnimationFrame for proper timing
		requestAnimationFrame(() => {
			if (chatContainer) {
				// Find the latest assistant message to scroll to its start
				const lastAssistantMessage = messages
					.slice()
					.reverse()
					.find((m) => m.type === 'assistant');

				if (lastAssistantMessage) {
					// Find the element with this message ID
					const messageElement = chatContainer.querySelector(`[data-message-id="${lastAssistantMessage.id}"]`);

					if (messageElement) {
						// Scroll smoothly to the message start
						messageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
						return;
					}
				}

				// Fallback: scroll to bottom minus footer height
				const footer = document.querySelector('footer');
				const footerHeight = footer ? footer.offsetHeight : 0;
				const targetScroll = chatContainer.scrollHeight - footerHeight;

				chatContainer.scrollTo({
					top: targetScroll,
					behavior: 'smooth'
				});
			}
		});
	}

	function handleSendMessage(text?: string) {
		const content = text || messageInput;
		if (!content.trim()) return;

		// Add user message
		const userMessage: ChatMessage = {
			id: Date.now().toString(),
			type: 'user',
			content: content,
			timestamp: new Date()
		};

		messages = [...messages, userMessage];
		messageInput = '';
		isLoading = true;

		// Simulate API response
		(async () => {
			try {
				// Show initialization message if generator is loading for the first time
				if (ENABLE_LOCAL_LLM && isSummarizerLoading()) {
					const initMessage: ChatMessage = {
						id: (Date.now() + 0.5).toString(),
						type: 'assistant',
						content: 'Initialisation de l\'IA locale... L\'IA est traitée directement sur votre appareil pour garantir votre confidentialité. Le premier téléchargement peut être volumineux (~350MB).',
						timestamp: new Date()
					};
					messages = [...messages, initMessage];
				}

				const results = await searchFamilyData(userMessage.content, { topK: 4 });
				let assistantText = '';
				let sourceReferences: Array<{ title: string; url: string; isBuilder: boolean }> = [];

				if (!results || results.length === 0) {
					assistantText = "Désolé — je ne trouve aucune information pertinente dans nos archives familiales pour répondre à cette question.";
				} else {
					// Collect source references for display
					sourceReferences = results.map((r) => ({
						title: r.chunk.title,
						url: r.chunk.url,
						sourceId: r.chunk.sourceId,
						isBuilder: r.chunk.sourceModel === 'blog-articles' || r.chunk.sourceModel === 'stories'
					}));

					// Build an answer strictly from retrieved passages
					// Optionally run the feature-flagged summarizer
					if (ENABLE_LOCAL_LLM) {
						// summarizeFromChunks returns null if not enabled/implemented; fallback if necessary
						const chunks = results.map((r) => r.chunk);
						const summary = await summarizeFromChunks(chunks, userMessage.content);
						assistantText = summary ?? 'Voici ce que j\'ai trouvé dans les archives :\n\n';
						if (!summary) {
							for (const r of results) {
								assistantText += `• ${r.chunk.title} — "${cleanChunkText(r.chunk.text)}" (source: ${r.chunk.url})\n\n`;
							}
						}
					} else {
						assistantText = 'Voici ce que j\'ai trouvé dans les archives :\n\n';
						for (const r of results) {
							assistantText += `• ${r.chunk.title} — "${cleanChunkText(r.chunk.text)}" (source: ${r.chunk.url})\n\n`;
						}
					}
				}

				const assistantMessage: ChatMessage = {
					id: (Date.now() + 1).toString(),
					type: 'assistant',
					content: assistantText,
					timestamp: new Date(),
					sources: sourceReferences
				};

				messages = [...messages, assistantMessage];
			} catch (err) {
				console.error('Search failed', err);
				messages = [
					...messages,
					{
						id: (Date.now() + 2).toString(),
						type: 'assistant',
						content: "Erreur interne: impossible de rechercher dans les archives familiales.",
						timestamp: new Date()
					}
				];
			} finally {
				isLoading = false;
				// Auto-scroll to bottom and focus input
				(async () => {
					await tick();
					setTimeout(async () => {
						await scrollToBottom();
					}, 1000); // slight delay to ensure DOM updates
					
					inputElement?.focus();
				})();
			}
		})();
	}

	// Scroll to bottom whenever messages change
	$effect(() => {
		messages.length; // Depend on messages count

		(async () => {
			await tick();
			await scrollToBottom();
		})();
	});

	// Save messages to localStorage whenever they change
	$effect(() => {
		if (browser) {
			localStorage.setItem('chatMessages', JSON.stringify(messages));
		}
	});

	function clearChatHistory() {
		if (browser) {
			localStorage.removeItem('chatMessages');
			messages = [DEFAULT_MESSAGE];
		}
	}

	function loadSystemPrompt() {
		if (!browser) return;
		systemPrompt = getSystemPrompt();
	}

	function saveSystemPrompt() {
		setSystemPrompt(systemPrompt);
		showSettings = false;
	}

	function resetSystemPrompt() {
		systemPrompt = DEFAULT_SYSTEM_PROMPT;
		saveSystemPrompt();
	}

	// Load system prompt on mount
	$effect.pre(() => {
		if (browser) {
			loadSystemPrompt();
		}
	});

	function cleanChunkText(text: string): string {
		// Clean up formatting and normalize spacing
		let cleaned = text
			.replace(/\s+/g, ' ')
			.trim();

		// Truncate to reasonable length
		if (cleaned.length > 250) {
			cleaned = cleaned.slice(0, 250).trim();
			// Cut at word boundary
			const lastSpace = cleaned.lastIndexOf(' ');
			if (lastSpace > 80) cleaned = cleaned.slice(0, lastSpace);
			cleaned += '...';
		}

		return cleaned;
	}
</script>

<svelte:head>
	<title>Assistant Familial IA - Histoire de Famille</title>
	<meta
		name="description"
		content="Posez vos questions sur l'histoire de notre famille et explorez nos archives numériques avec notre assistant IA."
	/>
</svelte:head>

<div class="flex h-full flex-col overflow-hidden">
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
						onclick={() => (showSettings = true)}
						class="rounded-lg border border-primary-300 px-4 py-2 text-sm text-primary-700 transition-all hover:border-primary-500 hover:bg-primary-50"
						title="Paramètres du personnage"
					>
						⚙️ Réglages
					</button>
					<button
						onclick={clearChatHistory}
						class="rounded-lg border border-primary-300 px-4 py-2 text-sm text-primary-700 transition-all hover:border-primary-500 hover:bg-primary-50"
						title="Start a new chat"
					>
						+ Nouveau Chat
					</button>
				</div>
			</div>
		</div>
	</section>

	<!-- Chat Container -->
	<div bind:this={chatContainer} class="chat-container flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-2xl space-y-6">
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
									<p class="text-xs font-semibold text-primary-700">Sources:</p>
									<div class="space-y-1">
										{#each message.sources as source}
											<a
												href={source.isBuilder && source.sourceId ? `/histoires/${generateBlogUrl(source.sourceId, source.title)}` : source.url}
												target={source.isBuilder ? undefined : "_blank"}
												rel={source.isBuilder ? undefined : "noopener noreferrer"}
												class="block text-xs text-accent hover:underline"
												title={source.title}
											>
												{#if source.isBuilder}
													<span class="inline-block rounded bg-accent/20 px-2 py-1 text-primary-900">📖 {source.title}</span>
												{:else}
													<span>📄 {source.title}</span>
												{/if}
											</a>
										{/each}
									</div>
								</div>
							{/if}
						</div>

						<!-- Starter Questions for the very first message -->
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

						<!-- Follow-up suggestions after an assistant response -->
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

			{#if isLoading}
				<div class="flex gap-4">
					<div class="flex-shrink-0">
						<div
							class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-900 text-cream"
						>
							<svg class="h-5 w-5 animate-spin" fill="currentColor" viewBox="0 0 20 20">
								<path d="M10 0a10 10 0 110 20 10 10 0 010-20zm0 2a8 8 0 100 16 8 8 0 000-16z" />
							</svg>
						</div>
					</div>
					<div class="flex flex-col gap-2 rounded-lg bg-white p-4 text-primary-900 shadow-sm min-w-[200px]">
						<div class="flex items-center gap-2">
							<span class="animate-pulse">●</span>
							<span class="animate-pulse delay-100">●</span>
							<span class="animate-pulse delay-200">●</span>
							<span class="ml-2 text-sm font-medium">Réflexion...</span>
						</div>

						{#if currentProgress.status === 'downloading'}
							<div class="mt-2 space-y-2">
								<div class="flex justify-between text-[10px] text-primary-600">
									<span>Téléchargement du modèle...</span>
									<span>{currentProgress.percentage.toFixed(0)}%</span>
								</div>
								<div class="h-1.5 w-full overflow-hidden rounded-full bg-primary-100">
									<div
										class="h-full bg-primary-900 transition-all duration-300"
										style="width: {currentProgress.percentage}%"
									></div>
								</div>
								{#if currentProgress.file}
									<p class="truncate text-[9px] text-primary-400">{currentProgress.file}</p>
								{/if}

								<button
									onclick={() => {
										cancelModelLoading();
										isLoading = false;
									}}
									class="mt-1 text-[10px] font-bold text-red-600 hover:underline"
								>
									✕ Annuler le téléchargement
								</button>

								{#if networkWarning}
									<p class="mt-1 text-[9px] italic text-amber-600 leading-tight">
										⚠️ {networkWarning}
									</p>
								{/if}
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Input Area - Fixed at bottom of viewport -->
	<div class="fixed bottom-0 left-0 right-0 border-t border-primary-200 bg-white px-4 py-6 shadow-lg sm:px-6 lg:px-8 z-40">
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
					aria-label="Envoyer"
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
						✓ Enregistrer
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
						↻ Réinitialiser
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

	.delay-100 {
		animation-delay: 0.1s;
	}

	.delay-200 {
		animation-delay: 0.2s;
	}
</style>
