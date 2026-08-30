import { describe, expect, it } from 'vitest';
import { buildArchiveContext, normalizeArchiveResults } from './retrieval';

describe('normalizeArchiveResults', () => {
	it('normalizes supported fields, filters low scores, and deduplicates ids', () => {
		const results = normalizeArchiveResults(
			[
				{
					document_id: 'one',
					source_title: 'First',
					text: 'A',
					similarity: 0.9,
					source_url: 'https://example.com/a'
				},
				{ id: 'one', title: 'Duplicate', content: 'B', score: 0.95 },
				{ id: 'two', title: 'Too weak', content: 'C', score: 0.4 },
				{ id: 'three', title: 'Unsafe', content: 'D', score: 0.8, url: 'javascript:alert(1)' }
			],
			0.7
		);
		expect(results.map((result) => result.id)).toEqual(['one', 'three']);
		expect(results[0].url).toBe('https://example.com/a');
		expect(results[1].url).toBeUndefined();
	});
});

describe('buildArchiveContext', () => {
	it('caps context length', () => {
		const context = buildArchiveContext(
			[{ id: 'one', title: 'First', content: 'abcdef', score: 1, sourceType: 'document' }],
			4
		);
		expect(context.length).toBeLessThanOrEqual(4 + '[one] First\n'.length);
	});
});
