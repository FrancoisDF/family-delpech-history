import { describe, expect, it } from 'vitest';
import { articleUrl, chroniqueArticleAnchor, chroniqueArticleUrl, chroniqueUrl, extractTagsId, toKebabCase } from './url-utils';

describe('content URLs', () => {
	it('builds canonical article and chronique URLs', () => {
		expect(articleUrl('article-1', 'Une histoire')).toBe('/histoires/une-histoire');
		expect(articleUrl('article-1', 'Une histoire', 'mon-handle')).toBe('/histoires/mon-handle');
		expect(articleUrl('article-1', 'Une histoire', undefined, 'mon-slug')).toBe('/histoires/mon-slug');
		expect(articleUrl('article-1', 'Été_à Paris !')).toBe('/histoires/ete-a-paris');
		expect(articleUrl('article-1', '!!!')).toBe('/histoires/article-1');
		expect(toKebabCase(' -- Été__à Paris -- ')).toBe('ete-a-paris');
		expect(chroniqueUrl('une chronique')).toBe('/chroniques/une%20chronique');
	});

	it('ignores invalid Builder tag references', () => {
		expect(extractTagsId([{}, null, { tag: { id: 'tag-1' } }])).toEqual(['tag-1']);
	});

	it('builds stable chronique article anchors and deep links', () => {
		expect(chroniqueArticleAnchor('article-é-1')).toBe('article-article-e-1');
		expect(chroniqueArticleUrl('une-chronique', 'article-é-1')).toBe(
			'/chroniques/une-chronique#article-article-e-1'
		);
	});
});
