# AI Provider Setup & Summary Generation Guide

## Overview

This project implements a **flexible, multi-provider AI system** that supports both **Anthropic** and **OpenAI-compatible** AI services. The system includes:

1. **Summary Generation** - Batch process to create summaries of documents using AI
2. **Chat API** - Server-side endpoint that uses summaries for token-efficient answers
3. **Provider Abstraction** - Single configuration point to switch between AI providers

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Your Application                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────┐        ┌──────────────────────────┐  │
│  │   Chat Page (/chat)    │        │  Summary Generation      │  │
│  │  - User sends message  │        │  (batch process)         │  │
│  │  - Gets AI response    │        │  - Summarizes documents  │  │
│  └────────────┬───────────┘        │  - Creates embeddings    │  │
│               │                    └──────────────────────────┘  │
│               │                                                   │
│               ▼                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │    Chat API (/api/ai-vercel-chat)                          │  │
│  │  - Receives user message                                   │  │
│  │  - Searches for relevant summaries                         │  │
│  │  - Calls AI provider for response                          │  │
│  └──────────────────┬───────────────────────────────────────┘  │
│                     │                                            │
│                     ▼                                            │
├─────────────────────────────────────────────────────────────────┤
│              Provider Factory (src/lib/ai/provider.ts)           │
│  - Reads AI_PROVIDER environment variable                       │
│  - Creates appropriate AI client (Anthropic or OpenAI)          │
│  - Normalizes responses across providers                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐              ┌──────────────────────────┐  │
│  │  Anthropic       │              │  OpenAI-Compatible       │  │
│  │  - Claude 3.5    │              │  - OpenAI API            │  │
│  │  - Haiku/Sonnet  │              │  - Local servers         │  │
│  │  - Fast & cheap  │              │  - Private deployments   │  │
│  └──────────────────┘              └──────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## What Each Component Does

### 1. **Summary Generation** (One-time batch process)

**File:** `scripts/generate-summaries-generic.mjs`

**Purpose:**
- Reads chunked documents from `static/family-data.json`
- Groups documents by title/section
- Sends each group to AI for summarization
- Stores summaries in `static/book-summaries.json` for fast retrieval
- Creates embeddings for semantic search

**Why summaries?**
- Instead of searching entire documents (which uses ~1,200-1,500 tokens per query)
- Summaries reduce context size to ~500 tokens per query
- Saves 60-70% of token costs
- Faster response times

**How it works:**
1. Load family history documents
2. Group documents by title (each group = one document to summarize)
3. Send to AI: "Summarize this genealogy/family history in 2-3 sentences"
4. Collect all summaries
5. Save to JSON file with metadata (author, year, category, etc.)

### 2. **Chat API** (Real-time query handler)

**File:** `src/routes/api/ai-vercel-chat/+server.ts`

**Purpose:**
- Receives user questions from the chat interface
- Searches summaries using semantic similarity (embeddings)
- Retrieves top 5 most relevant summaries
- Constructs system prompt with summaries
- Calls AI provider for response
- Tracks token usage for daily budget limits

**Token flow:**
```
User Question (50-100 tokens)
       ↓
Search Summary Database (uses embeddings)
       ↓
Get Top 5 Summaries (~300-400 tokens)
       ↓
Build System Prompt with summaries
       ↓
Call AI Provider
       ↓
Receive Response (~100-200 tokens output)
       ↓
Total: ~500 tokens per query (vs 1,500+ with raw documents)
```

### 3. **Provider Factory** (Configuration & abstraction)

**File:** `src/lib/ai/provider.ts`

**Purpose:**
- Reads environment variables to determine which AI provider to use
- Creates the appropriate AI client
- Provides unified interface for chat API and scripts
- Handles errors with helpful messages

**Supported providers:**
- **Anthropic** (default) - Fast, cost-effective
- **OpenAI** - gpt-4, gpt-3.5-turbo, etc.
- **OpenAI-Compatible** - Local servers, private deployments

---

## Step-by-Step Setup

### Step 1: Choose Your AI Provider

You have three options:

#### **Option A: Use Anthropic (Recommended for cost)**
1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Create an API key
4. Set environment variable:
   ```bash
   export ANTHROPIC_API_KEY="sk-ant-your-key-here"
   ```
5. No need to set `AI_PROVIDER` (defaults to anthropic)

#### **Option B: Use OpenAI (gpt-4/gpt-3.5-turbo)**
1. Go to https://platform.openai.com/api-keys/
2. Create an API key
3. Set environment variables:
   ```bash
   export AI_PROVIDER="openai"
   export OPENAI_API_KEY="sk-your-key-here"
   export OPENAI_MODEL="gpt-3.5-turbo"  # or "gpt-4"
   ```

#### **Option C: Use Private OpenAI-Compatible Server**
1. Set up your OpenAI-compatible server (e.g., on localhost:8000)
2. Set environment variables:
   ```bash
   export AI_PROVIDER="openai"
   export OPENAI_API_KEY="your-server-key"
   export OPENAI_MODEL="your-model-name"
   export OPENAI_API_BASE="http://localhost:8000/v1"
   ```

