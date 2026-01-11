import type { FamilyChunk } from './data';
import { ENABLE_LOCAL_LLM, GENERATOR_MODEL, GENERATOR_MAX_NEW_TOKENS, GENERATOR_TEMPERATURE, GENERATOR_TOP_P, GENERATOR_DO_SAMPLE, DEFAULT_SYSTEM_PROMPT, MAX_SOURCES_IN_RESPONSE } from './config';
import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js environment for browser usage
if (typeof window !== 'undefined') {
  // Use the standard Hugging Face CDN
  // @ts-ignore - allowRemoteModels exists in transformers.js
  env.allowRemoteModels = true;
  env.allowLocalModels = false;

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
    generatorPipeline = await pipeline('text-generation', GENERATOR_MODEL, {
      device: 'wasm', // Explicitly use WASM to avoid execution provider mismatches
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

    // Use the chat template format (messages array) which is recommended for v3
    // and ensures the model-specific markers are applied correctly by the tokenizer
    const messages = [
      {
        role: 'system',
        content: `${systemPrompt}\nRéponds UNIQUEMENT en utilisant le contexte fourni ci-dessous. Si l'information n'est pas dans le contexte, dis poliment que tu ne sais pas.`
      },
      {
        role: 'user',
        content: `Voici les archives familiales pertinentes :\n${contextText}\n\nQuestion : ${query}`
      }
    ];

    console.log(`Generating response for query: "${query}" using ${chunks.length} chunks`);

    // Run generation using the messages array
    // We wrap this in a detailed log to help debug if it fails again
    let output;
    try {
      output = await generator(messages, {
        max_new_tokens: GENERATOR_MAX_NEW_TOKENS,
        temperature: GENERATOR_TEMPERATURE,
        top_p: GENERATOR_TOP_P,
        do_sample: GENERATOR_DO_SAMPLE,
      });
    } catch (err: any) {
      console.error('Model execution error details:', {
        message: err.message,
        stack: err.stack,
        model: GENERATOR_MODEL,
        inputLength: contextText.length
      });
      throw err;
    }

    let generatedText = '';
    if (Array.isArray(output) && output.length > 0) {
      // In chat mode, the output usually contains the assistant's reply
      const lastMessage = output[0].generated_text[output[0].generated_text.length - 1];
      generatedText = lastMessage?.content || '';
    }

    if (!generatedText) {
      // Fallback if the output format is different
      if (Array.isArray(output) && output[0].generated_text) {
        generatedText = typeof output[0].generated_text === 'string'
          ? output[0].generated_text
          : JSON.stringify(output[0].generated_text);
      }
    }

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
