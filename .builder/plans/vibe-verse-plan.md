# Plan: Improve Chat Responses — Longer, French-only, Correct Source Links

## 3 Goals
1. **Longer responses** — current answers are clipped to ~3 sentences; allow richer multi-paragraph output
2. **French-only answers** — some internal prompts are in English, which can leak into output
3. **Source links that actually work** — document sources are shown as plain text labels; they should link to the associated blog article when one exists

---

## Changes by File

### 1. `src/lib/ai/config.ts`
- **System prompt**: rewrite `DEFAULT_SYSTEM_PROMPT` fully in French, removing the "3 phrases courtes" constraint. Ask for detailed, multi-paragraph answers instead.
- **Max tokens**: increase `GENERATOR_MAX_NEW_TOKENS` from `220` → `512` to allow longer output.

### 2. `src/lib/ai/generation.ts`
- **`buildT5Prompt()`**: rewrite the prompt template fully in French. Remove "3 phrases" / "10 phrases maximum" limits. Ask for a complete, detailed response.
- **`ensureThreeShortSentences()`**: remove or replace this function — it forcefully clips output to exactly 3 sentences. Replace with a lighter cleanup that doesn't truncate.
- **`MAX_CONTEXT_LENGTH`**: increase from `1500` → `2500` so the model has more archive content to draw from.

### 3. `src/lib/ai/vercel-generation.ts`
- **`buildSystemPrompt()`**: rewrite the English system prompt entirely in French. Remove the "2-3 sentences" constraint. Keep the same rules (only use provided context, cite sources, warm tone) but in French and allowing longer answers.

### 4. `src/routes/chat/+page.svelte`
- **Source object construction**: currently `sourceId` is set to `c.title` (the chunk title). Fix it to use the actual `c.sourceId` from the RAG response so that `generateBlogUrl()` produces a correct link.
- **Document source rendering**: currently non-blog document sources are plain `<span>` labels. When a document chunk has `originPostId` or `originPostUrl` (meaning it's an attachment linked to a blog article), render it as a clickable `<a>` link pointing to that article instead of a dead label.

### 5. `src/routes/api/ai-vercel-chat/+server.ts`
- Increase `maxTokens` from `500` → `1000` to match the longer-answer goal on the server path too.

---

## Files Modified (summary)
| File | What changes |
|---|---|
| `src/lib/ai/config.ts` | French prompt, higher max tokens |
| `src/lib/ai/generation.ts` | French prompt template, remove 3-sentence clipping, larger context |
| `src/lib/ai/vercel-generation.ts` | Full French system prompt, no sentence limit |
| `src/routes/chat/+page.svelte` | Fix sourceId mapping, make document sources clickable |
| `src/routes/api/ai-vercel-chat/+server.ts` | Higher maxTokens |
