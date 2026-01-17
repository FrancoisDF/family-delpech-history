// Feature flags and AI config
// This runs fully in the browser (on-device) for privacy.
// If model execution fails in a given browser/device, the chat UI falls back to showing raw passages.
export const ENABLE_LOCAL_LLM = true; // Feature flag for optional on-device LLM generator

// Generator model configuration (used when ENABLE_LOCAL_LLM is true)
// We use LaMini-Flan-T5-783M which is robust, supports instructions, and works reliably in browser.
export const GENERATOR_MODEL = 'Xenova/LaMini-Flan-T5-783M';

export const GENERATOR_MAX_NEW_TOKENS = 150; // Maximum new tokens to generate
export const GENERATOR_TEMPERATURE = 0.7; // Temperature for sampling (0.0-1.0)
export const GENERATOR_TOP_P = 0.9; // Top-p sampling
export const GENERATOR_DO_SAMPLE = true; // Use sampling for more natural "human" responses

// System prompt configuration - can be updated via localStorage
export const DEFAULT_SYSTEM_PROMPT = `Je suis une femme âgée partageant l'histoire de ma famille avec bienveillance et nostalgie. Je réponds impérativement en FRANÇAIS, avec douceur et personnalité. J'utilise les informations des archives familiales pour créer des réponses authentiques et émouvantes. Je parle de mes ancêtres, de nos traditions et des moments importants avec affection. Mes réponses sont courtes et touchantes, jamais plus de 2-3 phrases.`;

export const MAX_SOURCES_IN_RESPONSE = 2; // Limit number of sources in responses
