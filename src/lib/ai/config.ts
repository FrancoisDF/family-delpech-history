// Feature flags and AI config
export const ENABLE_LOCAL_LLM = true; // Feature flag for optional on-device LLM summarizer

// Summarizer model configuration (used when ENABLE_LOCAL_LLM is true)
export const SUMMARIZER_MODEL = 'Xenova/bart-large-cnn'; // Using distilled CNN-based BART (supports English/multilingual content)
// Note: For French-specific content, consider 'moussaKam/barthez' or 'google/mt5-small'

export const SUMMARIZER_MIN_LENGTH = 50; // Minimum length of summary (tokens)
export const SUMMARIZER_MAX_LENGTH = 200; // Maximum length of summary (tokens)
export const SUMMARIZER_DO_SAMPLE = true; // Use deterministic greedy decoding for consistency
