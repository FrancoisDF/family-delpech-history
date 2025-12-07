import type { FamilyChunk } from './data';
import { ENABLE_LOCAL_LLM, SUMMARIZER_MODEL, SUMMARIZER_MIN_LENGTH, SUMMARIZER_MAX_LENGTH, SUMMARIZER_DO_SAMPLE } from './config';

// Cached summarizer pipeline (lazy-loaded)
let summarizerPipeline: any = null;
let isLoadingSummarizer = false;
let summarizerLoadError: Error | null = null;

/**
 * Lazily load and cache the transformer-based summarization pipeline.
 * Only called when ENABLE_LOCAL_LLM is true.
 * @returns The summarization pipeline or null if loading failed
 */
async function loadSummarizer() {
  // Return cached pipeline if already loaded
  if (summarizerPipeline !== null) {
    return summarizerPipeline;
  }

  // Return null if already failed
  if (summarizerLoadError !== null) {
    console.warn('Summarizer load failed previously:', summarizerLoadError.message);
    return null;
  }

  // Prevent concurrent loading attempts
  if (isLoadingSummarizer) {
    // Wait for the loading to complete
    let waitCount = 0;
    while (isLoadingSummarizer && waitCount < 100) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      waitCount++;
    }
    return summarizerPipeline;
  }

  isLoadingSummarizer = true;

  try {
    // Dynamically import transformers only when needed (tree-shaking)
    const { pipeline } = await import('@xenova/transformers');

    console.log(`Loading summarizer model: ${SUMMARIZER_MODEL}`);
    summarizerPipeline = await pipeline('summarization', SUMMARIZER_MODEL);
    console.log('Summarizer pipeline loaded successfully');

    return summarizerPipeline;
  } catch (error) {
    summarizerLoadError = error instanceof Error ? error : new Error(String(error));
    console.error('Failed to load summarizer pipeline:', summarizerLoadError);
    return null;
  } finally {
    isLoadingSummarizer = false;
  }
}

/**
 * Get whether the summarizer is currently loading
 */
export function isSummarizerLoading(): boolean {
  return isLoadingSummarizer;
}

/**
 * Summarize retrieved chunks using on-device transformer model.
 * Strictly synthesizes answers from the retrieved passages only.
 * Falls back to concatenated passages if summarizer is disabled, unavailable, or fails.
 * @param chunks Family history chunks to summarize
 * @param query User's original query
 * @returns Summarized text or null to fallback to raw passages
 */
export async function summarizeFromChunks(chunks: FamilyChunk[], query: string): Promise<string | null> {
  if (!ENABLE_LOCAL_LLM) {
    return null; // Feature flag disabled
  }

  if (!chunks || chunks.length === 0) {
    return null; // No chunks to summarize
  }

  try {
    // Load the summarizer pipeline (will be cached after first load)
    const summarizer = await loadSummarizer();

    if (!summarizer) {
      console.warn('Summarizer pipeline unavailable, falling back to passages');
      return null;
    }

    // Concatenate chunk texts with reasonable limit to avoid timeout
    // Limit to ~2000 characters to keep inference time reasonable
    const MAX_INPUT_LENGTH = 2000;
    let combinedText = '';

    for (const chunk of chunks) {
      const text = chunk.text.replace(/\s+/g, ' ').trim();
      if (combinedText.length + text.length > MAX_INPUT_LENGTH) {
        break;
      }
      if (combinedText.length > 0) {
        combinedText += ' ';
      }
      combinedText += text;
    }

    if (!combinedText) {
      return null; // No text to summarize
    }

    console.log(`Summarizing ${combinedText.length} characters from ${chunks.length} chunks`);

    // Run the summarization pipeline
    const summaryResult = await summarizer(combinedText, {
      min_length: SUMMARIZER_MIN_LENGTH,
      max_length: SUMMARIZER_MAX_LENGTH,
      do_sample: SUMMARIZER_DO_SAMPLE
    });

    if (!summaryResult || !Array.isArray(summaryResult) || summaryResult.length === 0) {
      console.warn('Summarizer returned empty result');
      return null;
    }

    const summary = summaryResult[0]?.summary_text || '';

    if (!summary) {
      console.warn('Summarizer returned empty summary text');
      return null;
    }

    // Format the answer with attribution
    const sourcesList = chunks
      .map((c) => c.title || c.sourceId)
      .filter(Boolean)
      .slice(0, 5)
      .join(', ');

    const answer = `${summary}\n\n(Sources: ${sourcesList})`;

    return answer;
  } catch (error) {
    // Log but don't throw — let caller fallback to passages
    console.error('Error during summarization:', error);
    return null;
  }
}
