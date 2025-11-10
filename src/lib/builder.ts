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
		console.warn(
			`Could not fetch Builder.io content for model "${model}". Using fallback data. Error:`,
			error instanceof Error ? error.message : error
		);
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
