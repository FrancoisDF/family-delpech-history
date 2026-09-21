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
		.replace(/\s+/g, '-') // spaces -> hyphens
		.replace(/-+/g, '-'); // collapse multiple hyphens
}

export function extractIdFromUrl(urlParam: string): string {
	return urlParam.split('-')[0];
}

export function articleUrl(id: string, title: string): string {
	return `/histoires/${generateBlogUrl(id, title)}`;
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

export function generateBlogUrl(id: string, title: string): string {
	const slug = toKebabCase(title || '');
	return slug ? `${id}-${slug}` : id;
}

export function extractTagsId(tags: any[]) {
	return tags.map((item) => {
		return item.tag.id;
	});
}
