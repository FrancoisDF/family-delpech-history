# Admin Improvements Plan

## Overview

Three improvements to the admin section:
1. **Unified admin page** — merge documents + links consoles into a single `/admin` page with side navigation
2. **Login gate** — simple shared password via `ADMIN_PASSWORD` env var, session stored in a cookie
3. **Build-time kill switch** — `ADMIN_ENABLED` env var; when `false`, admin routes and API endpoints are completely disabled

---

## 1. Build-Time Kill Switch (`ADMIN_ENABLED`)

### Env var
- `ADMIN_ENABLED` — set to `"true"` to enable admin. Any other value (or missing) = admin disabled.
- Read from `$env/static/private` so it's resolved at build time.

### Implementation

**`src/routes/admin/+layout.server.ts`** (new file)
- Read `ADMIN_ENABLED` from env.
- If not `"true"`, throw `error(404)` — the entire admin section returns 404 as if it doesn't exist.
- This covers both the admin UI pages and prevents navigation.

**All admin API routes** (`src/routes/api/admin/documents/+server.ts`, `[id]/+server.ts`, `links/+server.ts`, `links/[id]/+server.ts`)
- Import a shared guard function from `$lib/server/admin-auth.ts`.
- The guard checks `ADMIN_ENABLED` and returns 404 if disabled.
- This ensures the API endpoints are also dead when admin is off, even if someone hits them directly.

---

## 2. Simple Password Login

### How it works
- `ADMIN_PASSWORD` env var holds the shared password.
- On first admin access, the user sees a login form (password only, no username).
- On submit, the password is sent to a server action.
- Server compares using constant-time comparison, and on success sets an `admin_session` cookie (HttpOnly, SameSite=Strict, Secure in prod) containing a signed token (HMAC of a timestamp using `ADMIN_PASSWORD` as key).
- On every admin request (layout load + API calls), the server validates the cookie.
- If invalid or missing → redirect to login page (for UI) or 401 (for API).

### Files

**`src/lib/server/admin-auth.ts`** (new)
- `isAdminEnabled()` — checks `ADMIN_ENABLED === 'true'`
- `verifyAdminPassword(password: string)` — constant-time compare against `ADMIN_PASSWORD`
- `createAdminToken()` — returns HMAC-signed token with timestamp
- `validateAdminToken(token: string)` — validates HMAC, checks token age (24h max)
- `requireAdmin(cookies)` — checks cookie, throws 401/redirect if invalid
- `requireAdminApi(cookies)` — same but returns 401 JSON for API routes

**`src/routes/admin/+layout.server.ts`** (new)
- Check `ADMIN_ENABLED`. If disabled → 404.
- Check admin session cookie. If invalid → redirect to `/admin/login`.
- If valid → pass through (load returns `{ authenticated: true }`).

**`src/routes/admin/login/+page.svelte`** (new)
- Simple password form: one password field + submit button.
- Styled consistently with the rest of the admin.
- Shows error on wrong password.
- Uses a SvelteKit form action (POST).

**`src/routes/admin/login/+page.server.ts`** (new)
- Form action: validates password, sets cookie, redirects to `/admin`.
- The login page itself is exempt from the auth check (handled in the layout guard logic: if path is `/admin/login`, allow through without cookie).

**`src/routes/admin/+layout.server.ts`** guards logic:
```
1. if ADMIN_ENABLED !== 'true' → error(404)
2. if path is /admin/login → allow through (no cookie needed)
3. if no valid admin cookie → redirect(303, '/admin/login')
4. else → return { authenticated: true }
```

**API route protection** — each admin API route calls `requireAdminApi(cookies)` at the top of every handler (GET, POST, DELETE). Returns `{ error: 'Unauthorized' }` with 401 status if no valid cookie.

---

## 3. Unified Admin Page with Side Navigation

### Route structure change

Current:
```
/admin/documents  → documents page
/admin/links      → links page
```

New:
```
/admin            → unified page (default tab: documents)
/admin/login      → login form
```