### Step 2: Verify Configuration

Check that your chosen provider is properly configured:
```bash
# For Anthropic
echo $ANTHROPIC_API_KEY

# For OpenAI
echo $AI_PROVIDER
echo $OPENAI_API_KEY
echo $OPENAI_MODEL
echo $OPENAI_API_BASE  # (optional)
```

### Step 3: Install Dependencies

The project automatically includes the necessary AI SDK packages:
- `@ai-sdk/anthropic` - For Anthropic support
- `@ai-sdk/openai` - For OpenAI support
- `ai` - Vercel AI SDK (unified interface)

Install if needed:
```bash
npm install
```

---

## How to Generate Summaries

### Prerequisites
- Chunked documents must exist in `static/family-data.json`
- Generate these using: `npm run prepare:rag`
- API key configured for your chosen provider

### Run Summary Generation

**Using Anthropic (default):**
```bash
ANTHROPIC_API_KEY="sk-ant-your-key" node scripts/generate-summaries-generic.mjs
```

**Using OpenAI:**
```bash
AI_PROVIDER=openai \
OPENAI_API_KEY="sk-xxx" \
OPENAI_MODEL="gpt-3.5-turbo" \
node scripts/generate-summaries-generic.mjs
```

**Using private server:**
```bash
AI_PROVIDER=openai \
OPENAI_API_KEY="your-key" \
OPENAI_MODEL="gpt-3.5-turbo" \
OPENAI_API_BASE="http://localhost:8000/v1" \
node scripts/generate-summaries-generic.mjs
```

### What Happens During Summary Generation

1. **Loading** - Reads documents from `static/family-data.json`
   ```
   ✓ Loaded 250 chunks
   ✓ Found 45 unique sections/books
   ```

2. **Processing** - Groups documents and sends to AI in batches of 5
   ```
   📚 Generating summaries for 45 sections...
   ✓ Chapter 1: Family Origins
   ✓ Chapter 2: Early Years
   ...
   ⏳ Waiting before next batch (rate limiting)...
   ```

3. **Saving** - Creates `static/book-summaries.json`
   ```
   ✅ Summaries saved to static/book-summaries.json
      Summaries available: 45
   
   📊 Summarization Complete:
      Total sections: 45
      Input tokens: 5,234
      Output tokens: 1,892
      Total tokens used: 7,126
   ```

### Output Format

The script creates `static/book-summaries.json`:
```json
[
  {
    "id": "summary-chapter-1-family-origins",
    "title": "Chapter 1: Family Origins",
    "summary": "The Delpech family originated in southwestern France in the 16th century. They were known merchants and landowners who played significant roles in their regional community.",
    "sourceType": "document",
    "originalChunkCount": 5,
    "metadata": {
      "author": "François Delpech",
      "year": "1600",
      "category": "origins",
      "tags": ["genealogy", "France"]
    }
  },
  ...
]
```

---

## How the Chat Works

### User Asks a Question

1. **User enters:** "Tell me about the Delpech family origins"

2. **Chat API receives request:**
   - Endpoint: `POST /api/ai-vercel-chat`
   - Body includes:
     - `message` - The user's question
     - `tokensUsed` - Running total of tokens used today
     - Optional: `sessionContext` - Previous chat context for reuse

3. **Search for relevant summaries:**
   - Uses semantic search (embeddings) to find similar summaries
   - Returns top 5 most relevant summaries
   - Example match: "Chapter 1: Family Origins" (relevance score: 0.92)

4. **Build system prompt with context:**
   ```
   You are a family historian...
   
   RELEVANT DOCUMENTS:
   - Chapter 1: Family Origins (5 chunks)
     Summary: The Delpech family originated...
   
   - Marriage Records (3 chunks)
     Summary: Records show marriages between...
   
   [continues with top 5]
   ```

5. **Call AI provider:**
   - Provider factory selects right client (Anthropic or OpenAI)
   - Sends: System prompt + user message
   - Receives: Response text + token counts

6. **Return response with metadata:**
   ```json
   {
     "response": "The Delpech family originated in southwestern France...",
     "inputTokens": 342,
     "outputTokens": 156,
     "totalTokens": 498,
     "sourcesUsed": [
       "Chapter 1: Family Origins",
       "Marriage Records",
       ...
     ],
     "summariesUsed": ["summary-chapter-1", "summary-marriage-records"]
   }
   ```

### Token Budget Tracking

- **Daily limit:** 5,000 tokens
- **Per-request check:** Before calling AI, verify tokens won't exceed budget
- **After response:** Update running total
- **When exceeded:** Return error 429 with message

---

## Configuration Files

### `.env.example` (Your reference guide)
Shows all available configuration options with explanations. Copy to `.env`:
```bash
cp .env.example .env
```

### `src/lib/ai/provider.ts` (Provider factory)
- Exports: `getProviderConfig()`, `createModelForChat()`, `normalizeUsage()`, `getProviderInfo()`
- Used by: Chat API and summary generation script
- No need to modify - just configure environment variables

