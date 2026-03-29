# Plan: Migrate RAG to Supabase + pgvector

## Problem

The current RAG system uses static JSON files + TF-IDF embeddings loaded client-side. With 50 blog posts + 50 text files (10MB each = ~500MB raw text), this approach won't work:

- **Client-side**: Loading 500MB+ of JSON in the browser would crash most devices
- **TF-IDF**: Not semantic — misses meaning-based matches important for natural language questions

## Solution: Supabase + pgvector

Move the vector storage and search to Supabase using the `pgvector` extension. The existing server-side RAG route (`/api/ai-vercel-chat`) already handles LLM calls — we just swap the retrieval layer.

## Architecture

```
[Ingestion Script]
  → chunks documents
  → generates embeddings (OpenAI/local)
  → stores in Supabase (text + vectors)

[User asks question on /chat or /ai-chat]
  → Server route receives query
  → Generates query embedding
  → Supabase similarity search (pgvector)
  → Top-K results returned as context
  → LLM generates answer from context
```

## Implementation Steps

### 1. Set up Supabase database schema

Create a migration with:

```sql
-- Enable pgvector extension
create extension if not exists vector;

-- Documents table (stores chunked content)
create table documents (
  id bigint generated always as identity primary key,
  source_id text not null,          -- original file/article identifier
  source_model text,                -- 'documents', 'blog-articles', 'stories'
  title text,
  author text,
  year text,
  category text,
  url text,
  chunk_index integer not null,
  content text not null,            -- the chunk text
  embedding vector(384),            -- all-MiniLM-L6-v2 dimension (local, free)
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Index for fast similarity search
create index on documents using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Index for filtering by source
create index on documents (source_model);
create index on documents (source_id);

-- RLS policies
alter table documents enable row level security;
create policy "Public read access" on documents for select using (true);
```

### 2. Create a new Supabase project

Use the Supabase MCP tools to create a project (user will choose org and region).

### 3. Create embedding generation utility

New file: `src/lib/server/embeddings.ts`

- Use **`@xenova/transformers`** (already installed in the project) to generate embeddings locally — no API key needed
- Model: `Xenova/all-MiniLM-L6-v2` (384 dimensions, ~80MB, very fast)
  - This is a well-known sentence-transformer model, good quality for semantic search
  - Runs in Node.js via ONNX runtime — no GPU needed
- Function: `generateEmbedding(text: string): Promise<number[]>`
- For the ingestion script: batch embeddings to avoid memory issues with 500MB of text

### 4. Update ingestion script

Modify `scripts/ingest-local-documents.mjs` (or create a new `scripts/ingest-to-supabase.mjs`):

- Keep existing chunking logic (it works well)
- After chunking, generate embeddings for each chunk
- Upsert chunks + embeddings into Supabase `documents` table
- Add a `--supabase` flag or make it the default
- Handle rate limits on embedding API (batch requests)

Also update `scripts/ingest-builder-content.mjs` similarly for blog posts.

### 5. Create server-side search module

New file: `src/lib/server/vector-search.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

export async function searchDocuments(query: string, opts?: { topK?: number }) {
  const queryEmbedding = await generateEmbedding(query);
  
  const { data } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: opts?.topK ?? 5
  });
  
  return data;
}
```

Create the matching SQL function:

```sql
create or replace function match_documents(
  query_embedding vector(384),
  match_threshold float,
  match_count int
) returns table (
  id bigint,
  content text,
  title text,
  source_id text,
  url text,
  similarity float
) language sql stable as $$
  select
    id, content, title, source_id, url,
    1 - (embedding <=> query_embedding) as similarity
  from documents
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;
```

### 6. Update the API route

Modify `src/routes/api/ai-vercel-chat/+server.ts`:

- Replace `getSummarySummaries()` call with `searchDocuments()` from the new vector search module
- Keep the existing LLM call logic (Anthropic/OpenAI)
- Keep session/token budget logic

### 7. Update or simplify the client chat pages

- `/chat` page: Instead of loading family-data.json client-side, make it call the server API (like `/ai-chat` already does)
- `/ai-chat` page: Minimal changes — it already uses the server route
- Can potentially merge both chat pages into one

### 8. Environment variables needed

- `SUPABASE_URL` — project URL
- `SUPABASE_SERVICE_ROLE_KEY` — for server-side operations (ingestion + search)
- `SUPABASE_ANON_KEY` — for client-side if needed
- No embedding API key needed (local model)

### 9. Clean up (optional, after migration verified)

- Remove static JSON files: `family-data.json`, `family-embeddings.json`, `family-vocab.json`, `book-summaries.json`, `summary-embeddings.json`, `summary-vocab.json`
- Remove or archive old embedding scripts: `precompute-embeddings.mjs`, `precompute-summary-embeddings.mjs`
- Remove client-side embedding code: `src/lib/ai/embeddings.ts` (or keep as fallback)

## Files to create/modify

| File | Action |
|------|--------|
| Supabase migration (via MCP) | Create — schema + pgvector + RPC function |
| `src/lib/server/vector-search.ts` | Create — Supabase vector search |
| `src/lib/server/embeddings.ts` | Create — embedding generation |
| `scripts/ingest-to-supabase.mjs` | Create — ingestion with embeddings |
| `src/routes/api/ai-vercel-chat/+server.ts` | Modify — use vector search |
| `src/routes/chat/+page.svelte` | Modify — use server API instead of client-side search |
| `src/lib/ai/vercel-generation.ts` | Modify — adapt prompt building for vector results |
| `package.json` | Modify — add `@supabase/supabase-js` dependency |

## Dependencies to add

- `@supabase/supabase-js` — Supabase client
- `@xenova/transformers` — already installed, used for local embeddings

## What stays the same

- LLM provider logic (Anthropic/OpenAI via Vercel AI SDK)
- Token budget and session management
- Chat UI layout and design
- Document chunking logic (proven and working)
- Builder.io content fetching for display (non-RAG routes)

## Embedding model choice

| Model | Dimensions | Cost | Quality |
|-------|-----------|------|---------|
| `Xenova/all-MiniLM-L6-v2` (chosen) | 384 | Free (local) | Good for semantic search |
| OpenAI `text-embedding-3-small` | 1536 | ~$0.02/1M tokens | Better quality |
| Local TF-IDF (current) | Variable | Free | Poor for semantic search |

Chosen: **`Xenova/all-MiniLM-L6-v2`** — free, runs locally, good semantic quality, already have `@xenova/transformers` installed.
