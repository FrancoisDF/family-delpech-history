import { error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { streamText } from 'ai';
import { createModelForChat, getProviderConfig, normalizeUsage } from '$lib/ai/provider';
import { getAiRuntimeConfig, ARCHIVE_NOT_FOUND_MESSAGE } from '$lib/server/ai-config';
import { buildArchiveSystemPrompt, validateChatRequest, ChatRequestError } from '$lib/server/chat';
import { searchArchive } from '$lib/server/retrieval';
import {
	calculateCost,
	recordUsage,
	reserveUsage,
	UsageLimitError,
	type UsageReservation
} from '$lib/server/usage';

function errorMessage(reason: string): string {
	if (reason === 'burst') return 'Trop de demandes en peu de temps. Veuillez patienter un instant.';
	if (reason === 'daily')
		return 'La limite quotidienne de consultation est atteinte. Revenez demain.';
	if (reason === 'monthly')
		return 'Le budget mensuel de l’assistant est atteint. Réessayez le mois prochain.';
	return 'La consultation est temporairement indisponible.';
}

function sse(data: unknown): string {
	return `data: ${JSON.stringify(data)}\n\n`;
}

function embeddingCost(tokens: number, config: { embeddingInputCostPerMillion: number }): number {
	return (tokens * config.embeddingInputCostPerMillion) / 1_000_000;
}

export const POST: RequestHandler = async ({ request, cookies }) => {
	let config;
	try {
		config = getAiRuntimeConfig();
	} catch (cause) {
		console.error('AI configuration error', cause);
		return error(503, 'Le service de consultation n’est pas configuré.');
	}

	let input;
	try {
		input = validateChatRequest(
			await request.json(),
			config.maxMessageLength,
			config.maxHistoryMessages
		);
	} catch (cause) {
		if (cause instanceof ChatRequestError) return error(400, cause.message);
		return error(400, 'La requête est invalide.');
	}

	let providerConfig;
	try {
		providerConfig = getProviderConfig();
	} catch (cause) {
		console.error('AI provider configuration error', cause);
		return error(503, 'Le service de consultation n’est pas configuré.');
	}

	const estimatedInputTokens = Math.ceil(
		(input.message.length +
			input.history.reduce((total, message) => total + message.content.length, 0)) /
			4
	);
	const reservedInputTokens = estimatedInputTokens + Math.ceil(12000 / 4);
	const estimatedCostUsd = Math.max(
		config.reserveCostUsd,
		calculateCost(reservedInputTokens, config.maxOutputTokens, config)
	);

	let reservation: UsageReservation;
	try {
		reservation = await reserveUsage(
			request,
			cookies,
			reservedInputTokens + config.maxOutputTokens,
			estimatedCostUsd,
			config
		);
	} catch (cause) {
		if (cause instanceof UsageLimitError) return error(429, errorMessage(cause.reason));
		console.error('AI usage reservation error', cause);
		return error(503, 'La consultation est temporairement indisponible.');
	}

	let hits;
	let embeddingTokens = 0;
	try {
		const searchResult = await searchArchive(input.message, config);
		hits = searchResult.hits;
		embeddingTokens = searchResult.embeddingTokens;
	} catch (cause) {
		console.error('Archive retrieval error; preserving usage reservation', cause);
		return error(503, 'Les archives sont momentanément indisponibles.');
	}

	if (hits.length === 0) {
		await recordUsage(
			reservation,
			{
				inputTokens: embeddingTokens,
				outputTokens: 0,
				costUsd: embeddingCost(embeddingTokens, config)
			},
			providerConfig.modelName,
			config
		).catch((cause) => console.error('Failed to reconcile empty retrieval', cause));
		return new Response(
			new ReadableStream({
				start(controller) {
					controller.enqueue(
						new TextEncoder().encode(sse({ type: 'text', text: ARCHIVE_NOT_FOUND_MESSAGE }))
					);
					controller.enqueue(
						new TextEncoder().encode(
							sse({
								type: 'done',
								sources: [],
								inputTokens: embeddingTokens,
								outputTokens: 0,
								totalTokens: embeddingTokens
							})
						)
					);
					controller.enqueue(new TextEncoder().encode(sse('[DONE]')));
					controller.close();
				}
			}),
			{
				headers: { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache' }
			}
		);
	}

	let model;
	try {
		model = createModelForChat();
	} catch (cause) {
		await recordUsage(
			reservation,
			{
				inputTokens: embeddingTokens,
				outputTokens: 0,
				costUsd: embeddingCost(embeddingTokens, config)
			},
			providerConfig.modelName,
			config
		).catch((recordError) => console.error('Failed to reconcile embedding usage', recordError));
		console.error('AI model creation error', cause);
		return error(503, 'Le service de consultation est momentanément indisponible.');
	}

	const result = streamText({
		model,
		system: buildArchiveSystemPrompt(hits),
		messages: [...input.history, { role: 'user' as const, content: input.message }],
		temperature: 0.1,
		maxOutputTokens: config.maxOutputTokens
	});

	const sources = hits.map(({ id, title, url, sourceType, score }) => ({
		id,
		title,
		...(url ? { url } : {}),
		sourceType,
		score: Number(score.toFixed(3))
	}));

	const encoder = new TextEncoder();
	const stream = new ReadableStream({
		async start(controller) {
			try {
				for await (const text of result.textStream) {
					controller.enqueue(encoder.encode(sse({ type: 'text', text })));
				}
				const usage = normalizeUsage(await result.usage);
				const totalTokens = usage.promptTokens + usage.completionTokens + embeddingTokens;
				try {
					await recordUsage(
						reservation,
						{
							inputTokens: usage.promptTokens + embeddingTokens,
							outputTokens: usage.completionTokens,
							costUsd:
								calculateCost(usage.promptTokens, usage.completionTokens, config) +
								embeddingCost(embeddingTokens, config)
						},
						providerConfig.modelName,
						config
					);
				} catch (cause) {
					console.error(
						'Failed to reconcile completed AI usage; reservation remains conservative',
						cause
					);
				}
				controller.enqueue(
					encoder.encode(
						sse({
							type: 'done',
							sources,
							inputTokens: usage.promptTokens + embeddingTokens,
							outputTokens: usage.completionTokens,
							totalTokens
						})
					)
				);
				controller.enqueue(encoder.encode(sse('[DONE]')));
				controller.close();
			} catch (cause) {
				console.error('AI generation error; preserving usage reservation', cause);
				controller.enqueue(
					encoder.encode(sse({ type: 'error', message: 'La réponse n’a pas pu être générée.' }))
				);
				controller.close();
			}
		}
	});

	return new Response(stream, {
		headers: {
			'content-type': 'text/event-stream; charset=utf-8',
			'cache-control': 'no-cache, no-transform',
			connection: 'keep-alive',
			'x-accel-buffering': 'no'
		}
	});
};