### `scripts/generate-summaries-generic.mjs` (Summary generation)
- Reads: `static/family-data.json`
- Writes: `static/book-summaries.json`
- Uses: Vercel AI SDK's `generateText()` for unified interface

### `src/routes/api/ai-vercel-chat/+server.ts` (Chat API)
- Endpoint: `POST /api/ai-vercel-chat`
- Uses provider factory to get AI model
- Searches summaries and builds context
- Returns response with token counts

---

## Token Usage Explained

### What are tokens?
- Tokens are chunks of text
- ~4 characters = 1 token
- AI charges based on token count (input + output)

### Token costs by provider:

**Anthropic (Claude 3.5):**
- Input: ~$3 per 1M tokens
- Output: ~$15 per 1M tokens
- ~7,000 tokens per query

**OpenAI (gpt-3.5-turbo):**
- Input: ~$0.50 per 1M tokens
- Output: ~$1.50 per 1M tokens
- ~498 tokens per query (using summaries)

### Cost comparison:
- **Without summaries:** 1,500 tokens × 10 queries = 15,000 tokens
- **With summaries:** 500 tokens × 10 queries = 5,000 tokens
- **Savings:** 66% reduction

---

## Troubleshooting

### Error: "ANTHROPIC_API_KEY not configured"
**Solution:** Set your API key:
```bash
export ANTHROPIC_API_KEY="sk-ant-your-key"
```

### Error: "OPENAI_MODEL environment variable is required"
**Solution:** When using OpenAI, specify the model:
```bash
export OPENAI_MODEL="gpt-3.5-turbo"
```

### Error: "Cannot find module 'family-data.json'"
**Solution:** Generate chunked documents first:
```bash
npm run prepare:rag
```

### Chat API returns error 429
**Cause:** Daily token budget exceeded (5,000 tokens)
**Solution:** Wait until next day or increase budget in code:
```typescript
const DAILY_TOKEN_BUDGET = 10000; // Increase in +server.ts
```

### Summaries seem irrelevant to my question
**Cause:** Embeddings need to be regenerated
**Solution:** After generating summaries, create embeddings:
```bash
node scripts/precompute-summary-embeddings.mjs
```

---

## Common Workflows

### Workflow 1: Initial Setup (Anthropic)
```bash
# 1. Set API key
export ANTHROPIC_API_KEY="sk-ant-your-key"

# 2. Generate chunked documents
npm run prepare:rag

# 3. Generate summaries
node scripts/generate-summaries-generic.mjs

# 4. Create embeddings for search
node scripts/precompute-summary-embeddings.mjs

# 5. Start development server
npm run dev

# 6. Open http://localhost:5173/chat and start asking questions
```

### Workflow 2: Switch to OpenAI Provider
```bash
# Set environment variables
export AI_PROVIDER=openai
export OPENAI_API_KEY="sk-your-key"
export OPENAI_MODEL="gpt-3.5-turbo"

# Regenerate summaries with OpenAI
node scripts/generate-summaries-generic.mjs

# Use chat (API automatically uses new provider)
npm run dev
```

### Workflow 3: Use Private Server
```bash
# Start your OpenAI-compatible server
# (e.g., ollama, llm-server, vLLM, etc.)

# Set environment variables
export AI_PROVIDER=openai
export OPENAI_API_KEY="test-key"
export OPENAI_MODEL="llama2"
export OPENAI_API_BASE="http://localhost:8000/v1"

# Generate summaries
node scripts/generate-summaries-generic.mjs

# Chat will use your local server
npm run dev
```

---

## Key Features Summary

✅ **Multi-Provider Support** - Switch between Anthropic and OpenAI with one variable
✅ **Cost Optimization** - Summaries reduce token usage by 66%
✅ **Fast Responses** - Pre-computed summaries enable quick retrieval
✅ **Flexible Deployment** - Works with cloud APIs or private servers
✅ **Token Tracking** - Daily budget limits to control costs
✅ **Error Handling** - Clear messages for configuration issues
✅ **Backwards Compatible** - Defaults to Anthropic if no config provided

---

## Files Created/Modified

| File | Type | Purpose |
|------|------|---------|
| `src/lib/ai/provider.ts` | Created | Provider factory & configuration |
| `scripts/generate-summaries-generic.mjs` | Created | Provider-agnostic summary generation |
| `.env.example` | Created | Configuration documentation |
| `src/routes/api/ai-vercel-chat/+server.ts` | Modified | Updated to use provider factory |
| `package.json` | Modified | Added @ai-sdk/openai dependency |

---

## Next Steps

1. **Choose your provider** (Anthropic recommended for cost)
2. **Configure environment variables** (see setup guide above)
3. **Generate summaries** (run summary generation script)
4. **Test the chat** (start dev server and ask questions)
5. **Monitor token usage** (check API responses for token counts)

Good luck! The system is designed to be simple to configure and efficient to run. 🚀
