// Feature flags and AI config
// NOTE: Temporarily disabled due to ONNX tensor data location issues with Qwen2 model
// The raw passage fallback will be used instead to maintain functionality
export const ENABLE_LOCAL_LLM = false; // Feature flag for optional on-device LLM summarizer

// Generator model configuration (used when ENABLE_LOCAL_LLM is true)
// We use Qwen2 which is more robust and has a verified ONNX export
export const GENERATOR_MODEL = 'onnx-community/Qwen2-0.5B-Instruct-ONNX';

export const GENERATOR_MAX_NEW_TOKENS = 150; // Maximum new tokens to generate
export const GENERATOR_TEMPERATURE = 0.7; // Temperature for sampling (0.0-1.0)
export const GENERATOR_TOP_P = 0.9; // Top-p sampling
export const GENERATOR_DO_SAMPLE = true; // Use sampling for more natural "human" responses

// System prompt configuration - can be updated via localStorage
export const DEFAULT_SYSTEM_PROMPT = `Je suis une femme âgée partageant l'histoire de ma famille avec bienveillance et nostalgie. Je réponds avec douceur et personnalité, en utilisant les informations des archives familiales pour créer des réponses authentiques et émouvantes. Je parle de mes ancêtres, de nos traditions et des moments importants avec affection. Mes réponses sont courtes et touchantes, jamais plus de 2-3 phrases.`;

export const MAX_SOURCES_IN_RESPONSE = 2; // Limit number of sources in responses
