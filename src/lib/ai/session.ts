/**
 * Session and token management for Vercel AI chat
 * Stores session data in localStorage to track daily token usage
 * Phase 2: Tracks session context (summaries used) for context reuse
 */

export interface SessionContext {
	summariesUsed: string[];
	lastQueryTime: number;
	queryCount: number;
}

export interface AISession {
	sessionId: string;
	tokensUsedToday: number;
	lastUsedDate: string;
	sessionStartTime: number;
	remainingBudget: number;
	sessionContext?: SessionContext;
}

const DAILY_TOKEN_BUDGET = 5000;
const SESSION_STORAGE_KEY = 'ai_vercel_session';

/**
 * Get today's date string (YYYY-MM-DD)
 */
function getTodayString(): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

/**
 * Generate a random session ID
 */
function generateSessionId(): string {
	return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Initialize or restore session from localStorage
 */
export function initSession(): AISession {
	if (typeof window === 'undefined') {
		throw new Error('Session management must be called from browser context');
	}

	try {
		const stored = localStorage.getItem(SESSION_STORAGE_KEY);
		if (stored) {
			const session: AISession = JSON.parse(stored);
			const today = getTodayString();

			// Check if session is from today
			if (session.lastUsedDate !== today) {
				// Reset for new day
				const newSession: AISession = {
					sessionId: generateSessionId(),
					tokensUsedToday: 0,
					lastUsedDate: today,
					sessionStartTime: Date.now(),
					remainingBudget: DAILY_TOKEN_BUDGET,
					sessionContext: {
						summariesUsed: [],
						lastQueryTime: Date.now(),
						queryCount: 0
					}
				};
				localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
				return newSession;
			}

			// Ensure sessionContext exists (for backwards compatibility)
			if (!session.sessionContext) {
				session.sessionContext = {
					summariesUsed: [],
					lastQueryTime: Date.now(),
					queryCount: 0
				};
			}

			return session;
		}

		// Create new session
		const today = getTodayString();
		const newSession: AISession = {
			sessionId: generateSessionId(),
			tokensUsedToday: 0,
			lastUsedDate: today,
			sessionStartTime: Date.now(),
			remainingBudget: DAILY_TOKEN_BUDGET,
			sessionContext: {
				summariesUsed: [],
				lastQueryTime: Date.now(),
				queryCount: 0
			}
		};
		localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
		return newSession;
	} catch (err) {
		console.warn('Failed to initialize session:', err);
		throw new Error('Failed to initialize session');
	}
}

/**
 * Get the current session
 */
export function getSession(): AISession | null {
	if (typeof window === 'undefined') {
		return null;
	}

	try {
		const stored = localStorage.getItem(SESSION_STORAGE_KEY);
		if (!stored) return null;

		const session: AISession = JSON.parse(stored);
		const today = getTodayString();

		// Check if session is expired
		if (session.lastUsedDate !== today) {
			// Session has expired, return null to trigger re-initialization
			return null;
		}

		return session;
	} catch (err) {
		console.warn('Failed to get session:', err);
		return null;
	}
}

/**
 * Check if user has exceeded daily budget
 */
export function hasExceededBudget(): boolean {
	const session = getSession();
	if (!session) return false;
	return session.tokensUsedToday >= DAILY_TOKEN_BUDGET;
}

/**
 * Get tokens remaining for the day
 */
export function getTokensRemaining(): number {
	const session = getSession();
	if (!session) return DAILY_TOKEN_BUDGET;
	return Math.max(0, DAILY_TOKEN_BUDGET - session.tokensUsedToday);
}

/**
 * Check if a request with estimated tokens would exceed budget
 */
export function canMakeRequest(estimatedTokens: number): boolean {
	const remaining = getTokensRemaining();
	return estimatedTokens <= remaining;
}

/**
 * Record token usage and update session
 */
export function recordTokens(inputTokens: number, outputTokens: number): void {
	if (typeof window === 'undefined') {
		return;
	}

	try {
		const session = initSession(); // Ensure session is initialized
		const totalTokens = inputTokens + outputTokens;
		const newTotal = session.tokensUsedToday + totalTokens;

		const updated: AISession = {
			...session,
			tokensUsedToday: Math.min(newTotal, DAILY_TOKEN_BUDGET),
			remainingBudget: Math.max(0, DAILY_TOKEN_BUDGET - newTotal)
		};

		localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
	} catch (err) {
		console.warn('Failed to record tokens:', err);
	}
}

/**
 * Check if session has expired (new day)
 */
export function isSessionExpired(): boolean {
	const session = getSession();
	if (!session) return true;
	return session.lastUsedDate !== getTodayString();
}

/**
 * Get session status warnings
 */
export function getSessionWarnings(): {
	isExpired: boolean;
	budgetExceeded: boolean;
	warningLevel: 'none' | 'low' | 'warning' | 'critical';
	message: string;
} {
	const isExpired = isSessionExpired();
	const budgetExceeded = hasExceededBudget();
	const remaining = getTokensRemaining();
	const used = DAILY_TOKEN_BUDGET - remaining;

	let warningLevel: 'none' | 'low' | 'warning' | 'critical' = 'none';
	let message = '';

	if (budgetExceeded) {
		warningLevel = 'critical';
		message = 'Daily limit reached. Please come back tomorrow to continue.';
	} else if (remaining < 500) {
		warningLevel = 'warning';
		message = `Only ${remaining} tokens remaining today.`;
	} else if (remaining < 1500) {
		warningLevel = 'low';
		message = `${remaining} tokens remaining (${Math.round((used / DAILY_TOKEN_BUDGET) * 100)}% used today).`;
	}

	return {
		isExpired,
		budgetExceeded,
		warningLevel,
		message
	};
}

/**
 * Reset session (for testing)
 */
export function resetSession(): void {
	if (typeof window === 'undefined') {
		return;
	}

	try {
		localStorage.removeItem(SESSION_STORAGE_KEY);
	} catch (err) {
		console.warn('Failed to reset session:', err);
	}
}

/**
 * Get daily budget
 */
export function getDailyBudget(): number {
	return DAILY_TOKEN_BUDGET;
}

// ============================================================================
// Phase 2: Session Context Management
// ============================================================================

/**
 * Get current session context
 */
export function getSessionContext(): SessionContext | null {
	const session = getSession();
	if (!session) return null;
	return session.sessionContext || null;
}

/**
 * Update session context with summaries used in the current query
 */
export function updateSessionContext(summaryIds: string[]): SessionContext {
	if (typeof window === 'undefined') {
		throw new Error('Session context management must be called from browser context');
	}

	try {
		const session = initSession();
		const now = Date.now();

		// Merge summaries (add new ones, keep previous ones for context)
		const existingSummaries = session.sessionContext?.summariesUsed || [];
		const newSummaries = Array.from(new Set([...existingSummaries, ...summaryIds]));

		// Limit to last 10 summaries to avoid memory bloat
		const trimmedSummaries = newSummaries.slice(-10);

		const updated: SessionContext = {
			summariesUsed: trimmedSummaries,
			lastQueryTime: now,
			queryCount: (session.sessionContext?.queryCount || 0) + 1
		};

		const updatedSession: AISession = {
			...session,
			sessionContext: updated
		};

		localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSession));
		return updated;
	} catch (err) {
		console.warn('Failed to update session context:', err);
		throw new Error('Failed to update session context');
	}
}

/**
 * Check if session context is still "hot" (recent enough to reuse)
 * Default: 5 minutes
 */
export function isSessionContextHot(maxAgeMs: number = 5 * 60 * 1000): boolean {
	const context = getSessionContext();
	if (!context) return false;

	const ageMs = Date.now() - context.lastQueryTime;
	return ageMs <= maxAgeMs;
}

/**
 * Get cached summaries from session context
 */
export function getCachedSummaryIds(): string[] {
	const context = getSessionContext();
	if (!context || !isSessionContextHot()) {
		return [];
	}
	return context.summariesUsed || [];
}

/**
 * Clear session context (for testing or manual reset)
 */
export function clearSessionContext(): void {
	if (typeof window === 'undefined') {
		return;
	}

	try {
		const session = getSession();
		if (session) {
			const updated: AISession = {
				...session,
				sessionContext: {
					summariesUsed: [],
					lastQueryTime: Date.now(),
					queryCount: 0
				}
			};
			localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
		}
	} catch (err) {
		console.warn('Failed to clear session context:', err);
	}
}
