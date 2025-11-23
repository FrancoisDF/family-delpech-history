import { PUBLIC_BUILDER_API_KEY } from '$env/static/public';

const BUILDER_API_KEY = PUBLIC_BUILDER_API_KEY;
const BUILDER_API_URL = 'https://cdn.builder.io/api/v2/content';

export interface BuilderContent {
	id: string;
	name: string;
	data: Record<string, unknown>;
	[key: string]: unknown;
}

export async function fetchBuilderContentServer(
	model: string,
	options?: {
		limit?: number;
		offset?: number;
		preview?: boolean;
		query?: Record<string, unknown>;
	}
): Promise<BuilderContent[]> {
	try {
		const params = new URLSearchParams({
			apiKey: BUILDER_API_KEY,
			limit: String(options?.limit || 100),
			offset: String(options?.offset || 0),
			...(options?.preview && { preview: 'true' })
		});

		if (options?.query) {
			params.append('query', JSON.stringify(options.query));
		}

		const url = `${BUILDER_API_URL}/${model}?${params.toString()}`;
		const response = await fetch(url);

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`Builder.io API Error (${response.status}):`, errorText);
			throw new Error(
				`Builder.io API error: ${response.status} ${response.statusText}. Ensure the model "${model}" exists in Builder.io CMS.`
			);
		}

		const data = await response.json();
		return data.results || [];
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
		const params = new URLSearchParams({
			apiKey: BUILDER_API_KEY
		});

		const url = `${BUILDER_API_URL}/${model}/${id}?${params.toString()}`;
		const response = await fetch(url);

		if (!response.ok) {
			console.error(`Builder.io API Error (${response.status}) for ${model}/${id}`);
			throw new Error(
				`Builder.io API error: ${response.status} ${response.statusText}`
			);
		}

		const responseData = await response.json();
		// Return the full content object with id, name, data, etc.
		return (responseData.data || null) as BuilderContent;
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
		const params = new URLSearchParams({
			apiKey: BUILDER_API_KEY,
			limit: '1',
			query: JSON.stringify({
				'data.handle': handle
			})
		});

		const url = `${BUILDER_API_URL}/${model}?${params.toString()}`;
		const response = await fetch(url);

		if (!response.ok) {
			console.error(`Builder.io API Error (${response.status}) for ${model} handle:${handle}`);
			throw new Error(
				`Builder.io API error: ${response.status} ${response.statusText}`
			);
		}

		const data = await response.json();
		const results = data.results || [];
		return results.length > 0 ? results[0] : null;
	} catch (error) {
		console.error(
			`Could not fetch Builder.io content for ${model} with handle "${handle}". Error:`,
			error instanceof Error ? error.message : error
		);
		return null;
	}
}
