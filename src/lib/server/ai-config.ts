export interface AiRuntimeConfig {
	supabaseUrl: string;
	supabaseServiceRoleKey: string;
	vectorSearchFunction: string;
	vectorSearchParameter: string;
	vectorMatchCount: number;
	vectorMatchThreshold: number;
	embeddingApiKey: string;
	embeddingModel: string;
	embeddingApiBase: string;
	monthlyBudgetUsd: number;
	dailyVisitorBudgetUsd: number;
	dailyVisitorTokenLimit: number;
	burstLimit: number;
	burstWindowSeconds: number;
	maxMessageLength: number;
	maxHistoryMessages: number;
	maxOutputTokens: number;
	reserveCostUsd: number;
	visitorSecret: string;
	inputCostPerMillion: number;
	outputCostPerMillion: number;
}

function required(name: string): string {
	const value = process.env[name]?.trim();
	if (!value) throw new Error(`${name} environment variable is required`);
	return value;
}

function numberEnv(name: string, fallback: number): number {
	const value = process.env[name];
	if (!value) return fallback;
	const parsed = Number(value);
	if (!Number.isFinite(parsed) || parsed < 0)
		throw new Error(`${name} must be a non-negative number`);
	return parsed;
}

function integerEnv(name: string, fallback: number): number {
	const value = numberEnv(name, fallback);
	if (!Number.isInteger(value)) throw new Error(`${name} must be an integer`);
	return value;
}

export function getAiRuntimeConfig(): AiRuntimeConfig {
	const embeddingApiKey =
		process.env.EMBEDDING_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
	if (!embeddingApiKey) {
		throw new Error('EMBEDDING_API_KEY or OPENAI_API_KEY environment variable is required');
	}

	return {
		supabaseUrl: required('SUPABASE_URL').replace(/\/$/, ''),
		supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
		vectorSearchFunction: process.env.SUPABASE_VECTOR_SEARCH_FUNCTION?.trim() || 'match_documents',
		vectorSearchParameter: process.env.SUPABASE_VECTOR_QUERY_PARAMETER?.trim() || 'query_embedding',
		vectorMatchCount: integerEnv('SUPABASE_VECTOR_MATCH_COUNT', 6),
		vectorMatchThreshold: numberEnv('SUPABASE_VECTOR_MATCH_THRESHOLD', 0.7),
		embeddingApiKey,
		embeddingModel: required('EMBEDDING_MODEL'),
		embeddingApiBase: (
			process.env.EMBEDDING_API_BASE?.trim() ||
			process.env.OPENAI_API_BASE?.trim() ||
			'https://api.openai.com/v1'
		).replace(/\/$/, ''),
		monthlyBudgetUsd: numberEnv('AI_MONTHLY_BUDGET_USD', 20),
		dailyVisitorBudgetUsd: numberEnv('AI_DAILY_VISITOR_BUDGET_USD', 0.25),
		dailyVisitorTokenLimit: integerEnv('AI_DAILY_VISITOR_TOKEN_LIMIT', 5000),
		burstLimit: integerEnv('AI_BURST_LIMIT', 8),
		burstWindowSeconds: integerEnv('AI_BURST_WINDOW_SECONDS', 60),
		maxMessageLength: integerEnv('AI_MAX_MESSAGE_LENGTH', 1200),
		maxHistoryMessages: integerEnv('AI_MAX_HISTORY_MESSAGES', 6),
		maxOutputTokens: integerEnv('AI_MAX_OUTPUT_TOKENS', 320),
		reserveCostUsd: numberEnv('AI_RESERVE_COST_USD', 0.01),
		visitorSecret: required('AI_VISITOR_SECRET'),
		inputCostPerMillion: numberEnv('AI_INPUT_COST_PER_MILLION', 0.25),
		outputCostPerMillion: numberEnv('AI_OUTPUT_COST_PER_MILLION', 1.25)
	};
}

export const ARCHIVE_NOT_FOUND_MESSAGE =
	"Je n'ai pas trouvé cette information dans les archives familiales.";
