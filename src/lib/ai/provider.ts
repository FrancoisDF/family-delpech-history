/**
 * Provider Factory: Abstract AI provider initialization
 * Supports both Anthropic and OpenAI-compatible servers
 * Configuration via environment variables
 */

import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';

export interface ProviderConfig {
	provider: 'anthropic' | 'openai';
	apiKey: string;
	modelName: string;
	baseUrl?: string; // For OpenAI-compatible servers
}

export interface NormalizedUsage {
	promptTokens: number;
	completionTokens: number;
}

/**
 * Get provider configuration from environment variables
 * Validates that required keys are present for the selected provider
 */
export function getProviderConfig(): ProviderConfig {
	const provider = (process.env.AI_PROVIDER || 'anthropic') as 'anthropic' | 'openai';

	if (provider === 'openai') {
		const apiKey = process.env.OPENAI_API_KEY;
		if (!apiKey) {
			throw new Error(
				'OPENAI_API_KEY environment variable is required when AI_PROVIDER=openai'
			);
		}

		const modelName = process.env.OPENAI_MODEL;
		if (!modelName) {
			throw new Error('OPENAI_MODEL environment variable is required when AI_PROVIDER=openai');
		}

		const baseUrl = process.env.OPENAI_API_BASE;

		return {
			provider: 'openai',
			apiKey,
			modelName,
			baseUrl
		};
	}

	// Default to Anthropic
	const apiKey = process.env.ANTHROPIC_API_KEY;
	if (!apiKey) {
		throw new Error(
			'ANTHROPIC_API_KEY environment variable is required when AI_PROVIDER=anthropic'
		);
	}

	const modelName = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';

	return {
		provider: 'anthropic',
		apiKey,
		modelName
	};
}

/**
 * Create a model for chat/generation via Vercel AI SDK
 * Returns a LanguageModel that can be used with generateText()
 */
export function createModelForChat(): LanguageModel {
	const config = getProviderConfig();

	if (config.provider === 'openai') {
		const openaiClient = createOpenAI({
			apiKey: config.apiKey,
			baseURL: config.baseUrl
		});
		return openaiClient(config.modelName);
	}

	// Anthropic
	const anthropicClient = createAnthropic({
		apiKey: config.apiKey
	});
	return anthropicClient(config.modelName);
}

/**
 * Normalize usage object across providers
 * Vercel AI SDK normalizes these to camelCase (promptTokens, completionTokens)
 * but we provide this for consistency and explicit typing
 */
export function normalizeUsage(usage: any): NormalizedUsage {
	return {
		promptTokens: usage.promptTokens || usage.prompt_tokens || 0,
		completionTokens: usage.completionTokens || usage.completion_tokens || 0
	};
}

/**
 * Get provider information for logging/debugging
 */
export function getProviderInfo(): string {
	const config = getProviderConfig();
	if (config.provider === 'openai') {
		return `OpenAI-compatible (${config.baseUrl || 'api.openai.com'}) with model ${config.modelName}`;
	}
	return `Anthropic with model ${config.modelName}`;
}
