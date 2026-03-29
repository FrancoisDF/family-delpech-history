# Decoupled Ingestion & Retrieval System — Implementation Plan

## Overview

Decouple document ingestion from Builder.io blog content. Documents (OCR family books) live in Supabase as the authoritative source. Blog posts (Builder.io) provide interpretive context. A many-to-many linking layer connects them. Chat retrieval searches documents first, then enriches answers with linked blog posts.

---

## Current State

- **Supabase `documents` table**: 1145 rows mixing blog post chunks and attachment chunks (all with embeddings, pgvector)
- **Ingestion scripts**: `ingest-builder-content.mjs` fetches Builder.io blog posts AND downloads attached PDFs/DOCX, producing a unified `family-data.json`. `ingest-to-supabase.mjs` embeds and inserts everything into one table.
- **Chat routes**: `/chat` (browser LLM + server RAG search) and `/ai-chat` (server AI + Supabase vector search) both query the single `documents` table via `match_documents` RPC.
- **No separation** between document types in the database.

## Target State

- **`source_documents` table**: Raw OCR books with metadata (not chunked)
- **`document_chunks` table**: Chunked + embedded content from source documents (`type: document`)
- **`blog_chunks` table** (or same table with `type: blog_post`): Chunked + embedded content from Builder.io blog posts
- **`document_blog_links` table**: Many-to-many mapping between source documents and Builder.io blog post IDs
- **Updated retrieval**: Search document chunks first → resolve linked blog posts → build grounded response
- **Admin pages**: Upload documents + manage document-blog links

---

## Phase 1: Database Schema Changes

### 1.1 Create `source_documents` table
Stores raw OCR books before chunking.

```sql
CREATE TABLE source_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,          -- full OCR text
  author TEXT,
  year TEXT,
  category TEXT,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE source_documents ENABLE ROW LEVEL SECURITY;
```

### 1.2 Add `content_type` column to existing `documents` table
Distinguish between document chunks and blog post chunks.

```sql
ALTER TABLE documents ADD COLUMN content_type TEXT NOT NULL DEFAULT 'document';
-- values: 'document' | 'blog_post'
ALTER TABLE documents ADD COLUMN source_document_id UUID REFERENCES source_documents(id);
```

### 1.3 Create `document_blog_links` table

```sql
CREATE TABLE document_blog_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_document_id UUID NOT NULL REFERENCES source_documents(id) ON DELETE CASCADE,
  builder_blog_id TEXT NOT NULL,      -- Builder.io blog post ID
  builder_blog_title TEXT,            -- denormalized for display
  builder_blog_url TEXT,              -- denormalized for display
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX idx_doc_blog_link ON document_blog_links(source_document_id, builder_blog_id);
ALTER TABLE document_blog_links ENABLE ROW LEVEL SECURITY;
```

### 1.4 Update `match_documents` RPC
Add `content_type` filter parameter to the existing vector search function so we can search documents only, blog posts only, or both.

```sql
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  filter_content_type text DEFAULT NULL
)
RETURNS TABLE (...existing columns..., content_type text, source_document_id uuid)
```

### 1.5 Create `match_documents_with_blogs` RPC
A convenience function that searches document chunks and JOINs linked blog posts in one query.

---

## Phase 2: Ingestion Pipeline Refactoring

### 2.1 New script: `scripts/ingest-documents.mjs`
- Reads from `source_documents` table in Supabase
- Chunks the `content` field (900 chars, 250 overlap)
- Generates embeddings with `Xenova/all-MiniLM-L6-v2`
- Inserts into `documents` table with `content_type: 'document'` and `source_document_id`

### 2.2 Refactor `scripts/ingest-builder-content.mjs`
- **Remove** all attachment downloading logic (PDF/DOCX extraction)
- Only extract blog post text + metadata from Builder.io
- Set `content_type: 'blog_post'` on all chunks
- Keep `sourceModel: 'blog-articles'`

### 2.3 Update `scripts/ingest-to-supabase.mjs`
- Add `content_type` field to inserted rows
- Support `--type document|blog_post` flag to ingest selectively
- Support `--clear-type document|blog_post` to clear only one type

### 2.4 New script: `scripts/ingest-all-content.js` update
- Run document ingestion and blog ingestion as separate steps
- Clear summary: "X document chunks, Y blog chunks ingested"

---

## Phase 3: Server-Side Retrieval Updates

