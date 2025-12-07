# On-device Retrieval-First Chatbot (RAG) — Local-only

This project implements a privacy-first, on-device retrieval-first chatbot that answers questions only from your family-history dataset. The app stores the family text as static chunks and performs client-side search to find relevant passages.

Summary
- Ingestion script: `scripts/ingest-builder-content.mjs` — fetches Builder.io content (models: `stories`, `blog-articles`) and writes `static/family-data.json`.
- Client retrieval: `src/lib/ai/*` — lightweight in-memory retrieval and search. By default the chat uses conservative token matching to find passages and will refuse if none match.

Quick start (dev)
1. Ensure `PUBLIC_BUILDER_API_KEY` is set in your environment (Builder.io API key for the account containing your family content).

```bash
# create the static dataset from Builder.io
PUBLIC_BUILDER_API_KEY=your_key pnpm prepare:rag

# run the dev server
pnpm dev
```

2. Visit `/chat` and ask questions. If `static/family-data.json` is present the client will search inside it and return passages. If there is no strong hit it will reply with a refusal message.

Notes
- For strict non-hallucination we currently use retrieval-only answers (no native on-device LLM used yet). If you want human-friendly paraphrases, see the Optional local LLM feature planned in the repository.
3. Optional: precompute embeddings (TF-IDF) for better retrieval

```bash
# after you create static/family-data.json
pnpm prepare:embeddings
```

This creates `static/family-embeddings.json` and `static/family-vocab.json` using a local TF-IDF precompute. The client will automatically use these files for cosine-similarity retrieval if they exist.
 - For strict non-hallucination we currently use retrieval-only answers (no native on-device LLM used yet). If you want human-friendly paraphrases, see the Optional local LLM feature planned in the repository.

## Optional: On-Device Summarizer (transformers.js)

### Overview

A feature-flagged, privacy-first summarizer runs entirely in the browser using [transformers.js](https://xenova.github.io/transformers.js/). When enabled, it synthesizes answers from retrieved family history passages using a lightweight transformer model, avoiding any external API calls.

### Enabling the Summarizer

1. **Set the feature flag** in `src/lib/ai/config.ts`:

```typescript
export const ENABLE_LOCAL_LLM = true; // Enable on-device summarizer
```

2. **(Optional) Choose a model**. The default is `Xenova/bart-large-cnn`, which works well for English and some multilingual content:

```typescript
// src/lib/ai/config.ts
export const SUMMARIZER_MODEL = 'Xenova/bart-large-cnn'; // or choose another below
```

**Recommended models:**
- `Xenova/bart-large-cnn` (default): English-optimized, ~400MB
- `Xenova/distilbart-cnn-6-6`: Smaller, faster (~180MB), English
- `Xenova/mbart-large-cc25`: Multilingual (handles French + English + 23 other languages), ~1.1GB
- `moussaKam/barthez`: French-optimized (high quality), ~400MB
- `google/mt5-small`: Multilingual & lightweight (~230MB), good for French

**For French family histories, we recommend:**
- `Xenova/mbart-large-cc25` for high-quality multilingual output
- Or `moussaKam/barthez` if you have French-only content

3. **(Optional) Adjust summary length** in `src/lib/ai/config.ts`:

```typescript
export const SUMMARIZER_MIN_LENGTH = 50;   // Minimum tokens in summary
export const SUMMARIZER_MAX_LENGTH = 200;  // Maximum tokens in summary
export const SUMMARIZER_DO_SAMPLE = false; // Use deterministic generation
```

### How It Works

1. **On first use**, the browser downloads the transformer model (~200MB–1.1GB depending on model choice) and caches it locally. This happens once per browser/device.
2. **User asks a question** → System retrieves relevant family history passages
3. **Summarizer synthesizes** a human-readable answer from those passages only (no external LLM calls)
4. **Result is displayed** in the chat interface with attribution to source documents

### Performance & Experience

| Stage | Time | Notes |
|-------|------|-------|
| First inference (cold start) | 30–90 seconds | Model download + initialization. UI shows "Initializing summarizer..." |
| Subsequent inferences (cached) | 5–15 seconds | Model cached in browser, only inference runs |
| Input text limit | ~2000 characters | Longer passages are truncated to keep inference fast |

**First-time experience:**
- User will see a message: "Initialisation du résumeur local... (Ceci ne se fera qu'une seule fois)"
- The browser downloads the model and initializes it
- Subsequent questions are much faster (model is cached)

### Browser Requirements

- **WASM support**: All modern browsers (Chrome, Firefox, Safari, Edge from 2016+)
- **Memory**: Recommend ≥2GB RAM (model + inference workspace)
- **Network**: Internet needed for first inference (model download). Subsequent inferences work offline.

### Troubleshooting

**Q: The summarizer is taking too long**
- A: First inference downloads the model (~30–90 seconds depending on model size and network). Subsequent inferences are fast. If stuck, check browser console for WASM initialization warnings.

**Q: Browser runs out of memory or crashes**
- A: The model may be too large for your device. Try a smaller model:
  - From `Xenova/mbart-large-cc25` (1.1GB) → `google/mt5-small` (230MB)
  - Or set `SUMMARIZER_MAX_LENGTH = 150` to reduce memory use

**Q: Summaries are too long or too short**
- A: Adjust `SUMMARIZER_MIN_LENGTH` and `SUMMARIZER_MAX_LENGTH` in `src/lib/ai/config.ts`

**Q: I want to use a custom model**
- A: Ensure it's a summarization model available on [Hugging Face Hub](https://huggingface.co/models?pipeline_tag=summarization&library=transformers.js). Set `SUMMARIZER_MODEL` to its identifier (e.g., `'Xenova/your-model-name'`)

**Q: How do I disable it again?**
- A: Set `ENABLE_LOCAL_LLM = false` in `src/lib/ai/config.ts`. The system will show raw passages instead.

### Architecture

- **Lazy loading**: The transformer model is only loaded when `ENABLE_LOCAL_LLM = true` and the user sends their first message
- **Caching**: Once loaded, the model pipeline is cached in memory for reuse
- **Error handling**: If the model fails to load, the chat gracefully falls back to showing raw passages
- **Privacy**: All inference happens in the browser; no data leaves the user's device

### Implementation Details

- **Model loader**: `src/lib/ai/generation.ts` → `loadSummarizer()`
- **Feature flag**: `src/lib/ai/config.ts` → `ENABLE_LOCAL_LLM`
- **UI integration**: `src/routes/chat/+page.svelte` → checks flag and shows initialization message
- **Dependency**: `@xenova/transformers` (installed via npm)

Privacy
- All processing (search + optional embeddings/generation) can happen locally on the user's device.
- The app will only answer using passages found in the exported dataset.
