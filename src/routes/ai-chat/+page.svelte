<script lang="ts">
	import { onMount } from 'svelte';
	import {
		initSession,
		getTokensRemaining,
		canMakeRequest,
		recordTokens,
		getSessionWarnings,
		hasExceededBudget,
		getDailyBudget,
		getSessionContext,
		updateSessionContext,
		isSessionContextHot,
		type AISession
	} from '$lib/ai/session';
	import { estimateTokens } from '$lib/ai/vercel-generation';
	import type { VercelChatResponse } from '$lib/ai/vercel-generation';

	interface ChatMessage {
		id: string;
		role: 'user' | 'assistant';
		content: string;
		timestamp: number;
		tokensUsed?: number;
		usedCachedContext?: boolean;
	}

	let messages: ChatMessage[] = [];
	let inputMessage = '';
	let isLoading = false;
	let session: AISession | null = null;
	let error: string = '';
	let warnings = getSessionWarnings();
	let sessionContextHot = false;

	onMount(() => {
		try {
			session = initSession();
			warnings = getSessionWarnings();
			sessionContextHot = isSessionContextHot();
		} catch (err) {
			error = 'Failed to initialize session. Please refresh the page.';
		}
	});

	async function sendMessage() {
		if (!inputMessage.trim() || isLoading) return;

		try {
			error = '';
			const userMessage = inputMessage.trim();
			inputMessage = '';

			// Check budget before sending
			const estimatedTokens = estimateTokens(userMessage) + 100; // 100 for estimated response
			if (!canMakeRequest(estimatedTokens)) {
				error = `Not enough tokens. You have ${getTokensRemaining()} tokens remaining (need ~${estimatedTokens}).`;
				return;
			}

			// Add user message
			const userMsgId = `msg-${Date.now()}`;
			messages = [
				...messages,
				{
					id: userMsgId,
					role: 'user',
					content: userMessage,
					timestamp: Date.now()
				}
			];

			isLoading = true;

			// Prepare request with session context for Phase 2 caching
			const sessionCtx = getSessionContext();
			const requestBody = {
				message: userMessage,
				tokensUsed: (session?.tokensUsedToday || 0) + estimatedTokens,
				reuseContext: sessionContextHot,
				sessionContext: sessionCtx || undefined
			};

			// Call API
			const response = await fetch('/api/ai-vercel-chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(requestBody)
			});

			if (!response.ok) {
				const errData = await response.text();
				throw new Error(errData || `API error: ${response.status}`);
			}

			const data: VercelChatResponse = await response.json();

			// Record actual tokens used
			recordTokens(data.inputTokens, data.outputTokens);

			// Update session context with summaries used (Phase 2)
			if (data.summariesUsed && data.summariesUsed.length > 0) {
				updateSessionContext(data.summariesUsed);
				sessionContextHot = isSessionContextHot();
			}

			session = initSession();
			warnings = getSessionWarnings();

			// Format response with sources
			let responseContent = data.response;
			if (data.sourcesUsed && data.sourcesUsed.length > 0) {
				const sourceList = data.sourcesUsed
					.map((s) => `${s.title}`)
					.join(', ');
				responseContent += `\n\n_(Sources: ${sourceList})_`;
			}

			// Add context reuse indicator if applicable
			if (data.usedCachedContext) {
				responseContent += '\n\n💾 _(Used cached context from previous query)_';
			}

			// Add assistant message
			messages = [
				...messages,
				{
					id: `msg-${Date.now()}-assistant`,
					role: 'assistant',
					content: responseContent,
					timestamp: Date.now(),
					tokensUsed: data.totalTokens,
					usedCachedContext: data.usedCachedContext
				}
			];

			// Check for budget warnings
			if (hasExceededBudget()) {
				error = 'Daily token limit reached. Please come back tomorrow to continue.';
			} else {
				const remaining = getTokensRemaining();
				if (remaining < 500) {
					error = `Warning: Only ${remaining} tokens remaining today.`;
				}
			}
		} catch (err: any) {
			console.error('Error sending message:', err);
			error =
				err.message ||
				'Failed to send message. Please check your connection and try again.';
			isLoading = false;
		} finally {
			isLoading = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
			e.preventDefault();
			sendMessage();
		}
	}
</script>

