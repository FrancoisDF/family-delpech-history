# Fix: Articles Tab Not Showing + Orphaned Ingested Articles

## Problem 1: Articles tab shows "Aucun article"

The `/api/admin/blog-posts` API fetches Builder posts then queries Supabase. If a Supabase query fails (missing table/column), the whole request returns 500. Multiple `onMount` loaders run in parallel and overwrite the shared `error` state, so the error may flash and disappear.

### Fix

- Make Supabase queries non-blocking: wrap in try/catch, return Builder posts with default values if DB queries fail
- In the admin page, don't overwrite `error` if it's already set (first error wins during parallel loads)

## Problem 2: Show orphaned ingested articles

Currently the API only returns articles that exist in Builder.io. Articles that were ingested but later unpublished/deleted from Builder are invisible — their chunks remain in the DB with no way to manage them.

### Fix

After merging Builder posts with ingestion data, check for `source_id` values in the ingestion map that don't match any Builder post. Return these as a separate `orphanedPosts` array with their title and chunk count (from the `documents` table metadata). The admin UI shows them in a warning section with a "Retirer" (remove ingestion) button.

---

## Files to Modify

### `src/routes/api/admin/blog-posts/+server.ts`

1. Wrap both Supabase queries in try/catch — if they fail, use empty maps and log the error
2. After building the `posts` array, compute orphaned entries:
   - For each `source_id` in `ingestionMap` that is NOT in the set of Builder post IDs, create an orphaned entry
   - Pull title from `documents.title` (query `documents` for one row per orphaned `source_id` to get the title)
   - Return `{ posts, orphanedPosts }`

### `src/routes/admin/+page.svelte`

1. Add `orphanedPosts` state array (type: `{ sourceId, title, chunks, ingestedDate }[]`)
2. In `loadArticles()`, populate `orphanedPosts` from `data.orphanedPosts`
3. In the Articles tab UI, after the main table, add a warning-styled section:
   - Header: "Articles ingeres mais retires de Builder.io" with count
   - List each orphaned post with title, chunk count, ingested date
   - "Retirer" button calls `DELETE /api/admin/blog-posts/{sourceId}/ingest` (existing endpoint)
4. Fix error handling: only set `error` if it's currently empty
