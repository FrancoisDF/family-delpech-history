import { fetchOneEntry, fetchEntries } from '@builder.io/sdk-svelte';
import { PUBLIC_BUILDER_API_KEY } from '$env/static/public';

export interface BuilderContent {
	id?: string;
	name?: string;
	data?: Record<string, unknown>;
	[key: string]: unknown;
}

export async function fetchBuilderContentServer(
	model: string,
	options?: {
		limit?: number;
		offset?: number;
		preview?: boolean;
		omit?: string;
		query?: Record<string, unknown>;
	}
): Promise<BuilderContent[]> {
	try {
		const results = await fetchEntries({
			model,
			apiKey: PUBLIC_BUILDER_API_KEY,
			limit: options?.limit || 100,
			offset: options?.offset || 0,
			omit: options?.omit,
			query: options?.query
		});

		return results || [];
	} catch (error) {
		console.error(
			`Could not fetch Builder.io content for model "${model}". Error:`,
			error instanceof Error ? error.message : error
		);
		return [];
	}
}

export async function fetchBuilderContentByIdServer(
	model: string,
	id: string
): Promise<BuilderContent | null> {
	try {
		const result = await fetchOneEntry({
			model,
			apiKey: PUBLIC_BUILDER_API_KEY,
			options: {
				query: {
					id: id
				}
			}
		});

		return result || null;
	} catch (error) {
		console.error(
			`Could not fetch Builder.io content for ${model}/${id}. Error:`,
			error instanceof Error ? error.message : error
		);
		return null;
	}
}

export async function fetchBuilderContentByHandleServer(
	model: string,
	handle: string
): Promise<BuilderContent | null> {
	try {
		const results = await fetchEntries({
			model,
			apiKey: PUBLIC_BUILDER_API_KEY,
			limit: 1,
			query: {
				'data.handle': handle
			}
		});

		return results && results.length > 0 ? results[0] : null;
	} catch (error) {
		console.error(
			`Could not fetch Builder.io content for ${model} with handle "${handle}". Error:`,
			error instanceof Error ? error.message : error
		);
		return null;
	}
}
