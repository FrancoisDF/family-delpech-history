# Plan: Wire Chat Page to Use Supabase RAG + Browser-Side Local LLM

## Goal

Modify the `/chat` page so it uses:
1. **Supabase pgvector** for document retrieval (RAG) — already implemented server-side
2. **Browser-side local LLM** (`@xenova/transformers` with `mt5-small`) for text generation — already implemented but not connected to the chat page

Currently, the chat page sends everything to `/api/ai-vercel-chat` which does both RAG retrieval AND cloud LLM generation (Anthropic/OpenAI). We need a hybrid approach: server handles RAG, browser handles generation.

## Architecture

```
User message
  → POST /api/rag-search (new endpoint, server-side)
    → Supabase pgvector semantic search (existing code)
    → Returns matching document chunks + sources
  → Browser receives context
  → Local LLM generates response from context (existing generation.ts)
  → Display response + sources in chat UI
```

## Changes Required

### 1. Create new API endpoint: `src/routes/api/rag-search/+server.ts`

A lightweight server endpoint that **only does retrieval** (no LLM call):
- Accepts a user message
- Calls `searchDocuments()` from `$lib/server/vector-search.ts`
- Calls `formatAsContextSummaries()` to structure results
- Returns the document chunks and source metadata to the client

This reuses the existing Supabase vector search code without any cloud LLM dependency.

### 2. Update `src/routes/chat/+page.svelte`

Modify the chat page to:
- Import and use `loadGenerator`, `summarizeFromChunks` from `$lib/ai/generation.ts`
- Import `getSystemPrompt`, `setSystemPrompt` from the same module
- On page mount, start preloading the local LLM model (show loading progress)
- When user sends a message:
  1. Call `/api/rag-search` to get relevant document chunks
  2. Transform the response into `FamilyChunk[]` format expected by `summarizeFromChunks`
  3. Call `summarizeFromChunks()` with the chunks and query
  4. Display the generated response with source links
- Wire the system prompt settings modal to actually save/load via `setSystemPrompt()`/`getSystemPrompt()`
- Show model loading progress indicator in the UI
- Handle the case where the local model fails to load (show error message)

### 3. Minor adjustments to `src/lib/ai/generation.ts`

- The existing `summarizeFromChunks` function already accepts chunks and returns a generated response with sources
- May need to adapt the `FamilyChunk` type mapping from the RAG search results
- The `onToken` streaming callback is already supported

## Key Files

| File | Action |
|------|--------|
| `src/routes/api/rag-search/+server.ts` | **Create** — RAG-only endpoint |
| `src/routes/chat/+page.svelte` | **Modify** — Use local LLM + RAG endpoint |
| `src/lib/ai/generation.ts` | **Minor edits** if type mapping needed |
| `src/lib/ai/config.ts` | No changes needed |
| `src/lib/server/vector-search.ts` | No changes needed (reused as-is) |

## What stays the same

- Supabase vector search logic (unchanged)
- The `/api/ai-vercel-chat` endpoint (kept for the `/ai-chat` page)
- Local LLM model and config (`mt5-small`, temperature, etc.)
- Chat UI layout and styling
- Session storage for chat history

## Considerations

- **Model load time**: The `mt5-small` model needs to download on first use (~100MB). The UI should show a progress bar and remain usable during loading.
- **Generation quality**: `mt5-small` is a small model; responses will be shorter and simpler than cloud LLMs. The existing fallback logic in `generation.ts` handles weak outputs.
- **No cloud LLM dependency**: The chat page will work without any `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` — only `SUPABASE_URL` and `SUPABASE_ANON_KEY` are required.
