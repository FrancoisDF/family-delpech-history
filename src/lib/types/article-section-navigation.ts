export interface ArticleSectionNavigationItem {
	id: string;
	title: string;
	description?: string;
}

export interface ArticleSectionNavigationConfig {
	enabled: boolean;
	title?: string;
	description?: string;
	sections: ArticleSectionNavigationItem[];
}

function asTrimmedString(value: unknown): string | undefined {
	return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function normalizeArticleSectionNavigation(
	value: unknown
): ArticleSectionNavigationConfig | null {
	if (!value || typeof value !== 'object') return null;

	const raw = value as Record<string, unknown>;
	const rawSections = Array.isArray(raw.sections) ? raw.sections : [];
	const seenIds = new Set<string>();
	const sections = rawSections.flatMap((section) => {
		if (!section || typeof section !== 'object') return [];

		const rawSection = section as Record<string, unknown>;
		const id = asTrimmedString(rawSection.id);
		const title = asTrimmedString(rawSection.title);
		if (!id || !title || seenIds.has(id)) return [];

		seenIds.add(id);
		return [
			{
				id,
				title,
				description: asTrimmedString(rawSection.description)
			}
		];
	});

	if (raw.enabled !== true || sections.length === 0) return null;

	return {
		enabled: true,
		title: asTrimmedString(raw.title),
		description: asTrimmedString(raw.description),
		sections
	};
}
