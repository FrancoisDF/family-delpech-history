# Vercel AI Integration Plan

## Overview

Implement a new server-side AI chat powered by Vercel AI + Anthropic Claude alongside the existing on-device AI. The new chat will:

- Use Builder.io documents as the sole context (RAG approach)
- Enforce strict token budgeting (5,000 tokens/day per session)
- Implement daily session management (ask users to reconnect next day)
- Store session data in browser localStorage for simplicity
- Cache Builder content with periodic refresh capability

---

## Architecture

### High-Level Flow

1. **User accesses new `/ai-chat` page** (new separate page, existing `/chat` unchanged)
2. **Page loads**: Check localStorage for session token usage & expiry
   - If expired (next day) or limit exceeded: show "come back tomorrow" message
   - Otherwise: allow chat
3. **User sends message** → POST to `/api/ai-vercel-chat`
4. **Server-side handler**:
   - Retrieves cached Builder content (RAG context)
   - Constructs prompt that restricts Claude to ONLY that context
   - Calls Vercel AI SDK with Anthropic Claude
   - Counts input + output tokens
   - Returns response + token counts
5. **Client updates localStorage**: track cumulative tokens for the day
6. **UI shows**: remaining token budget, warning if approaching limit

### Key Design Decisions

- **New page, not replacing old**: `/ai-chat` co-exists with `/chat` for backward compatibility
- **No server-side session DB**: localStorage-only for simplicity (secure via content-scoped prompts)
- **Content-scoped prompts**: Claude receives explicit instruction to answer ONLY from provided context
- **Hybrid caching**: Reuse existing static `family-data.json` + add optional server refresh endpoint
- **Token tracking**: Count tokens before request; reject if would exceed 5,000/day

---

## Implementation Steps

### 1. Setup Vercel AI & Anthropic

- **Install dependencies**: `npm install ai @anthropic-ai/sdk`
- **Add env variables**:
  - `ANTHROPIC_API_KEY` (server-side only via `.env.local` or Vercel platform)
  - Optionally: `DAILY_TOKEN_BUDGET=5000` (configurable)

### 2. Create API Route: `/api/ai-vercel-chat`

**File**: `src/routes/api/ai-vercel-chat/+server.ts`

**Responsibilities**:

- Accept POST with: `{ message: string, tokensUsed: number }`
- Load cached Builder context (`static/family-data.json` or fetch fresh)
- Build system prompt that restricts response to context only
- Call Vercel AI SDK with streaming support
- Count input & output tokens
- Return: `{ response: string, inputTokens: number, outputTokens: number }`

**System Prompt Template**:

```
You are a helpful assistant that answers questions ONLY based on the provided context.
You have access to documents and content about [family/genealogy/specific domain].

IMPORTANT RULES:
1. Only use information from the context below to answer.
2. If a question cannot be answered from the context, say: "Je n'ai pas cette information dans mes documents."
3. Do NOT use external knowledge or make up information.
4. Keep responses concise (2-3 sentences in French, per existing persona).
5. Cite source documents when relevant.

Context:
[Insert top K relevant chunks from Builder content here]
```

### 3. Create New Chat Page: `/ai-chat`

**File**: `src/routes/ai-chat/+page.svelte`

**Responsibilities**:

- Display chat interface (similar to existing `/chat` but branded as "Vercel AI Chat")
- On load: Check localStorage for session status
  - Session key: `ai_vercel_session`
  - Fields: `{ sessionId, tokensUsedToday, lastUsedDate, sessionStartTime }`
  - If `lastUsedDate !== today`: reset tokens
  - If `tokensUsedToday >= 5000`: show "quota exceeded, come back tomorrow"
- Before each request:
  - Estimate tokens (rough: `message.length / 4` for input + estimated output)
  - Check if `estimated + tokensUsedToday > 5000` → warn or block
  - Send request to `/api/ai-vercel-chat`
- On response:
  - Display response
  - Update localStorage with actual tokens used
  - Show remaining budget in UI
  - Warn if approaching limit (e.g., "500 tokens remaining today")
- Graceful degradation: If API fails, show error and suggest checking connection

### 4. Session & Token Management (Client-Side)

**File**: `src/lib/ai/session.ts` (new)

**Functions**:

- `initSession()`: Create or restore session from localStorage
- `getTokensRemaining()`: Calculate daily budget remaining
- `canMakeRequest(estimatedTokens)`: Check if request fits within budget
- `recordTokens(input, output)`: Update localStorage with actual usage
- `isSessionExpired()`: Check if date has changed
- `getSessionWarnings()`: Return messages about quota status

### 5. Builder Content Caching with Refresh

**Enhancement to existing strategy**:

**Option A** (Simpler): Reuse existing `static/family-data.json`

- AI chat API loads this file as context
- Document updates happen via existing ingestion scripts
- Add optional admin endpoint to trigger re-ingestion: `POST /api/refresh-content`

**Option B** (More flexible): Dynamic fetch from Builder on API call

- Server route fetches fresh Builder content at request time
- No caching needed, always current
- Trade-off: Slower responses, more Builder API calls

**Recommended**: Option A + periodic refresh

- Keep static files for fast responses
- Add `POST /api/refresh-content` endpoint (optional, can be called manually or scheduled)
- Update ingestion scripts if needed

### 6. Prompt Engineering for Content Scoping

**Key principle**: Make Claude's context window explicit and constrained

