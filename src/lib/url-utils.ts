/**
 * Generates a random 6-character ID
 */
export function generateRandomId(): string {
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let id = '';
	for (let i = 0; i < 6; i++) {
		id += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return id;
}

/**
 * Converts a string to kebab-case (lowercase-with-hyphens).
 * Examples:
 *  'Hello World' -> 'hello-world'
 *  'Accented â é' -> 'accented-a-e' (diacritics are removed where possible)
 */
export function toKebabCase(str: string): string {
	if (!str) return '';

	// Normalize to NFKD to split accents then remove non-word chars
	// Keep letters, numbers, spaces and hyphens, then collapse spaces -> hyphens
	return str
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '') // remove diacritics
		.replace(/[^\w\s-]/g, '') // remove other punctuation
		.trim()
		.toLowerCase()
		.replace(/[\s_]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}

export function contentHandle(id: string, title: string, handle?: string, slug?: string): string {
	return handle?.trim() || slug?.trim() || toKebabCase(title) || id;
}

export function articleUrl(id: string, title: string, handle?: string, slug?: string): string {
	return `/histoires/${encodeURIComponent(contentHandle(id, title, handle, slug))}`;
}

export function chroniqueUrl(handle: string): string {
	return `/chroniques/${encodeURIComponent(handle)}`;
}

export function chroniqueArticleAnchor(articleId: string): string {
	return `article-${toAnchorId(articleId)}`;
}

export function chroniqueArticleUrl(handle: string, articleId: string): string {
	return `${chroniqueUrl(handle)}#${chroniqueArticleAnchor(articleId)}`;
}

export function toAnchorId(value: string): string {
	return value
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-zA-Z0-9_-]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.toLowerCase();
}

export function extractTagsId(tags: any[]): string[] {
	return tags.flatMap((item) => (typeof item?.tag?.id === 'string' ? [item.tag.id] : []));
}