The two separate pages (`/admin/documents/+page.svelte` and `/admin/links/+page.svelte`) will be **deleted** and their content merged into a single `/admin/+page.svelte`.

### Layout

**`src/routes/admin/+layout.svelte`** (new)
- Provides the admin shell: no site header/footer (or a minimal admin-specific header).
- Contains the side navigation and main content area.
- Uses a SvelteKit route group or just wraps `{@render children()}`.

Actually, simpler approach: since the login page also needs a layout, the admin layout will render differently based on whether we're on the login page or the main admin page:
- The `+layout.svelte` provides a minimal admin shell (no public site header/footer).
- The `+page.svelte` at `/admin` handles the tabbed content.

### Side navigation design
- Left sidebar (fixed width ~220px) with two nav items:
  - "Documents" (icon + label)
  - "Liens" (icon + label)
  - "Deconnexion" at the bottom
- Active tab highlighted.
- Main content area shows the selected panel.
- Tab state managed with a `$state` variable (no URL change needed, just in-page switching).
- On mobile: sidebar collapses to a top horizontal nav.

### Content panels
The documents panel and links panel keep their existing functionality, just extracted into the single page component. The logic from the two existing `+page.svelte` files is combined.

### Logout
- A "Deconnexion" button in the sidebar.
- Calls a server action or API endpoint that clears the `admin_session` cookie.
- Redirects to `/admin/login`.

**`src/routes/admin/logout/+page.server.ts`** (new)
- On load: clears cookie, redirects to `/admin/login`.

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/server/admin-auth.ts` | Auth helpers: token create/validate, password verify, guards |
| `src/routes/admin/+layout.svelte` | Admin shell (minimal header, no public header/footer) |
| `src/routes/admin/+layout.server.ts` | Kill switch + auth guard |
| `src/routes/admin/+page.svelte` | Unified admin page with side nav + documents/links panels |
| `src/routes/admin/login/+page.svelte` | Login form UI |
| `src/routes/admin/login/+page.server.ts` | Login form action (validate password, set cookie) |
| `src/routes/admin/logout/+page.server.ts` | Clear cookie + redirect |

## Files to Modify

| File | Change |
|------|---------|
| `src/routes/api/admin/documents/+server.ts` | Add `requireAdminApi()` guard |
| `src/routes/api/admin/documents/[id]/+server.ts` | Add `requireAdminApi()` guard |
| `src/routes/api/admin/links/+server.ts` | Add `requireAdminApi()` guard |
| `src/routes/api/admin/links/[id]/+server.ts` | Add `requireAdminApi()` guard |

## Files to Delete

| File | Reason |
|------|--------|
| `src/routes/admin/documents/+page.svelte` | Merged into `/admin/+page.svelte` |
| `src/routes/admin/links/+page.svelte` | Merged into `/admin/+page.svelte` |

## Env Vars Needed

| Variable | Purpose | Default |
|----------|---------|---------|
| `ADMIN_ENABLED` | Kill switch. Must be `"true"` to enable admin | disabled (404) |
| `ADMIN_PASSWORD` | Shared admin password | required when admin is enabled |

---

## Implementation Order

1. Create `src/lib/server/admin-auth.ts` (auth helpers)
2. Set `ADMIN_ENABLED` and `ADMIN_PASSWORD` env vars
3. Create `src/routes/admin/+layout.server.ts` (kill switch + auth guard)
4. Create `src/routes/admin/login/+page.server.ts` + `+page.svelte` (login flow)
5. Create `src/routes/admin/logout/+page.server.ts` (logout)
6. Create `src/routes/admin/+layout.svelte` (admin shell, no public header/footer)
7. Create unified `src/routes/admin/+page.svelte` (merge documents + links)
8. Add `requireAdminApi()` to all 4 API route files
9. Delete old `src/routes/admin/documents/+page.svelte` and `src/routes/admin/links/+page.svelte`
10. Test: disabled state (404), login flow, session persistence, API protection
