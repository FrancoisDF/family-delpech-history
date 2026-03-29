/**
 * Server-side embedding generation using @xenova/transformers
 * Model: Xenova/all-MiniLM-L6-v2 (384 dimensions, free, local)
 */

let pipeline: any = null;
let pipelinePromise: Promise<any> | null = null;

const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';

/**
 * Get or initialize the embedding pipeline (singleton)
 */
async function getPipeline() {
	if (pipeline) return pipeline;
	if (pipelinePromise) return pipelinePromise;

	pipelinePromise = (async () => {
		const { pipeline: createPipeline } = await import('@xenova/transformers');
		pipeline = await createPipeline('feature-extraction', MODEL_NAME);
		return pipeline;
	})();

	return pipelinePromise;
}

/**
 * Generate an embedding vector for a single text string
 * Returns a 384-dimensional float array
 */
export async function generateEmbedding(text: string): Promise<number[]> {
	const pipe = await getPipeline();
	const output = await pipe(text, { pooling: 'mean', normalize: true });
	return Array.from(output.data as Float32Array);
}

/**
 * Generate embeddings for multiple texts in batches
 * Processes in batches to avoid memory issues with large corpora
 */
export async function generateEmbeddings(
	texts: string[],
	opts?: { batchSize?: number; onProgress?: (done: number, total: number) => void }
): Promise<number[][]> {
	const batchSize = opts?.batchSize ?? 32;
	const results: number[][] = [];

	for (let i = 0; i < texts.length; i += batchSize) {
		const batch = texts.slice(i, i + batchSize);
		const batchResults = await Promise.all(batch.map((t) => generateEmbedding(t)));
		results.push(...batchResults);

		opts?.onProgress?.(Math.min(i + batchSize, texts.length), texts.length);
	}

	return results;
}