**Implementation**:

1. Rank chunks by relevance (use existing `searchFamilyData` from `src/lib/ai/search.ts`)
2. Include top 4-5 most relevant chunks in the system prompt (total < 2000 tokens to leave room for response)
3. Add explicit "answer only from context" instruction
4. Example system prompt structure:

   ```
   [System instructions about domain, persona, language]

   SOURCES YOU CAN USE:
   [Chunk 1]
   [Chunk 2]
   [Chunk 3]
   [Chunk 4]

   If the answer is not in the above sources, say: "Je n'ai pas cette information."
   ```

---

## Files to Create / Modify

### New Files to Create

- `src/routes/ai-chat/+page.svelte` — New chat UI page
- `src/routes/api/ai-vercel-chat/+server.ts` — API route for chat endpoint
- `src/lib/ai/session.ts` — Session and token management utilities
- `src/lib/ai/vercel-generation.ts` — Vercel AI integration (streaming, token counting)

### Files to Modify (Minor)

- `.env.local` (or Vercel platform env vars) — Add `ANTHROPIC_API_KEY`, `DAILY_TOKEN_BUDGET=5000`
- `package.json` — Add `ai` and `@anthropic-ai/sdk` dependencies
- Optional: `src/lib/ai/config.ts` — Add feature flags for Vercel AI (e.g., `ENABLE_VERCEL_AI`, `VERCEL_CHAT_URL`)

### No Changes Needed

- Existing `/chat` page and on-device AI remain untouched
- Existing Builder content ingestion scripts (continue as-is or enhance for caching)

---

## Token Counting Strategy

### Input Tokens

- Use Anthropic's token counting library or estimate: `text.length / 4`
- Include: system prompt + user message + context chunks
- Vercel AI SDK may expose token counts in response metadata

### Output Tokens

- Vercel AI SDK response includes token counts if available
- Fallback estimate: `response.length / 4`

### Daily Budget

- Fixed: 5,000 tokens/day per session (session = browser)
- Reset at midnight (local or UTC — choose one)
- Stored in localStorage with timestamp

### Display to User

- "Tokens used today: 1,234 / 5,000"
- Warning at 80% ("Only 1,000 tokens left")
- Error at 100% ("Daily limit reached, come back tomorrow")

---

## Session Expiry & "Come Back Tomorrow" Flow

### Session Structure (localStorage)

```json
{
	"ai_vercel_session": {
		"sessionId": "uuid-or-random-string",
		"tokensUsedToday": 1234,
		"lastUsedDate": "2025-02-07",
		"sessionStartTime": 1707360000,
		"remainingBudget": 3766
	}
}
```

### On Page Load

1. Check if `lastUsedDate` matches today
   - If not: reset `tokensUsedToday = 0`, update `lastUsedDate`
2. Check if `tokensUsedToday >= 5000`
   - If yes: show modal "Daily limit reached. Please come back tomorrow to continue."
   - Disable chat input, show "Check back in X hours"

### On Message Send

1. Validate session is not expired
2. Estimate tokens
3. Check `tokensUsedToday + estimated > 5000`
   - If true: show warning and optionally block
4. Send request
5. On success: update `tokensUsedToday += actualTokens`

---

## UI/UX Considerations

### Chat Page Layout

- Similar to existing `/chat` but clearly labeled "Vercel AI Chat" or "Cloud AI Assistant"
- Token meter/indicator (e.g., progress bar showing budget remaining)
- Explanation of daily limits upfront
- Link back to on-device AI chat for comparison

### Error Messages

- "Daily limit reached. Come back tomorrow."
- "No remaining tokens. Please check back in X hours."
- "API error. Please try again later."
- "This question cannot be answered from available documents."

### Persona & Language

- Keep existing French persona from original config if desired
- Or customize for this new chat variant
- Maintain 2-3 sentence response length

---

## Testing & Validation

### Before Deployment

1. Verify `ANTHROPIC_API_KEY` is set correctly
2. Test API route with sample curl or Postman
3. Verify token counting is accurate
4. Test session expiry at midnight
5. Test token limit enforcement (try to exceed budget)
6. Verify fallback to context-only responses (Claude ignores external knowledge)
7. Check localStorage cleanup after session reset

### Manual Testing

- Mock token counts to verify UI warnings
- Test on multiple browsers/tabs to confirm session isolation
- Verify chat history is NOT persisted across browser sessions (if desired)
- Test with slow network to verify streaming behavior

---

## Deployment Checklist

- [ ] Add `ai` and `@anthropic-ai/sdk` packages
- [ ] Set `ANTHROPIC_API_KEY` in Vercel environment variables
- [ ] Create `/api/ai-vercel-chat` route
- [ ] Create `/ai-chat` page with session management
- [ ] Implement token counting and localStorage persistence
- [ ] Test API and UI locally with `npm run dev`
- [ ] Build and test production build: `npm run build && npm run preview`
- [ ] Deploy to Vercel
- [ ] Monitor API usage and token consumption in first week

---

## Future Enhancements (Out of Scope)

- Server-side session database (Supabase) for multi-device tracking
- User authentication to tie limits to accounts
- Analytics: track token usage trends, most common questions
- Dynamic context selection based on user profile
- Rate limiting per IP address
- A/B test: compare on-device AI vs. Vercel AI performance
- Support for other LLM providers (fallback or alternative)
