import type { FamilyChunk } from './data';
import { ENABLE_LOCAL_LLM, GENERATOR_MODEL, GENERATOR_MAX_NEW_TOKENS, GENERATOR_TEMPERATURE, GENERATOR_TOP_P, GENERATOR_DO_SAMPLE, DEFAULT_SYSTEM_PROMPT, MAX_SOURCES_IN_RESPONSE } from './config';
import { pipeline, env } from '@xenova/transformers';

// Configure transformers.js environment for browser usage
if (typeof window !== 'undefined') {
  // Force remote model loading from Hugging Face using *raw file* URLs.
  // If this is misconfigured, the library may fetch HTML "blob" pages instead of JSON, causing
  // `Unexpected token '<' ... is not valid JSON`.
  // @ts-ignore
  env.allowRemoteModels = true;
  // @ts-ignore
  env.allowLocalModels = false;

  // If the app previously cached an HTML error page (from a bad URL), it can keep failing.
  // Bump the cache directory to force a clean download.
  // @ts-ignore
  env.cacheDir = 'transformers-cache-v5';

  // Global ONNX environment configuration
  // @ts-ignore
  env.backends.onnx.wasm.proxy = false;
  // @ts-ignore
  env.backends.onnx.wasm.numThreads = 1; // Single thread can be more stable in some browser environments

  // Set execution provider to 'wasm' explicitly to avoid WebGPU issues if not supported
  // @ts-ignore
  env.backends.onnx.executionProviders = ['wasm'];
}

// Cached generator pipeline (lazy-loaded)
let generatorPipeline: any = null;
let isLoadingGenerator = false;
let generatorLoadError: Error | null = null;
let loadAbortController: AbortController | null = null;

export interface LoadProgress {
  status: 'init' | 'downloading' | 'done' | 'error' | 'cancelled';
  percentage: number;
  file?: string;
}

let currentProgress: LoadProgress = { status: 'init', percentage: 0 };

/**
 * Get the current loading progress
 */
export function getGeneratorProgress(): LoadProgress {
  return currentProgress;
}

/**
 * Cancel the current model loading
 */
export function cancelModelLoading(): void {
  if (loadAbortController) {
    loadAbortController.abort();
    loadAbortController = null;
  }
  isLoadingGenerator = false;
  currentProgress = { status: 'cancelled', percentage: 0 };
  generatorLoadError = new Error('Chargement annulé par l\'utilisateur');
}

/**
 * Lazily load and cache the transformer-based text-generation pipeline.
 * Only called when ENABLE_LOCAL_LLM is true.
 * @returns The generator pipeline or null if loading failed
 */
async function loadGenerator() {
  // Return cached pipeline if already loaded
  if (generatorPipeline !== null) {
    return generatorPipeline;
  }

  // Return null if already failed and not in progress
  if (generatorLoadError !== null && !isLoadingGenerator) {
    console.warn('Generator load failed previously:', generatorLoadError.message);
    return null;
  }

  // Prevent concurrent loading attempts
  if (isLoadingGenerator) {
    // Wait for the loading to complete
    let waitCount = 0;
    while (isLoadingGenerator && waitCount < 300) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      waitCount++;
      if (generatorPipeline) return generatorPipeline;
    }
    return generatorPipeline;
  }

  isLoadingGenerator = true;
  generatorLoadError = null;
  loadAbortController = new AbortController();
  currentProgress = { status: 'downloading', percentage: 0 };

  try {
    console.log(`Initializing AI generator with model: ${GENERATOR_MODEL}`);

    // We use text-generation for instruction-following chat models
    generatorPipeline = await pipeline('text2text-generation', GENERATOR_MODEL, {
      // Note: `device: 'wasm'` is not a valid device selector and can lead to undefined tensor locations.
      // We force CPU tensors and separately restrict the ONNX execution provider to WASM.
      device: 'cpu',
      progress_callback: (progress: any) => {
        if (progress.status === 'progress') {
          currentProgress = {
            status: 'downloading',
            percentage: progress.progress,
            file: progress.file
          };
          console.log(`Loading AI: ${progress.file} (${progress.progress.toFixed(1)}%)`);
        } else if (progress.status === 'done') {
          currentProgress = { status: 'done', percentage: 100 };
        }
      }
    });

    console.log('Generator pipeline loaded successfully');
    currentProgress = { status: 'done', percentage: 100 };

    return generatorPipeline;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log('Model loading was cancelled');
      currentProgress = { status: 'cancelled', percentage: 0 };
    } else {
      generatorLoadError = error instanceof Error ? error : new Error(String(error));
      console.error('Failed to load generator pipeline:', generatorLoadError);
      currentProgress = { status: 'error', percentage: 0 };
    }
    return null;
  } finally {
    isLoadingGenerator = false;
    loadAbortController = null;
  }
}

/**
 * Get whether the generator is currently loading
 */
export function isSummarizerLoading(): boolean {
  return isLoadingGenerator;
}

/**
 * Get the current system prompt from localStorage or use default
 */
