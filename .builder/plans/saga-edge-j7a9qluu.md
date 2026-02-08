# Token-Efficient RAG Strategy for Large Books Library

## Problem Statement
Current implementation sends ~1,200-1,500 tokens of context per request (5 chunks × 900 chars/chunk). With 50 large books (< 100 MB total) and a 5,000 token/day budget, this approach will quickly hit limits, especially with multiple related queries in a session.

**User Priority**: Cost optimization (tokens) > Simplicity > Latency
**Usage Pattern**: Multiple related queries per session (ideal for context reuse)
**Constraints**: Simple implementation, small data (~100MB), open to external services (vector DB)

---

## Recommended Approach: Hierarchical Summarization + Session Caching

### Architecture Overview
Instead of always sending full chunks, use a **3-tier context strategy**:

1. **Tier 1 (Cheap)**: Book-level summaries (50 summaries, ~100 tokens each = 5,000 tokens total upfront cost, then cached)
2. **Tier 2 (Moderate)**: Section-level summaries (~300 summaries, ~50 tokens each) for targeted queries
3. **Tier 3 (Expensive)**: Full detail chunks for specific questions requiring verbatim information

### Why This Works
- **For session-based queries**: First query in session pays ~500-800 tokens (summaries). Subsequent related queries reuse context from Tier 1/2 with much lower cost (~200-300 tokens each)
- **Semantic matching**: Summaries are still semantically searchable; no loss of relevance if written well
- **Token savings**: Can reduce per-request tokens by **60-70%** compared to full-chunk RAG
- **Simplicity**: Minimal infrastructure change; can be done with simple text generation (Llama, Claude) or even extractive summarization

### Implementation Path (Ranked by Priority)

#### **Phase 1: Quick Win - Book/Section Summaries (Weeks 1-2)**
**Goal**: Generate and cache summaries before each chat session

**Steps**:
1. **Generate summaries offline** (one-time):
   - Ingest 50 books → split into logical sections (chapters, parts)
   - For each book: generate 1 executive summary (~150 tokens)
   - For each section: generate summary (~50-100 tokens) or use extractive summary of key paragraphs
   - Use Claude with a cheap model (Claude 3.5 Haiku if available, or similar) to batch-generate summaries
   - Store summaries in a new collection: `static/book-summaries.json`

2. **Create summary embeddings**:
   - Apply same TF-IDF embedding process to summaries
   - Precompute embeddings for the 50 book summaries + ~300 section summaries
   - Store in `static/summary-embeddings.json`

3. **Modify search strategy**:
   - When user sends query: first search the **summaries** (not full chunks) for relevance
   - Return top 3-5 summaries (~300-500 tokens total)
   - Optionally: if user asks a follow-up question in the same session, reuse the summaries retrieved from the first query (cache in localStorage)

4. **Modify system prompt**:
   - Include only the relevant summaries (not full chunks) as context
   - Instruct Claude: "Use these book summaries to answer. If the summary doesn't contain enough detail, say so."

**Token Savings**:
- Before: 5 chunks × 225 tokens/chunk = 1,125 tokens context per request
- After: 3 summaries × 60 tokens/summary = 180 tokens context per request
- **Reduction: ~85% per request**

**Trade-off**: Slightly lower answer precision for uncommon questions, but acceptable because:
- Summaries retain core information
- User can ask a follow-up question to drill deeper if needed
- Small data size means summaries will be high quality

---

#### **Phase 2: Session Caching (Weeks 2-3)**
**Goal**: Reuse context across related queries in the same session

**Steps**:
1. **Track conversation context**:
   - Store retrieved summaries in session state (localStorage + optional backend)
   - Each query returns: `{response, summariesUsed: [...], sessionContext: {...}}`

