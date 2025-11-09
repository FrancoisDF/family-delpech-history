import { PUBLIC_BUILDER_API_KEY } from '$env/static/public';

const BUILDER_API_KEY = PUBLIC_BUILDER_API_KEY;
const BUILDER_API_URL = 'https://cdn.builder.io/api/v2/content';

export interface BuilderContent {
	id: string;
	name: string;
	data: Record<string, unknown>;
	[key: string]: unknown;
}

export async function fetchBuilderContent(
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

		const response = await fetch(`${BUILDER_API_URL}/${model}?${params.toString()}`);

		if (!response.ok) {
			throw new Error(`Builder.io API error: ${response.statusText}`);
		}

		const data = await response.json();
		return data.results || [];
	} catch (error) {
		console.error(`Error fetching Builder.io content for model ${model}:`, error);
		return [];
	}
}

export async function fetchBuilderContentById(
	model: string,
	id: string
): Promise<BuilderContent | null> {
	try {
		const params = new URLSearchParams({
			apiKey: BUILDER_API_KEY
		});

		const response = await fetch(`${BUILDER_API_URL}/${model}/${id}?${params.toString()}`);

		if (!response.ok) {
			throw new Error(`Builder.io API error: ${response.statusText}`);
		}

		const data = await response.json();
		return data.data || null;
	} catch (error) {
		console.error(`Error fetching Builder.io content for ${model}/${id}:`, error);
		return null;
	}
}
