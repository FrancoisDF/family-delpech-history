import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { getAiRuntimeConfig, type AiRuntimeConfig } from './ai-config';

export interface UsageReservation {
	reservationId: string;
	visitorId: string;
	visitorHash: string;
	ipHash: string;
	requestId: string;
}

export interface UsageResult {
	inputTokens: number;
	outputTokens: number;
	costUsd: number;
}

interface SupabaseResult {
	allowed?: boolean;
	reason?: string;
	reservation_id?: string;
}

function hash(value: string): string {
	return createHash('sha256').update(value).digest('hex');
}

function sign(visitorId: string, secret: string): string {
	return createHmac('sha256', secret).update(visitorId).digest('base64url');
}

function isValidVisitorCookie(value: string | undefined, secret: string): value is string {
	if (!value) return false;
	const [visitorId, signature] = value.split('.');
	if (!visitorId || !signature || !/^[a-f0-9-]{20,80}$/.test(visitorId)) return false;
	const expected = sign(visitorId, secret);
	return (
		signature.length === expected.length &&
		timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
	);
}

export function getOrCreateVisitor(request: Request, cookies: Cookies, config: AiRuntimeConfig) {
	const existing = cookies.get('ai_visitor');
	const visitorId = isValidVisitorCookie(existing, config.visitorSecret)
		? existing!.split('.')[0]
		: randomUUID();
	if (!isValidVisitorCookie(existing, config.visitorSecret)) {
		cookies.set('ai_visitor', `${visitorId}.${sign(visitorId, config.visitorSecret)}`, {
			httpOnly: true,
			secure: new URL(request.url).protocol === 'https:',
			sameSite: 'lax',
			path: '/',
			maxAge: 60 * 60 * 24 * 365
		});
	}
	const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
	return { visitorId, visitorHash: hash(visitorId), ipHash: hash(ip) };
}

async function callUsageRpc(
	config: AiRuntimeConfig,
	functionName: string,
	body: Record<string, unknown>
) {
	const response = await fetch(`${config.supabaseUrl}/rest/v1/rpc/${functionName}`, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			apikey: config.supabaseServiceRoleKey,
			authorization: `Bearer ${config.supabaseServiceRoleKey}`
		},
		body: JSON.stringify(body),
		signal: AbortSignal.timeout(5000)
	});
	if (!response.ok) throw new Error(`Usage service returned ${response.status}`);
	if (response.status === 204) return undefined;
	const text = await response.text();
	return text ? JSON.parse(text) : undefined;
}

export async function reserveUsage(
	request: Request,
	cookies: Cookies,
	estimatedTokens: number,
	estimatedCostUsd: number,
	config = getAiRuntimeConfig()
): Promise<UsageReservation> {
	const identity = getOrCreateVisitor(request, cookies, config);
	const requestId = randomUUID();
	const result = (await callUsageRpc(config, 'reserve_ai_usage', {
		p_request_id: requestId,
		p_visitor_hash: identity.visitorHash,
		p_ip_hash: identity.ipHash,
		p_estimated_tokens: estimatedTokens,
		p_estimated_cost_usd: estimatedCostUsd,
		p_burst_limit: config.burstLimit,
		p_burst_window_seconds: config.burstWindowSeconds,
		p_daily_budget_usd: config.dailyVisitorBudgetUsd,
		p_daily_token_limit: config.dailyVisitorTokenLimit,
		p_monthly_budget_usd: config.monthlyBudgetUsd
	})) as SupabaseResult | SupabaseResult[];
	const reservation = Array.isArray(result) ? result[0] : result;
	if (!reservation?.allowed || !reservation.reservation_id) {
		const reason = reservation?.reason || 'budget';
		throw new UsageLimitError(reason);
	}
	return { ...identity, requestId, reservationId: reservation.reservation_id };
}

export async function recordUsage(
	reservation: UsageReservation,
	usage: UsageResult,
	model: string,
	config = getAiRuntimeConfig()
) {
	await callUsageRpc(config, 'record_ai_usage', {
		p_reservation_id: reservation.reservationId,
		p_request_id: reservation.requestId,
		p_visitor_hash: reservation.visitorHash,
		p_ip_hash: reservation.ipHash,
		p_model: model,
		p_status: 'completed',
		p_input_tokens: usage.inputTokens,
		p_output_tokens: usage.outputTokens,
		p_actual_cost_usd: usage.costUsd
	});
}

export function calculateCost(
	inputTokens: number,
	outputTokens: number,
	config: AiRuntimeConfig
): number {
	return (
		(inputTokens * config.inputCostPerMillion + outputTokens * config.outputCostPerMillion) /
		1_000_000
	);
}

export class UsageLimitError extends Error {
	constructor(public readonly reason: string) {
		super(reason);
	}
}