### 3.1 Update `src/lib/server/vector-search.ts`
- Add `contentType` filter to `searchDocuments()` function
- New function: `searchDocumentsWithBlogLinks()` that:
  1. Searches `documents` where `content_type = 'document'`
  2. Collects `source_document_id` values from results
  3. Queries `document_blog_links` for linked blog post IDs
  4. Optionally fetches linked blog chunks from `documents` where `content_type = 'blog_post'`
  5. Returns `{ documentResults, linkedBlogPosts }`

### 3.2 Update `src/routes/api/rag-search/+server.ts`
- Use new `searchDocumentsWithBlogLinks()` 
- Return document chunks as primary results
- Return linked blog posts as supplementary context
- Response shape: `{ chunks, linkedBlogPosts, summaries }`

### 3.3 Update `src/routes/api/ai-vercel-chat/+server.ts`
- Search documents first (primary source)
- Resolve linked blog posts
- Build system prompt with:
  - Document content as ground truth
  - Blog post content as contextual enrichment
- Include blog post links in response for the user

---

## Phase 4: Chat UI Updates

### 4.1 Update `/chat` route (`src/routes/chat/+page.svelte`)
- Handle new response shape with `linkedBlogPosts`
- Show document sources as primary citations
- Show linked blog posts as "Related articles" links
- Keep existing streaming/fallback behavior

### 4.2 Update `/ai-chat` route (`src/routes/ai-chat/+page.svelte`)
- Display document sources distinctly from blog post references
- Add "Related articles" section when blog links exist
- Keep token tracking behavior

---

## Phase 5: Admin Pages

### 5.1 Document Upload Page (`/admin/documents`)
- Form with fields: title, OCR text (textarea), author, year, category, tags
- POST to `/api/admin/documents` endpoint
- Endpoint inserts into `source_documents`, then chunks + embeds + inserts into `documents`
- List view of existing source documents with delete capability

### 5.2 Document-Blog Link Manager (`/admin/links`)
- List of source documents (from Supabase)
- List of blog posts (fetched from Builder.io API)
- UI to create/delete links between them
- POST/DELETE to `/api/admin/links` endpoint

### 5.3 API Routes
- `POST /api/admin/documents` — create source document + auto-ingest chunks
- `DELETE /api/admin/documents/[id]` — delete source document + its chunks
- `GET /api/admin/documents` — list all source documents
- `POST /api/admin/links` — create document-blog link
- `DELETE /api/admin/links/[id]` — delete link
- `GET /api/admin/links` — list all links

---

## Phase 6: Data Migration

### 6.1 Migrate existing data
- Tag existing `documents` rows with appropriate `content_type` based on `source_model`:
  - `source_model = 'blog-articles'` → `content_type = 'blog_post'`
  - `source_model = 'documents'` or `'builder-attachments'` → `content_type = 'document'`
- For attachment chunks that have `originPostId`, create entries in `document_blog_links`

---

## Key Files to Modify

| File | Change |
|------|--------|
| `src/lib/server/vector-search.ts` | Add content type filtering, blog link resolution |
| `src/routes/api/rag-search/+server.ts` | Return documents + linked blogs |
| `src/routes/api/ai-vercel-chat/+server.ts` | Document-first retrieval with blog enrichment |
| `src/routes/chat/+page.svelte` | Show document sources + related blog links |
| `src/routes/ai-chat/+page.svelte` | Show document sources + related blog links |
| `scripts/ingest-builder-content.mjs` | Remove attachment downloading |
| `scripts/ingest-to-supabase.mjs` | Add content_type support |
| `src/lib/ai/vercel-generation.ts` | Update prompt building for dual sources |

## New Files

| File | Purpose |
|------|---------|
| `src/routes/admin/documents/+page.svelte` | Document upload/management UI |
| `src/routes/admin/documents/+page.server.ts` | Server actions for document CRUD |
| `src/routes/admin/links/+page.svelte` | Document-blog link management UI |
| `src/routes/admin/links/+page.server.ts` | Server actions for link CRUD |
| `src/routes/api/admin/documents/+server.ts` | Document API endpoint |
| `src/routes/api/admin/links/+server.ts` | Links API endpoint |
| `scripts/ingest-documents.mjs` | Standalone document ingestion from Supabase |

---

## Implementation Order

1. **Database schema** — migrations for new tables + columns
2. **Data migration** — tag existing rows with content_type
3. **Server retrieval** — update vector search + API routes
4. **Ingestion refactoring** — separate document and blog pipelines
5. **Chat UI** — update both chat routes for new response shape
6. **Admin pages** — document upload + link management
