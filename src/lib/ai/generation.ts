import type { FamilyChunk } from './data';
import { ENABLE_LOCAL_LLM, GENERATOR_MODEL, GENERATOR_MAX_NEW_TOKENS, GENERATOR_TEMPERATURE, GENERATOR_TOP_P, GENERATOR_DO_SAMPLE, DEFAULT_SYSTEM_PROMPT, MAX_SOURCES_IN_RESPONSE } from './config';
import { pipeline, env } from '@xenova/transformers';

// Configure transformers.js environment for browser usage
if (typeof window !== 'undefined') {
  // Force remote model loading from Hugging Face using *raw file* URLs.
  // @ts-ignore
  env.allowRemoteModels = true;
  // @ts-ignore
  env.allowLocalModels = false;

  // Bump the cache directory to force a clean download if needed.
  // @ts-ignore
  env.cacheDir = 'transformers-cache-v5';

  // Global ONNX environment configuration
  // @ts-ignore
  env.backends.onnx.wasm.proxy = false;
  
  // Use multi-threading if available (capped at 4 for stability)
  // @ts-ignore
  env.backends.onnx.wasm.numThreads = Math.min(4, navigator.hardwareConcurrency || 1);

  // Set execution providers - try WebGPU first for much better performance
  // @ts-ignore
  env.backends.onnx.executionProviders = ['webgpu', 'wasm'];
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
export async function loadGenerator() {
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

    // We use text2text-generation for models like LaMini-Flan-T5
    // The SDK typings may lag behind supported runtime options (e.g. `device`).
    generatorPipeline = await pipeline('text2text-generation', GENERATOR_MODEL, {
      device: 'cpu', // pipeline defaults to cpu for wasm/webgpu backends usually
      progress_callback: (progress: any) => {
        if (progress.status === 'progress') {
          currentProgress = {
            status: 'downloading',
            percentage: progress.progress,
            file: progress.file
          };
        } else if (progress.status === 'done') {
          currentProgress = { status: 'done', percentage: 100 };
        }
      }
    } as any);

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

  return `Consigne: Réponds impérativement en FRANÇAIS.\n- Réponds en 3 phrases courtes.\n- Ne réponds jamais par un seul mot.\n- Si tu n'es pas sûre, dis-le poliment.\n\nContexte: ${system}\n\nQuestion: ${user}\n\nRéponse (3 phrases en français):`;
}

function buildPromptFromMessages(generator: any, messages: LocalChatMessage[]): string {
  return buildT5Prompt(messages);
}

function extractGeneratedText(output: any): string {
  if (!output) return '';

  if (Array.isArray(output) && output.length > 0) {
    const first = output[0];
    const generated = first?.generated_text;
    if (typeof generated === 'string') return generated;
  }

  if (typeof output === 'string') return output;
  return '';
}

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function ensureThreeShortSentences(text: string): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return cleaned;

  const endPunctuated = /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`;
  const sentences = endPunctuated
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const extras = [
    "J'espère que cela répond à ta question.",
    "Si tu veux, je peux préciser avec les sources."
  ];

  let out = sentences.join(' ');
  let idx = 0;
  while (out.split(/(?<=[.!?])\s+/).filter(Boolean).length < 3 && idx < extras.length) {
    out = `${out} ${extras[idx]}`.trim();
    idx++;
  }

  return out;
}

function buildFallbackFrenchAnswer(chunks: FamilyChunk[], query: string): string {
  const top = chunks[0];
  const snippet = top?.text
    ? top.text.replace(/\s+/g, ' ').trim().slice(0, 180)
    : '';

  const base = snippet
    ? `D'après les archives, ${snippet}`
    : "D'après les archives, je n'ai qu'un indice partiel pour le moment";

  return ensureThreeShortSentences(`${base}.`);
}

/**
 * Generate a response from retrieved chunks using on-device transformer model.
 * Synthesizes an answer based on context and persona instructions.
 * @param chunks Family history chunks to use as context
 * @param query User's original query
 * @param onToken Callback for streaming tokens
 * @returns Generated text or null to fallback to raw passages
 */
export async function summarizeFromChunks(
  chunks: FamilyChunk[], 
  query: string,
  onToken?: (token: string) => void
): Promise<string | null> {
  if (!ENABLE_LOCAL_LLM) {
    return null;
  }

  if (!chunks || chunks.length === 0) {
    return null;
  }

  try {
    const generator = await loadGenerator();
    if (!generator) return null;

    const systemPrompt = getSystemPrompt();

    // Limit context
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
        content: `${systemPrompt}\nRéponds UNIQUEMENT en utilisant le contexte fourni ci-dessous.`
      },
      {
        role: 'user',
        content: `Voici les archives familiales pertinentes :\n${contextText}\n\nQuestion : ${query}`
      }
    ];

    const promptText = buildPromptFromMessages(generator, messages);
    
    let streamedText = '';
    const output = await generator(promptText, {
      max_new_tokens: GENERATOR_MAX_NEW_TOKENS,
      temperature: GENERATOR_TEMPERATURE,
      top_p: GENERATOR_TOP_P,
      do_sample: GENERATOR_DO_SAMPLE,
      return_full_text: false,
      // Stream handler for real-time updates (best-effort)
      callback_function: onToken
        ? (beams: any[]) => {
            try {
              const ids = beams?.[0]?.output_token_ids;
              if (!ids || !generator?.tokenizer?.decode) return;
              const decoded = generator.tokenizer.decode(ids, { skip_special_tokens: true });
              streamedText = String(decoded || '').trim();
              if (streamedText) onToken(streamedText);
            } catch {
              // ignore streaming decode errors
            }
          }
        : undefined
    });

    // Prefer streamed text if available, otherwise use final output
    let generatedText = (streamedText || extractGeneratedText(output) || '').replace(/\s+/g, ' ').trim();

    // Guard against empty / one-word answers
    if (!generatedText || countWords(generatedText) < 4) {
      generatedText = buildFallbackFrenchAnswer(chunks, query);
    }

    generatedText = ensureThreeShortSentences(generatedText);

    // Simulated streaming fallback (ensures the UI still "types" even if callback_function is not supported)
    if (onToken && (!streamedText || streamedText.length < 5)) {
      const words = generatedText.split(/\s+/).filter(Boolean);
      let acc = '';
      for (let i = 0; i < words.length; i++) {
        acc = acc ? `${acc} ${words[i]}` : words[i];
        onToken(acc);
        await new Promise((r) => setTimeout(r, 40));
      }
    } else if (onToken) {
      onToken(generatedText);
    }

    // Format with sources
    const sourcesList = chunks
      .map((c) => {
        const base = c.title || c.sourceId;
        if (!base) return '';
        if (c.sourceType === 'attachment' && c.originPostTitle) {
          return `${base} (dans «${c.originPostTitle}»)`;
        }
        return base;
      })
      .filter(Boolean)
      .slice(0, MAX_SOURCES_IN_RESPONSE)
      .join(', ');

    return sourcesList ? `${generatedText}\n\n(Sources: ${sourcesList})` : generatedText;

  } catch (error) {
    console.error('Error during generation:', error);
    return null;
  }
}
