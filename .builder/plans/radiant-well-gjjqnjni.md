# Generic AI Provider Support Plan

## Objective

Enable the project to use a private OpenAI-compatible AI server alongside Anthropic, with configurable provider selection via environment variables.

## User Requirements

- **Chat API**: Keep Vercel AI SDK, configure to use private OpenAI-compatible server (or Anthropic as fallback)
- **Summarization Script**: Create new generic script supporting both OpenAI-compatible APIs and Anthropic
- **Configuration**: Use environment variables for all provider settings

---

## Architecture Overview

### Two-Tier Approach

#### Tier 1: Chat API (Server-Side)

- **Current**: Uses Vercel AI SDK + @ai-sdk/anthropic adapter
- **Goal**: Create a provider factory that switches between:
  - Private OpenAI-compatible server (via Vercel's @ai-sdk/openai with custom endpoint)
  - Anthropic (via @ai-sdk/anthropic)
- **Implementation**: Provider selection wrapper in `src/lib/ai/provider.ts`
- **Advantage**: Vercel AI SDK normalizes model calls and usage fields (camelCase)

#### Tier 2: Summarization Script

- **Current**: Direct Anthropic SDK usage (official @anthropic-ai/sdk)
- **Goal**: Create new `scripts/generate-summaries-generic.mjs` using Vercel AI abstraction
- **Benefits**:
  - Reuses provider abstraction from chat API
  - Consistent token counting
  - Easy to switch providers in batch operations
  - Backwards compatible (old Anthropic-only script can stay)

---

## Environment Variable Configuration

### Configuration Pattern

```
# Provider Selection
AI_PROVIDER=openai|anthropic (default: anthropic)

# OpenAI-Compatible Server (if AI_PROVIDER=openai)
OPENAI_API_KEY=sk-xxx or your-private-key
OPENAI_API_BASE=http://localhost:8000/v1 (optional, defaults to https://api.openai.com/v1)
OPENAI_MODEL=model-name (required when using private server)

# Anthropic (if AI_PROVIDER=anthropic)
ANTHROPIC_API_KEY=sk-ant-xxx
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022 (optional, defaults to this)
```

### Rationale

- Single `AI_PROVIDER` env var controls which provider to use
- Provider-specific keys and endpoints only needed if selected
- Defaults make it backwards compatible (if env vars missing, uses Anthropic as before)

---

## Implementation Details

### 1. Create Provider Factory (`src/lib/ai/provider.ts`)

**Purpose**: Abstract provider initialization and model creation

**Key Functions**:

- `initializeProvider()`: Returns provider-specific model factory based on `AI_PROVIDER` env var
- Handles both chat API (Vercel generateText) and summarization (direct SDK) use cases
- Normalizes usage/token response shape across providers
- Error handling with provider-specific fallbacks

**Interface**:

```typescript
interface ProviderConfig {
  provider: 'anthropic' | 'openai';
  apiKey: string;
  modelName: string;
  baseUrl?: string; // For OpenAI-compatible servers
}

interface NormalizedUsage {
  promptTokens: number;
  completionTokens: number;
}

export function getProviderConfig(): ProviderConfig
export function createModelForChat(): <model function for Vercel ai>
export function createClientForScript(): <client for scripting>
export function normalizeUsage(usage: any): NormalizedUsage
```

### 2. Update Chat API Route (`src/routes/api/ai-vercel-chat/+server.ts`)

**Changes**:

- Replace hardcoded `createAnthropic({ apiKey })` with provider factory call
- Use `getProviderConfig()` to determine which provider
- Rest of the route logic stays the same (Vercel's `generateText` API is provider-agnostic)
- Usage/token handling already works (Vercel normalizes these fields)

**Lines Modified**:

- Import: Remove direct `@ai-sdk/anthropic` import, add `src/lib/ai/provider` import
- Provider initialization: ~line 40 (replace anthropicClient creation)
- Model call: ~line 60 (model reference now comes from provider factory)

### 3. Create Generic Summarization Script (`scripts/generate-summaries-generic.mjs`)

**Features**:

- Mirrors `scripts/generate-book-summaries.mjs` structure but provider-agnostic
- Uses Vercel AI SDK's `generateText()` function (unified interface)
- Reads `AI_PROVIDER` from env and initializes appropriate provider
- Same batch processing, error handling, and output format as original
- Supports:
  - Batching (BATCH_SIZE = 5)
  - Rate limiting (1s waits between batches)
  - Graceful error recovery per summary
  - Token counting and reporting

**Approach**:

- Depends on Vercel `ai` package (already in project)
- Wraps Anthropic SDK OR OpenAI SDK calls via Vercel's unified `generateText()` interface
- Outputs: `static/book-summaries.json` (same format as original)
- Logs: Detailed per-summary status and total token usage

**Key Difference from Original**:

- Uses Vercel generateText (same as chat API) for consistency
- Provider switching is automatic based on env var
- Can be used with private server without code changes

### 4. Update Dependencies (package.json)

**Add**:

- `@ai-sdk/openai`: "^3.x" (Vercel's OpenAI adapter, supports OpenAI-compatible endpoints)

**No removal** needed — keep existing Anthropic dependencies for backwards compatibility

---

## File Changes Summary

| File                                       | Action            | Purpose                                             |
| ------------------------------------------ | ----------------- | --------------------------------------------------- |
| `src/lib/ai/provider.ts`                   | **Create**        | Provider factory & initialization                   |
| `src/routes/api/ai-vercel-chat/+server.ts` | **Modify**        | Use provider factory instead of hardcoded Anthropic |
| `scripts/generate-summaries-generic.mjs`   | **Create**        | Generic summarization with Vercel AI SDK            |
| `package.json`                             | **Modify**        | Add @ai-sdk/openai dependency                       |
| `.env.example`                             | **Create/Update** | Document all env vars                               |

---

## Provider Selection Logic

### At Startup

1. Read `AI_PROVIDER` env var (default: 'anthropic')
2. Validate required keys exist for selected provider
3. Create appropriate model factory
4. All calls use the same interface (Vercel `generateText` for chat, or wrapper for scripts)

### Fallback Strategy

- If `AI_PROVIDER` not set, use Anthropic (backwards compatible)
- If API key missing for selected provider, throw error with helpful message
- Error messages clearly indicate which env var is needed

---

## Token Counting Approach

**For Chat API**:

- Vercel `generateText` returns usage as: `usage.promptTokens` and `usage.completionTokens`
- Works identically whether using Anthropic or OpenAI-compatible provider
- Session tracking (`src/lib/ai/session.ts`) stays unchanged

**For Summarization Script**:

- Vercel `generateText` provides same `usage` shape
- Logging can normalize across providers

---

## Backwards Compatibility

✅ Existing code continues to work:

- If no env vars set, defaults to Anthropic (current behavior)
- Old `scripts/generate-book-summaries.mjs` remains unchanged for users who prefer it
- Chat UI (ai-chat page) requires no changes

---

## Advantages of This Approach

1. **Minimal Code Changes**: Wrap provider initialization, rest of logic unchanged
2. **Unified Interface**: Vercel AI SDK handles provider abstraction for chat; script uses same SDK
3. **Flexible Configuration**: Easy to test with different providers via env vars
4. **No Breaking Changes**: Defaults to Anthropic if env vars missing
5. **Easy Troubleshooting**: Clear error messages about missing/invalid config
6. **Future-Proof**: Adding more providers just means updating provider factory

---

## Testing Strategy (Post-Implementation)

1. **Chat API**:
   - Test with `AI_PROVIDER=anthropic` (original behavior)
   - Test with `AI_PROVIDER=openai` + private server endpoint
   - Verify token counting matches expected ranges
   - Verify error handling for missing API keys

2. **Summarization**:
   - Run with Anthropic provider
   - Run with OpenAI-compatible provider
   - Verify output format matches original script
   - Compare token usage between providers

3. **Configuration**:
   - Test missing env vars (should error with helpful message)
   - Test with invalid endpoints
   - Test provider switching (set different AI_PROVIDER values)

---

## Next Steps (When Ready to Implement)

1. Create `src/lib/ai/provider.ts` with factory functions
2. Update chat API route to use provider factory
3. Create `scripts/generate-summaries-generic.mjs`
4. Add @ai-sdk/openai to package.json
5. Create `.env.example` with all configuration options
6. Test both providers end-to-end