2. **Implement context reuse**:
   - For subsequent queries in same session: check if new query is "related" to previous queries
   - If related: reuse the same summaries from Tier 1 (don't re-search)
   - Append new relevant summaries only if query diverges to a new topic

3. **Modify API request**:
   ```
   POST /api/ai-vercel-chat
   {
     message: "string",
     tokensUsed: number,
     sessionContext?: { summariesUsed: [...], lastQueryTokens: number },  // NEW
     reuseContext?: boolean  // NEW: hint to reuse previous context
   }
   ```

4. **Backend logic**:
   - If `reuseContext=true` and context is still "hot" (< 5 minutes old), reuse summaries
   - Otherwise, run fresh search

**Token Savings**:
- Session first query: ~500-800 tokens (search + summaries)
- Subsequent queries reusing context: ~100-200 tokens (only new query + reused summaries)
- **For 5 related questions: 500 + 4×150 = 1,100 tokens vs. 5×1,200 = 6,000 tokens (82% savings)**

---

#### **Phase 3: Optional - External Vector DB (Weeks 3-4)**
**Only if Phase 1+2 don't meet your needs**

**Option A: Supabase Vector (Recommended - easy integration)**
- Store summaries + full chunks in Supabase with pgvector extension
- Query via semantic search
- Benefit: Better reranking, hybrid search (lexical + semantic)
- Cost: Minimal (small dataset), already in your tech stack
- Implementation: Replace static file search with Supabase queries

**Option B: Pinecone / Weaviate**
- Similar benefits, but external vendor
- Better for very large datasets (yours is small, so less necessary)
- Skip for now unless Phase 1+2 don't meet requirements

**Why this is optional**:
- Phase 1+2 will likely meet cost goals with your small dataset
- External vector DB adds infrastructure complexity
- Supabase is useful mainly if you want multi-user sessions with shared context (future feature)

---

#### **Phase 4: Hybrid Retrieval - Smart Tier Escalation (Optional, Weeks 4-5)**
**If precision is still an issue**:

**Concept**: Let summaries suggest which full chunks to retrieve

1. **Two-stage retrieval**:
   - Stage 1: Search summaries, return top 5 (costs ~300 tokens)
   - Stage 2: If summary relevance is low OR user asks "show me details", fetch full chunks from the matching book sections (costs +500-1,000 tokens)
   - System decides: include full chunks only if confidence is low

2. **Modify system prompt**:
   - Include both summary-level answer + full details
   - Let Claude use whichever is appropriate

**Token cost**: Only triggered on ~20% of requests, so average saved

---

## Quick Implementation Roadmap

### Week 1: Phase 1 (Summary Generation)
- Create `scripts/generate-book-summaries.mjs` to batch-generate summaries using Claude API
- Run summary generation for all 50 books (~cost: $50-100 for bulk summarization)
- Store summaries in `static/book-summaries.json`
- Run embeddings pipeline to create `static/summary-embeddings.json`

### Week 2: Phase 1 (Integration)
- Modify `src/lib/ai/search.ts` to add `searchSummaries()` function (parallel to `searchFamilyData`)
- Modify `src/lib/ai/vercel-generation.ts`:
  - Change `getContextChunks()` to `getSummarySummaries()` (same logic, different data source)
  - Reduce `maxContextTokens` from 2000 to 500
- Update `src/routes/api/ai-vercel-chat/+server.ts` to use summaries
- Test & measure token savings

### Week 2-3: Phase 2 (Session Caching)
- Extend `src/lib/ai/session.ts` to track `sessionContext: { summariesUsed, timestamp }`
- Modify chat page UI to show "using cached context" hint
- Add `reuseContext` parameter to API requests
- Backend: implement summary reuse logic

### Week 3+: Phase 3 & 4 (If needed)
- Only pursue if Phase 1+2 results show insufficient improvements
- Phase 3: Create Supabase migrations for summary storage
- Phase 4: Implement two-stage retrieval with confidence scoring

---

## Expected Outcomes

### Token Cost Reduction
| Scenario | Current | With Phase 1 | With Phase 1+2 |
|----------|---------|--------------|----------------|
| Single query | ~1,200-1,500 tokens | ~500-800 tokens | 500-800 tokens |
| 5 related queries | ~6,000-7,500 tokens | ~2,500-4,000 tokens | ~1,100-1,400 tokens |
| Daily budget for 5 sessions (5 queries each) | Exhausted | Comfortable | 5-6x more sessions possible |

### Quality Trade-off
- **Loss**: ~5-10% precision on highly specific queries (those needing exact text citations)
- **Gain**: 60-80% token savings, ability to handle 5-6x more conversations daily

---

## Files to Create/Modify

### New Files
- `scripts/generate-book-summaries.mjs` — Batch summary generation script
- `static/book-summaries.json` — Generated summaries
- `static/summary-embeddings.json` — TF-IDF embeddings for summaries

### Modified Files
- `src/lib/ai/search.ts` — Add `searchSummaries()` function
- `src/lib/ai/vercel-generation.ts` — Change `getContextChunks()` to use summaries, reduce `maxContextTokens`
- `src/routes/api/ai-vercel-chat/+server.ts` — Use summaries, support session context
- `src/lib/ai/session.ts` — Track `sessionContext` for caching
- `src/routes/ai-chat/+page.svelte` — Pass `reuseContext` flag, show cache status

### Optional (Phase 3)
- `src/lib/server/supabase-vectors.ts` — Supabase integration layer

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Summaries lose important context | Start with 2-3 paragraph summaries per section; include extraction of key names/dates |
| User asks question requiring exact quotes | Include fallback: "For exact citations, I'd need to search detailed chunks (uses more tokens). Should I?" |
| Summarization cost | Batch generate during off-peak hours; use cheaper Claude model (Haiku) |
| Session context stales | Set cache TTL to 5-10 minutes; offer "refresh context" button for long sessions |

---

## Success Criteria

- **Token usage per request**: ≤ 500 tokens (vs. 1,200-1,500 currently)
- **Daily conversation capacity**: 10+ sessions (vs. ~4 currently with 5,000 token budget)
- **Answer quality**: 90%+ relevant answers on common queries
- **Implementation time**: 2-3 weeks for Phase 1+2

---

## Alternative Approaches (Not Recommended for Your Case, but Listed for Completeness)

1. **Fine-tuning**: Expensive upfront, not worth it for < 100MB data
2. **Knowledge Graphs**: Overkill for your use case; adds complexity without proportional token savings
3. **RAG with Retrieval Ranking**: Complex; Phase 1+2 achieves 80% of benefit at 20% of complexity
4. **Full model fine-tuning on book summaries**: Too expensive, not necessary
5. **Extractive summarization (no LLM)**: Faster but lower quality; recommend LLM-based summaries

---

## Recommended Starting Point

**Start with Phase 1** (summary generation + integration) immediately:
- Spend a few hours to set up `scripts/generate-book-summaries.mjs`
- Run batch summarization for all 50 books (one-time cost ~$50-100)
- Modify search to use summaries instead of chunks
- Measure token savings; likely 60-70% reduction
- Then decide if Phase 2 (session caching) is needed

**This is the best risk/reward balance** for your constraints (cost priority, small data, simple implementation).
