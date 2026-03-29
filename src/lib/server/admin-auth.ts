/**
 * Admin authentication helpers.
 * - Kill switch via ADMIN_ENABLED env var
 * - Password-based login with HMAC-signed session tokens
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import type { Cookies } from '@sveltejs/kit';

const COOKIE_NAME = 'admin_session';
const TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const COOKIE_MAX_AGE_S = 24 * 60 * 60; // 24 hours in seconds

function getPassword(): string {
	return env.ADMIN_PASSWORD || '';
}

export function isAdminEnabled(): boolean {
	return env.ADMIN_ENABLED === 'true';
}

/**
 * Constant-time password comparison.
 */
export function verifyAdminPassword(password: string): boolean {
	const adminPassword = getPassword();
	if (!adminPassword) return false;
	const a = Buffer.from(password);
	const b = Buffer.from(adminPassword);
	if (a.length !== b.length) return false;
	return timingSafeEqual(a, b);
}

/**
 * Create an HMAC-signed token containing a timestamp.
 */
export function createAdminToken(): string {
	const timestamp = Date.now().toString();
	const hmac = createHmac('sha256', getPassword()).update(timestamp).digest('hex');
	return `${timestamp}.${hmac}`;
}

/**
 * Validate an HMAC-signed token. Returns true if valid and not expired.
 */
export function validateAdminToken(token: string): boolean {
	const adminPassword = getPassword();
	if (!token || !adminPassword) return false;

	const dotIndex = token.indexOf('.');
	if (dotIndex === -1) return false;

	const timestamp = token.substring(0, dotIndex);
	const signature = token.substring(dotIndex + 1);

	// Check age
	const tokenAge = Date.now() - parseInt(timestamp, 10);
	if (isNaN(tokenAge) || tokenAge < 0 || tokenAge > TOKEN_MAX_AGE_MS) return false;

	// Verify HMAC
	const expectedSig = createHmac('sha256', adminPassword).update(timestamp).digest('hex');
	const a = Buffer.from(signature, 'hex');
	const b = Buffer.from(expectedSig, 'hex');
	if (a.length !== b.length) return false;

	return timingSafeEqual(a, b);
}

/**
 * Set the admin session cookie.
 */
export function setAdminCookie(cookies: Cookies): void {
	const token = createAdminToken();
	cookies.set(COOKIE_NAME, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: !dev,
		maxAge: COOKIE_MAX_AGE_S
	});
}

/**
 * Clear the admin session cookie.
 */
export function clearAdminCookie(cookies: Cookies): void {
	cookies.delete(COOKIE_NAME, { path: '/' });
	// Also clear legacy cookie that may have been set with path=/admin
	cookies.delete(COOKIE_NAME, { path: '/admin' });
}

/**
 * Check if the current request has a valid admin session cookie.
 */
export function hasValidAdminSession(cookies: Cookies): boolean {
	const token = cookies.get(COOKIE_NAME);
	if (!token) return false;
	return validateAdminToken(token);
}

/**
 * Guard for API routes: checks admin enabled + valid session.
 * Returns a Response if unauthorized, or null if OK.
 */
export function requireAdminApi(cookies: Cookies): Response | null {
	if (!isAdminEnabled()) {
		return new Response(JSON.stringify({ error: 'Not found' }), {
			status: 404,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	if (!hasValidAdminSession(cookies)) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	return null;
}
