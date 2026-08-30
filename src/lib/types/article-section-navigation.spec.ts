import { describe, expect, it } from 'vitest';
import { normalizeArticleSectionNavigation } from './article-section-navigation';

describe('normalizeArticleSectionNavigation', () => {
	it('normalizes valid configuration and preserves section order', () => {
		expect(
			normalizeArticleSectionNavigation({
				enabled: true,
				title: 'Sommaire',
				description: 'Les grandes étapes',
				sections: [
					{ id: 'premiere-etape', title: 'Première étape', description: 'Début' },
					{ id: 'seconde-etape', title: 'Seconde étape' }
				]
			})
		).toEqual({
			enabled: true,
			title: 'Sommaire',
			description: 'Les grandes étapes',
			sections: [
				{ id: 'premiere-etape', title: 'Première étape', description: 'Début' },
				{ id: 'seconde-etape', title: 'Seconde étape', description: undefined }
			]
		});
	});

	it('ignores duplicate or incomplete sections and disables empty navigation', () => {
		expect(
			normalizeArticleSectionNavigation({
				enabled: true,
				sections: [
					{ id: 'intro', title: 'Introduction' },
					{ id: 'intro', title: 'Duplicate' },
					{ id: 'missing-title' },
					{ title: 'Missing ID' }
				]
			})
		).toEqual({
			enabled: true,
			title: undefined,
			description: undefined,
			sections: [{ id: 'intro', title: 'Introduction', description: undefined }]
		});

		expect(
			normalizeArticleSectionNavigation({ enabled: false, sections: [{ id: 'intro', title: 'Introduction' }] })
		).toBeNull();
		expect(normalizeArticleSectionNavigation({ enabled: true, sections: [] })).toBeNull();
	});
});