<div class="flex h-screen flex-col bg-gradient-to-br from-slate-50 to-slate-100">
	<!-- Header -->
	<div class="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
		<div class="mx-auto max-w-4xl">
			<h1 class="text-2xl font-bold text-slate-900">Cloud AI Assistant</h1>
			<p class="mt-1 text-sm text-slate-600">
				Powered by Anthropic Claude • Ask about family history and genealogy
			</p>
		</div>
	</div>

	<!-- Main content -->
	<div class="flex flex-1 flex-col overflow-hidden">
		<!-- Token usage indicator -->
		{#if session}
			<div
				class={`border-b px-6 py-3 ${
					warnings.budgetExceeded
						? 'bg-red-50 text-red-900'
						: warnings.warningLevel === 'warning'
							? 'bg-yellow-50 text-yellow-900'
							: 'bg-blue-50 text-blue-900'
				}`}
			>
				<div class="mx-auto max-w-4xl">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-semibold">
								{session.tokensUsedToday.toLocaleString()} / {getDailyBudget().toLocaleString()} tokens
								used today
							</p>
							{#if warnings.message}
								<p class="mt-1 text-xs opacity-90">{warnings.message}</p>
							{/if}
						</div>
						<div class="w-48">
							<div class="h-2 overflow-hidden rounded-full bg-gray-300">
								<div
									class={`h-full transition-all duration-300 ${
										warnings.budgetExceeded
											? 'bg-red-500'
											: warnings.warningLevel === 'warning'
												? 'bg-yellow-500'
												: 'bg-blue-500'
									}`}
									style={`width: ${Math.min(
										(session.tokensUsedToday / getDailyBudget()) * 100,
										100
									)}%`}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Chat messages -->
		<div class="flex-1 overflow-y-auto px-6 py-6">
			<div class="mx-auto max-w-4xl space-y-4">
				{#if messages.length === 0}
					<div class="flex h-full items-center justify-center">
						<div class="text-center">
							<div class="mb-4 text-5xl">💬</div>
							<h2 class="text-2xl font-bold text-slate-900">Start a Conversation</h2>
							<p class="mt-2 text-slate-600">
								Ask me anything about family history and genealogy
							</p>
							<p class="mt-4 text-sm text-slate-500">
								Daily limit: {getDailyBudget().toLocaleString()} tokens
							</p>
						</div>
					</div>
				{:else}
					{#each messages as msg (msg.id)}
						<div class={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
							<div
								class={`max-w-2xl rounded-lg px-4 py-3 ${
									msg.role === 'user'
										? 'bg-blue-600 text-white'
										: 'border border-slate-200 bg-white text-slate-900'
								}`}
							>
								<div class="whitespace-pre-wrap text-sm leading-relaxed">
									{msg.content}
								</div>
								{#if msg.tokensUsed}
									<div class={`mt-2 text-xs ${msg.role === 'user' ? 'text-blue-100' : 'text-slate-500'}`}>
										{msg.tokensUsed} tokens
									</div>
								{/if}
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>

		<!-- Error message -->
		{#if error}
			<div
				class={`border-t px-6 py-3 ${
					error.includes('exceeded') || error.includes('limit')
						? 'border-red-200 bg-red-50 text-red-900'
						: 'border-yellow-200 bg-yellow-50 text-yellow-900'
				}`}
			>
				<div class="mx-auto max-w-4xl">
					<p class="text-sm font-semibold">{error}</p>
				</div>
			</div>
		{/if}

		<!-- Session context indicator (Phase 2) -->
		{#if sessionContextHot && getSessionContext()?.summariesUsed.length > 0}
			<div class="border-t border-blue-200 bg-blue-50 px-6 py-2">
				<div class="mx-auto max-w-4xl text-xs text-blue-700">
					💾 Cached context active: {getSessionContext()?.summariesUsed.length} summaries available for
					reuse (saves tokens!)
				</div>
			</div>
		{/if}

		<!-- Input area -->
		<div class="border-t border-slate-200 bg-white px-6 py-4 shadow-sm">
			<div class="mx-auto max-w-4xl">
				<div class="flex gap-3">
					<textarea
						bind:value={inputMessage}
						on:keydown={handleKeydown}
						placeholder={hasExceededBudget()
							? 'Daily limit reached. Come back tomorrow!'
							: 'Ask about family history...'}
						disabled={isLoading || hasExceededBudget()}
						class="flex-1 resize-none rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
						rows="3"
					/>
					<button
						on:click={sendMessage}
						disabled={!inputMessage.trim() || isLoading || hasExceededBudget()}
						class="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500"
					>
						{isLoading ? 'Sending...' : 'Send'}
					</button>
				</div>
				<p class="mt-2 text-xs text-slate-500">
					Press Enter or click Send to submit. Daily limit: {getDailyBudget().toLocaleString()} tokens
				</p>
			</div>
		</div>
	</div>
</div>
