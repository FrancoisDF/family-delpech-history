# Family Delpech History

SvelteKit application for exploring the Delpech family archives, genealogy, and stories.

## Stack

- SvelteKit 2, Svelte 5, TypeScript, and Tailwind CSS
- Vercel deployment through `@sveltejs/adapter-vercel`
- Supabase for server-side vector retrieval and usage accounting
- Vercel AI SDK for streamed answer generation

## Development

Install dependencies and start the application:

```sh
pnpm install
pnpm dev
```

The public assistant is available at `/chat`. The previous `/ai-chat` route redirects there so that only one assistant implementation is used.

Create a production build with:

```sh
pnpm build
pnpm preview
```

The production build does not ingest documents or regenerate embeddings. The archive corpus is managed independently in Supabase. The ingestion and local embedding scripts remain available for offline/manual workflows, but they are not part of the request path or deployment build.

## How the AI assistant works

```text
/chat
  -> POST /api/ai-vercel-chat
  -> validate message and short conversation history
  -> reserve visitor/IP quota and monthly budget in Supabase
  -> create a query embedding with the configured embedding model
  -> call the existing Supabase vector-search RPC
  -> reject low-confidence/empty retrieval without calling the language model
  -> generate a short French answer with Vercel AI SDK
  -> stream answer text, verified sources, and actual token usage
  -> reconcile usage and cost in Supabase
```

The model is instructed to answer only from retrieved archive excerpts. Retrieved text is treated as untrusted reference data, so instructions contained inside documents cannot change the assistant's behavior. Source links are accepted only from vetted URL fields returned by the server-side retrieval layer.

## Required setup

The vector corpus must already exist in the connected Supabase project. Do not delete or re-embed it as part of this application setup.

### 1. Configure the existing vector RPC

The application calls a Supabase Postgres function through the REST RPC endpoint. Set these values to match the existing database function:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
SUPABASE_VECTOR_SEARCH_FUNCTION=match_documents
SUPABASE_VECTOR_QUERY_PARAMETER=query_embedding
SUPABASE_VECTOR_MATCH_COUNT=6
SUPABASE_VECTOR_MATCH_THRESHOLD=0.7
```

The RPC should accept the query embedding, a similarity threshold, and a result count. It should return rows containing, at minimum:

- a stable document identifier: `id`, `document_id`, or `source_id`
- archive text: `content`, `text`, or `chunk`
- a title: `title`, `source_title`, or `name`
- a similarity value: `similarity`, `score`, or `match_score`
- optionally, a vetted `url` or `source_url`

The embedding model and vector dimensions must be the same as those used when the existing corpus was created. The threshold is corpus-specific and should be calibrated from real similarity scores.

### 2. Apply the usage-accounting migration

Apply `supabase/migrations/20260308000000_ai_usage.sql` to the same Supabase project using the Supabase SQL Editor or your normal migration workflow. This creates:

- `ai_usage_events` for reservations and actual usage
- `reserve_ai_usage` for atomic burst, daily, and monthly checks
- `record_ai_usage` for post-request reconciliation

The migration intentionally does not modify vector tables. The usage RPCs are restricted to `service_role`; never expose the service-role key through a `PUBLIC_` or `VITE_` variable.

### 3. Configure the answer and embedding providers

Anthropic is the default answer provider and uses the economical Haiku model by default:

```env
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=your-anthropic-key
ANTHROPIC_MODEL=claude-3-5-haiku-20241022
```

An OpenAI-compatible answer provider can be selected instead:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=your-provider-key
OPENAI_MODEL=your-small-model
OPENAI_API_BASE=https://api.openai.com/v1
```

Configure the embedding provider separately. `EMBEDDING_MODEL` must match the model used for the existing Supabase vectors:

```env
EMBEDDING_API_KEY=your-embedding-provider-key
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_API_BASE=https://api.openai.com/v1
EMBEDDING_INPUT_COST_PER_MILLION=0.02
```

### 4. Configure the spend limits

The defaults are intentionally conservative:

```env
AI_VISITOR_SECRET=long-random-server-secret
AI_MONTHLY_BUDGET_USD=20
AI_DAILY_VISITOR_BUDGET_USD=0.25
AI_DAILY_VISITOR_TOKEN_LIMIT=5000
AI_BURST_LIMIT=8
AI_BURST_WINDOW_SECONDS=60
AI_MAX_MESSAGE_LENGTH=2000
AI_MAX_HISTORY_MESSAGES=6
AI_MAX_OUTPUT_TOKENS=320
AI_RESERVE_COST_USD=0.01
AI_INPUT_COST_PER_MILLION=0.8
AI_OUTPUT_COST_PER_MILLION=4
```

The monthly budget is enforced by an atomic Supabase reservation before the language model is called. A conservative estimated amount is reserved first, then replaced with provider-reported answer usage plus embedding cost. Failed or interrupted generations keep their reservation until the database cleanup window expires, preventing repeated cancellations from releasing billed spend.

Pricing values are configuration, not provider discovery. Update them whenever the selected model or provider pricing changes; otherwise the budget calculation will be inaccurate.

### 5. Add variables in Vercel

Add the server-only variables from `.env.example` to the Vercel project for the appropriate environments. At minimum, production requires:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_VECTOR_SEARCH_FUNCTION`
- `SUPABASE_VECTOR_QUERY_PARAMETER`
- `EMBEDDING_API_KEY`
- `EMBEDDING_MODEL`
- `AI_VISITOR_SECRET`
- the selected answer-provider key and model
- the AI pricing and limit variables

Do not prefix these values with `PUBLIC_` or `VITE_`. Redeploy after changing Vercel environment variables.

## Testing and validation

Run the focused assistant tests:

```sh
pnpm vitest --project server --run src/lib/server/chat.spec.ts src/lib/server/retrieval.spec.ts
```

Run type checking and the production build:

```sh
pnpm check
pnpm build
```

The application logs no raw archive questions by default. For production monitoring, track retrieval scores, no-result rates, provider failures, latency, token usage, and reserved-versus-actual cost without storing sensitive family questions unnecessarily.

## Troubleshooting

- **Service not configured:** verify all server-only Supabase, embedding, visitor-secret, and answer-provider variables are present in the current environment.
- **Archives unavailable:** verify the RPC function name, parameter name, embedding model/dimensions, service-role permissions, and Supabase REST access.
- **No answer from relevant-looking documents:** lower or recalibrate `SUPABASE_VECTOR_MATCH_THRESHOLD` using observed RPC similarity scores; do not bypass the relevance gate.
- **Budget or rate-limit response:** inspect `ai_usage_events` and the configured daily/monthly limits. The limit is shared through Supabase and is not stored in browser local storage.
- **Old browser model controls still appear:** confirm the deployed commit contains the rewritten `/chat` page and that the browser is not serving an old cached deployment.
