# Admin Panel Improvements Plan

## Overview

Three areas of improvement to the unified `/admin` page:

1. **New "Articles" tab** — table of all Builder.io blog posts with ingestion status, dates, and linked documents
2. **Documents tab** — collapsible "add" form, enhanced delete with impact preview
3. **Links tab** — collapsible "create" form, show unlinked documents

---

## 1. New "Articles" Tab (Blog Posts Ingestion Manager)

### What it shows

A table of all published Builder.io blog posts (`blog-articles` model) with columns:
- Title
- Published date (from Builder)
- Ingestion status (ingested / not ingested)
- Ingestion date (from `documents` table, `created_at` of earliest chunk)
- Linked documents count (from `document_blog_links`)

### How ingestion status is determined

Query the `documents` table for rows where `content_type = 'blog_post'` and `source_model = 'blog-articles'`, grouped by `source_id`. Each `source_id` corresponds to a Builder entry ID. Cross-reference with the full list of Builder posts to determine which are ingested.

### Actions per row

When a row is selected/expanded:
- **Remove from ingestion** — deletes all `documents` rows where `source_id = builder_post_id` and `content_type = 'blog_post'`
- **Re-ingest** — deletes existing chunks, then re-fetches the Builder post content, chunks it, generates embeddings, and inserts new rows into `documents`

### New API routes

**`src/routes/api/admin/blog-posts/+server.ts`** (GET)
- Fetches all Builder blog posts (via Builder Content API, server-side)
- Queries Supabase `documents` for all `content_type = 'blog_post'` rows grouped by `source_id` to get ingestion status + dates
- Queries `document_blog_links` grouped by `builder_blog_id` to get link counts
- Returns merged list

**`src/routes/api/admin/blog-posts/[id]/ingest/+server.ts`** (POST + DELETE)
- POST: Fetches the single Builder post by ID, extracts text, chunks, generates embeddings, inserts into `documents` with `content_type = 'blog_post'`
- DELETE: Removes all `documents` rows where `source_id = id` and `content_type = 'blog_post'`

### Text extraction

Reuse the extraction logic from `scripts/ingest-builder-content.mjs` but adapted for server-side use. The script currently:
1. Fetches Builder entry
2. Extracts text from `data.blocks` recursively (via helpers in `scripts/lib/component-extraction-helpers.mjs`)
3. Chunks the text

For server-side, create a utility in `src/lib/server/blog-ingest.ts` that:
- Port the extraction helpers from `scripts/lib/component-extraction-helpers.mjs` (only `getHeaderFieldNames`, `getBlockComponentName`, `getBlockData`, and the `EXTRACTABLE_COMPONENTS` config are needed for text extraction)
- Port `extractBuilderPostText()` from `scripts/ingest-builder-content.mjs` — this recursively collects text from Builder blocks using `collectTextDeep()`, `stripHtml()`, `normalizeReadableText()`, etc.
- Port `chunkText()` with same parameters (900 chars, 250 overlap, 50 min)
- Port `ensureInternalPostHandle()` and URL generation for `/histoires/{handle}` links
- Export a high-level `ingestBlogPost(entry)` function that takes a Builder entry, extracts text, chunks, generates embeddings via `generateEmbedding()`, and upserts into `documents`
- Export a `removeBlogPostIngestion(sourceId)` function that deletes all `documents` rows for that `source_id`

The text extraction is done entirely server-side — no Builder CDN call from the client. The existing `fetchBuilderContentServer` (using `@builder.io/sdk-svelte`) will fetch the entry including its `data.blocks`.

### Sidebar addition

Add a third nav item "Articles" in the sidebar, between Documents and Liens (or first).

---

## 2. Documents Tab — Enhanced Delete + Collapsible Form

### Collapsible "Add Document" form

Replace the always-visible form with a collapsible section:
- A button "Ajouter un document" toggles the form open/closed
- Default state: collapsed (closed)
- The document list is always visible and prominent

### Enhanced delete with impact preview

When clicking "Supprimer" on a document, instead of a simple `confirm()`, show a modal/expanded section that lists:
- Number of chunks in `documents` that will be deleted (query `documents` where `source_document_id = id`)
- Number of links in `document_blog_links` that will be deleted (query `document_blog_links` where `source_document_id = id`)
- Names of linked blog posts that will lose this link

### New API route for impact preview

**`src/routes/api/admin/documents/[id]/impact/+server.ts`** (GET)
- Returns:
  - `chunksCount`: count of rows in `documents` where `source_document_id = id`
  - `links`: array of `{ id, builder_blog_title, builder_blog_url }` from `document_blog_links` where `source_document_id = id`

### Updated delete flow

Update `src/routes/api/admin/documents/[id]/+server.ts` DELETE handler to also delete associated `document_blog_links` rows before deleting chunks and the source document:
1. Delete from `document_blog_links` where `source_document_id = id`
2. Delete from `documents` where `source_document_id = id`
3. Delete from `source_documents` where `id = id`

---

## 3. Links Tab — Unlinked Documents + Collapsible Form

### Collapsible "Create Link" form

Same pattern as documents: a toggle button, form collapsed by default, link list always visible.

### Show unlinked documents

Add a section above or below the existing links list: "Documents sans lien" (Documents without links).

Query logic: fetch all `source_documents`, then subtract those that have at least one entry in `document_blog_links`.

### New API route

**`src/routes/api/admin/links/unlinked/+server.ts`** (GET)
- Query `source_documents` LEFT JOIN `document_blog_links` where there is no matching link
- Or: fetch all source doc IDs, fetch all linked doc IDs, compute the difference
- Return list of `{ id, title, created_at }` for unlinked documents

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/server/blog-ingest.ts` | Server-side blog post extraction, chunking, embedding |
| `src/routes/api/admin/blog-posts/+server.ts` | GET: list all blog posts with ingestion status |
| `src/routes/api/admin/blog-posts/[id]/ingest/+server.ts` | POST: ingest, DELETE: remove ingestion |
| `src/routes/api/admin/documents/[id]/impact/+server.ts` | GET: impact preview before delete |
| `src/routes/api/admin/links/unlinked/+server.ts` | GET: documents without links |

## Files to Modify

| File | Change |
|------|--------|
| `src/routes/admin/+page.svelte` | Add Articles tab, collapsible forms, enhanced delete, unlinked docs section |
| `src/routes/api/admin/documents/[id]/+server.ts` | Also delete `document_blog_links` rows on document delete |

---

## Implementation Order

1. Create `src/lib/server/blog-ingest.ts` — text extraction + chunking + embedding utility
2. Create blog posts API routes (list + ingest/remove)
3. Create document impact preview API route
4. Create unlinked documents API route
5. Update document delete API to also remove links
6. Update `src/routes/admin/+page.svelte`:
   a. Add "Articles" tab with blog posts table
   b. Make documents "add" form collapsible
   c. Add enhanced delete with impact preview modal
   d. Make links "create" form collapsible
   e. Add unlinked documents section in links tab
7. Add auth guards (`requireAdminApi`) to all new API routes
