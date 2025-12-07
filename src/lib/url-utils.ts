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

/**
 * Extracts the ID from a blog URL (first 6 characters)
 */
export function extractIdFromUrl(urlParam: string): string {
	return urlParam.split('-')[0];
}

/**
 * Generates a blog URL in the format: {randomID}{camelCaseTitle}
 */
export function generateBlogUrl(id: string, title: string): string {
	const slug = toKebabCase(title || '');
	// Keep the id as the first token (extractIdFromUrl relies on first 6 chars)
	return slug ? `${id}-${slug}` : id;
}