export function getSystemPrompt(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_SYSTEM_PROMPT;
  }
  try {
    const stored = localStorage.getItem('systemPrompt');
    return stored || DEFAULT_SYSTEM_PROMPT;
  } catch {
    return DEFAULT_SYSTEM_PROMPT;
  }
}

/**
 * Save system prompt to localStorage
 */
export function setSystemPrompt(prompt: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('systemPrompt', prompt);
  } catch (err) {
    console.warn('Failed to save system prompt:', err);
  }
}

type LocalChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

function buildT5Prompt(messages: LocalChatMessage[]): string {
  // Simple prompt building for T5/LaMini, emphasizing French language
  const system = messages.find((m) => m.role === 'system')?.content || '';
  const user = messages.find((m) => m.role === 'user')?.content || '';

  return `Consigne: Réponds impérativement en FRANÇAIS.\n\nContext: ${system}\n\nQuestion: ${user}\n\nRéponse en français:`;
}

function buildPromptFromMessages(generator: any, messages: LocalChatMessage[]): string {
  // For T5/LaMini, we stick to simple instruction format
  return buildT5Prompt(messages);
}

function extractGeneratedText(output: any): string {
  if (!output) return '';

  // Typical pipeline output: [{ generated_text: string }]
  if (Array.isArray(output) && output.length > 0) {
    const first = output[0];
    const generated = first?.generated_text;

    if (typeof generated === 'string') return generated;

    // Some chat pipelines may return an array of messages
    if (Array.isArray(generated) && generated.length > 0) {
      const last = generated[generated.length - 1];
      if (typeof last?.content === 'string') return last.content;
      return JSON.stringify(last);
    }

    if (typeof first === 'string') return first;
  }

  if (typeof output === 'string') return output;

  return '';
}

/**
 * Generate a response from retrieved chunks using on-device transformer model.
 * Synthesizes an answer based on context and persona instructions.
 * @param chunks Family history chunks to use as context
 * @param query User's original query
 * @returns Generated text or null to fallback to raw passages
 */
export async function summarizeFromChunks(chunks: FamilyChunk[], query: string): Promise<string | null> {
  if (!ENABLE_LOCAL_LLM) {
    return null; // Feature flag disabled
  }

  if (!chunks || chunks.length === 0) {
    return null; // No chunks to generate from
  }

  try {
    // Load the generator pipeline
    const generator = await loadGenerator();

    if (!generator) {
      console.warn('Generator pipeline unavailable, falling back to passages');
      return null;
    }

    const systemPrompt = getSystemPrompt();

    // Limit context to avoid overloading small models
    const MAX_CONTEXT_LENGTH = 1500;
    let contextText = '';
    for (const chunk of chunks) {
      const text = chunk.text.replace(/\s+/g, ' ').trim();
      if (contextText.length + text.length > MAX_CONTEXT_LENGTH) break;
      contextText += (contextText ? ' ' : '') + `[Document: ${chunk.title}] ${text}`;
    }

    const messages: LocalChatMessage[] = [
      {
        role: 'system',
        content: `${systemPrompt}\nRéponds UNIQUEMENT en utilisant le contexte fourni ci-dessous. Si l'information n'est pas dans le contexte, dis poliment que tu ne sais pas.`
      },
      {
        role: 'user',
        content: `Voici les archives familiales pertinentes :\n${contextText}\n\nQuestion : ${query}`
      }
    ];

    const promptText = buildPromptFromMessages(generator, messages);

    console.log(`Generating response for query: "${query}" using ${chunks.length} chunks (prompt length: ${promptText.length})`);

    let output;
    try {
      output = await generator(promptText, {
        max_new_tokens: GENERATOR_MAX_NEW_TOKENS,
        temperature: GENERATOR_TEMPERATURE,
        top_p: GENERATOR_TOP_P,
        do_sample: GENERATOR_DO_SAMPLE,
        // When supported by the pipeline, this prevents the prompt from being echoed back.
        return_full_text: false
      });
    } catch (err: any) {
      console.error('Model execution error details:', {
        message: err?.message,
        stack: err?.stack,
        model: GENERATOR_MODEL,
        inputLength: contextText.length,
        promptLength: promptText.length
      });

      // Attempt a self-heal on next call if the runtime had a tensor location issue
      if (typeof err?.message === 'string' && err.message.includes('invalid data location')) {
        console.warn('Detected ONNX tensor location issue; resetting generator pipeline for next attempt');
        generatorPipeline = null;
        generatorLoadError = null;
      }

      return null;
    }

    let generatedText = extractGeneratedText(output);

    // Basic cleaning - Chat models usually return clean text, but we'll trim
    generatedText = generatedText.trim();

    if (!generatedText) {
      console.warn('Generator returned empty text');
      return null;
    }

    // Format with sources
    const sourcesList = chunks
      .map((c) => c.title || c.sourceId)
      .filter(Boolean)
      .slice(0, MAX_SOURCES_IN_RESPONSE)
      .join(', ');

    return sourcesList ? `${generatedText}\n\n(Sources: ${sourcesList})` : generatedText;

  } catch (error) {
    console.error('Error during generation:', error);
    return null;
  }
}
