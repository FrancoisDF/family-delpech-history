import { getAiRuntimeConfig, type AiRuntimeConfig } from './ai-config';

export interface ArchiveSource {
	id: string;
	title: string;
	url?: string;
	sourceType: string;
	score: number;
}

export interface ArchiveHit extends ArchiveSource {
	content: string;
}

interface EmbeddingResponse {
	data?: Array<{ embedding?: number[] }>;
}

function isSafeSourceUrl(value: unknown): value is string {
	if (typeof value !== 'string' || value.length > 2000) return false;
	if (value.startsWith('/')) return !value.startsWith('//');
	try {
		const url = new URL(value);
		return url.protocol === 'https:' || url.protocol === 'http:';
	} catch {
		return false;
	}
}

function asString(value: unknown): string {
	return typeof value === 'string' ? value.trim() : '';
}

function asScore(value: unknown): number {
	const score = typeof value === 'number' ? value : Number(value);
	return Number.isFinite(score) ? score : 0;
}

export function normalizeArchiveResults(rows: unknown, threshold: number): ArchiveHit[] {
	if (!Array.isArray(rows)) return [];
	const unique = new Set<string>();
	const hits: ArchiveHit[] = [];

	for (const row of rows) {
		if (!row || typeof row !== 'object') continue;
		const item = row as Record<string, unknown>;
		const content = asString(item.content ?? item.text ?? item.chunk ?? item.document);
		const title = asString(item.title ?? item.source_title ?? item.name) || 'Archive familiale';
		const id = asString(item.id ?? item.document_id ?? item.source_id ?? item.sourceId);
		const score = asScore(item.similarity ?? item.score ?? item.match_score);
		if (!content || !id || score < threshold || unique.has(id)) continue;
		unique.add(id);
		hits.push({
			id,
			title,
			content,
			score,
			sourceType: asString(item.source_type ?? item.sourceType ?? item.type) || 'document',
			...(isSafeSourceUrl(item.url ?? item.source_url ?? item.sourceUrl)
				? { url: (item.url ?? item.source_url ?? item.sourceUrl) as string }
				: {})
		});
	}

	return hits.sort((a, b) => b.score - a.score);
}

async function postJson(
	url: string,
	body: unknown,
	headers: Record<string, string>
): Promise<unknown> {
	const response = await fetch(url, {
		method: 'POST',
		headers: { 'content-type': 'application/json', ...headers },
		body: JSON.stringify(body),
		signal: AbortSignal.timeout(10000)
	});
	if (!response.ok) throw new Error(`Archive service returned ${response.status}`);
	return response.json();
}

export async function createQueryEmbedding(
	query: string,
	config = getAiRuntimeConfig()
): Promise<number[]> {
	const result = (await postJson(
		`${config.embeddingApiBase}/embeddings`,
		{ input: query, model: config.embeddingModel },
		{ authorization: `Bearer ${config.embeddingApiKey}` }
	)) as EmbeddingResponse;
	const embedding = result.data?.[0]?.embedding;
	if (!embedding || embedding.length === 0 || embedding.some((value) => !Number.isFinite(value))) {
		throw new Error('Embedding provider returned an invalid vector');
	}
	return embedding;
}

export async function searchArchive(
	query: string,
	config = getAiRuntimeConfig()
): Promise<ArchiveHit[]> {
	const embedding = await createQueryEmbedding(query, config);
	const body = {
		[config.vectorSearchParameter]: embedding,
		match_threshold: config.vectorMatchThreshold,
		match_count: config.vectorMatchCount
	};
	const result = await postJson(
		`${config.supabaseUrl}/rest/v1/rpc/${encodeURIComponent(config.vectorSearchFunction)}`,
		body,
		{
			apikey: config.supabaseServiceRoleKey,
			authorization: `Bearer ${config.supabaseServiceRoleKey}`
		}
	);
	return normalizeArchiveResults(result, config.vectorMatchThreshold).slice(
		0,
		config.vectorMatchCount
	);
}

export function buildArchiveContext(hits: ArchiveHit[], maxCharacters = 12000): string {
	let remaining = maxCharacters;
	const sections: string[] = [];
	for (const hit of hits) {
		if (remaining <= 0) break;
		const content = hit.content.slice(0, remaining);
		sections.push(`[${hit.id}] ${hit.title}\n${content}`);
		remaining -= content.length;
	}
	return sections.join('\n\n');
}

export function getPublicSourceUrl(source: ArchiveSource): string | undefined {
	if (source.url && isSafeSourceUrl(source.url)) return source.url;
	return undefined;
}
