import { describe, expect, it } from 'vitest';
import { articleUrl, chroniqueArticleAnchor, chroniqueArticleUrl, chroniqueUrl } from './url-utils';

describe('content URLs', () => {
	it('builds canonical article and chronique URLs', () => {
		expect(articleUrl('article-1', 'Une histoire')).toBe('/histoires/article-1-une-histoire');
		expect(chroniqueUrl('une chronique')).toBe('/chroniques/une%20chronique');
	});

	it('builds stable chronique article anchors and deep links', () => {
		expect(chroniqueArticleAnchor('article-é-1')).toBe('article-article-e-1');
		expect(chroniqueArticleUrl('une-chronique', 'article-é-1')).toBe(
			'/chroniques/une-chronique#article-article-e-1'
		);
	});
});
