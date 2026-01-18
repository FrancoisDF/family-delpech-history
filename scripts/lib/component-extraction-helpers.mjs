/**
 * Component Extraction Helper Functions
 *
 * Provides utilities for extracting content from Builder.io blocks based on
 * the component configuration defined in src/lib/config/components-to-extract.ts
 */

/**
 * Component configuration matching src/lib/config/components-to-extract.ts
 * Duplicated here for scripts (which run in Node.js, not TypeScript runtime)
 * Keep in sync with the TypeScript configuration file
 */
export const EXTRACTABLE_COMPONENTS = [
	{
		componentName: 'ArticleHeaderBlock',
		category: 'header',
		extractableFields: [
			{ fieldName: 'title', fieldType: 'text', importance: 'critical' },
			{ fieldName: 'excerpt', fieldType: 'richText', importance: 'critical' },
			{ fieldName: 'author', fieldType: 'string', importance: 'high' },
			{ fieldName: 'date', fieldType: 'string', importance: 'high' },
			{ fieldName: 'readTime', fieldType: 'string', importance: 'medium' },
			{ fieldName: 'category', fieldType: 'string', importance: 'medium' },
			{ fieldName: 'featuredImage', fieldType: 'file', importance: 'medium' },
			{ fieldName: 'pdfFile', fieldType: 'file', importance: 'medium' }
		]
	},
	{
		componentName: 'ArticleContentBlock',
		category: 'content',
		blockLevelExtraction: true,
		extractableFields: [{ fieldName: 'content', fieldType: 'richText', importance: 'critical' }]
	},
	{
		componentName: 'RichTextBlock',
		category: 'content',
		blockLevelExtraction: true,
		extractableFields: [{ fieldName: 'content', fieldType: 'richText', importance: 'critical' }]
	},
	{
		componentName: 'TextSectionBlock',
		category: 'content',
		blockLevelExtraction: true,
		extractableFields: [{ fieldName: 'content', fieldType: 'richText', importance: 'high' }]
	},
	{
		componentName: 'ArticleSectionBlock',
		category: 'content',
		blockLevelExtraction: true,
		extractableFields: [
			{ fieldName: 'title', fieldType: 'text', importance: 'high' },
			{ fieldName: 'content', fieldType: 'richText', importance: 'critical' },
			{ fieldName: 'image', fieldType: 'file', importance: 'medium' },
			{ fieldName: 'imageAlt', fieldType: 'string', importance: 'medium' }
		]
	},
	{
		componentName: 'TwoColumnTextBlock',
		category: 'content',
		blockLevelExtraction: true,
		extractableFields: [
			{ fieldName: 'title', fieldType: 'text', importance: 'high' },
			{ fieldName: 'leftContent', fieldType: 'richText', importance: 'critical' },
			{ fieldName: 'rightContent', fieldType: 'richText', importance: 'critical' }
		]
	},
	{
		componentName: 'QuoteBlock',
		category: 'content',
		blockLevelExtraction: true,
		extractableFields: [
			{ fieldName: 'quote', fieldType: 'richText', importance: 'critical' },
			{ fieldName: 'author', fieldType: 'string', importance: 'high' },
			{ fieldName: 'authorTitle', fieldType: 'string', importance: 'medium' }
		]
	},
	{
		componentName: 'CalloutBlock',
		category: 'content',
		blockLevelExtraction: true,
		extractableFields: [
			{ fieldName: 'title', fieldType: 'text', importance: 'high' },
			{ fieldName: 'content', fieldType: 'richText', importance: 'high' }
		]
	},
	{
		componentName: 'CTABlock',
		category: 'content',
		blockLevelExtraction: true,
		extractableFields: [
			{ fieldName: 'title', fieldType: 'text', importance: 'high' },
			{ fieldName: 'description', fieldType: 'richText', importance: 'high' },
			{ fieldName: 'buttonText', fieldType: 'string', importance: 'medium' },
			{ fieldName: 'buttonLink', fieldType: 'url', importance: 'high' }
		]
	},
	{
		componentName: 'PDFCarouselBlock',
		category: 'document',
		blockLevelExtraction: true,
		extractableFields: [
			{ fieldName: 'title', fieldType: 'text', importance: 'high' },
			{ fieldName: 'description', fieldType: 'richText', importance: 'medium' },
			{
				fieldName: 'pdfs',
				fieldType: 'list',
				importance: 'critical',
				listItemFields: [
					{ fieldName: 'id', fieldType: 'string', importance: 'medium' },
					{ fieldName: 'title', fieldType: 'text', importance: 'critical' },
					{ fieldName: 'description', fieldType: 'richText', importance: 'high' },
					{ fieldName: 'pdfFile', fieldType: 'file', importance: 'critical' }
				]
			}
		]
	},
	{
		componentName: 'AccordionBlock',
		category: 'document',
		blockLevelExtraction: true,
		extractableFields: [
			{ fieldName: 'title', fieldType: 'text', importance: 'high' },
			{
				fieldName: 'sections',
				fieldType: 'list',
				importance: 'high',
				listItemFields: [
					{ fieldName: 'title', fieldType: 'text', importance: 'high' },
					{ fieldName: 'content', fieldType: 'richText', importance: 'high' },
					{
						fieldName: 'documents',
						fieldType: 'list',
						importance: 'critical',
						listItemFields: [
							{ fieldName: 'name', fieldType: 'text', importance: 'high' },
							{ fieldName: 'description', fieldType: 'richText', importance: 'medium' },
							{ fieldName: 'file', fieldType: 'file', importance: 'critical' }
						]
					}
				]
			}
		]
	},
	{
		componentName: 'ImageBlock',
		category: 'media',
		blockLevelExtraction: true,
		extractableFields: [
			{ fieldName: 'imageUrl', fieldType: 'file', importance: 'medium' },
			{ fieldName: 'imageAlt', fieldType: 'string', importance: 'high' },
			{ fieldName: 'caption', fieldType: 'text', importance: 'medium' }
		]
	},
	{
		componentName: 'ImageGalleryBlock',
		category: 'media',
		blockLevelExtraction: true,
		extractableFields: [
			{ fieldName: 'title', fieldType: 'text', importance: 'high' },
			{
				fieldName: 'images',
				fieldType: 'list',
				importance: 'high',
				listItemFields: [
					{ fieldName: 'url', fieldType: 'file', importance: 'medium' },
					{ fieldName: 'alt', fieldType: 'string', importance: 'high' },
					{ fieldName: 'caption', fieldType: 'text', importance: 'medium' },
					{ fieldName: 'description', fieldType: 'richText', importance: 'medium' }
				]
			}
		]
	},
	{
		componentName: 'VideoEmbedBlock',
		category: 'media',
		blockLevelExtraction: true,
		extractableFields: [
			{ fieldName: 'videoUrl', fieldType: 'url', importance: 'high' },
			{ fieldName: 'title', fieldType: 'text', importance: 'high' },
			{ fieldName: 'caption', fieldType: 'text', importance: 'medium' }
		]
	},
	{
		componentName: 'ArticleCarouselBlock',
		category: 'nested',
		extractableFields: [
			{ fieldName: 'title', fieldType: 'text', importance: 'high' },
			{
				fieldName: 'articles',
				fieldType: 'list',
				importance: 'high',
				listItemFields: [
					{ fieldName: 'id', fieldType: 'string', importance: 'high' },
					{ fieldName: 'title', fieldType: 'text', importance: 'high' },
					{ fieldName: 'excerpt', fieldType: 'richText', importance: 'high' },
					{ fieldName: 'date', fieldType: 'string', importance: 'medium' },
					{ fieldName: 'readTime', fieldType: 'string', importance: 'medium' },
					{ fieldName: 'category', fieldType: 'string', importance: 'medium' },
					{ fieldName: 'featuredImage', fieldType: 'file', importance: 'medium' }
				]
			}
		]
	},
	{
		componentName: 'BlogDetailBlock',
		category: 'header',
		extractableFields: [
			{ fieldName: 'title', fieldType: 'text', importance: 'critical' },
			{ fieldName: 'excerpt', fieldType: 'string', importance: 'critical' },
			{ fieldName: 'content', fieldType: 'richText', importance: 'critical' },
			{ fieldName: 'author', fieldType: 'string', importance: 'high' },
			{ fieldName: 'date', fieldType: 'string', importance: 'high' },
			{ fieldName: 'readTime', fieldType: 'string', importance: 'medium' },
			{ fieldName: 'category', fieldType: 'string', importance: 'medium' },
			{ fieldName: 'featuredImage', fieldType: 'file', importance: 'medium' }
		]
	},
	{
		componentName: 'HeroBlock',
		category: 'content',
		blockLevelExtraction: true,
		extractableFields: [
			{ fieldName: 'title', fieldType: 'text', importance: 'high' },
			{ fieldName: 'description', fieldType: 'string', importance: 'high' },
			{ fieldName: 'backgroundImage', fieldType: 'file', importance: 'medium' },
			{ fieldName: 'primaryButtonText', fieldType: 'string', importance: 'medium' },
			{ fieldName: 'primaryButtonLink', fieldType: 'url', importance: 'medium' },
			{ fieldName: 'secondaryButtonText', fieldType: 'string', importance: 'low' },
			{ fieldName: 'secondaryButtonLink', fieldType: 'url', importance: 'low' }
		]
	},
	{
		componentName: 'StorySectionCard',
		category: 'media',
		blockLevelExtraction: true,
		extractableFields: [
			{ fieldName: 'title', fieldType: 'text', importance: 'critical' },
			{ fieldName: 'description', fieldType: 'string', importance: 'critical' },
			{ fieldName: 'year', fieldType: 'number', importance: 'high' },
			{ fieldName: 'audioUrl', fieldType: 'file', importance: 'high' },
			{ fieldName: 'tags', fieldType: 'list', importance: 'medium' }
		]
	},
	{
		componentName: 'GenealogyBlock',
		category: 'content',
		blockLevelExtraction: true,
		extractableFields: [
			{ fieldName: 'title', fieldType: 'text', importance: 'high' },
			{ fieldName: 'description', fieldType: 'richText', importance: 'medium' },
			{ fieldName: 'rootPersonId', fieldType: 'string', importance: 'high' },
			{
				fieldName: 'people',
				fieldType: 'list',
				importance: 'critical',
				listItemFields: [
					{ fieldName: 'id', fieldType: 'string', importance: 'critical' },
					{ fieldName: 'name', fieldType: 'text', importance: 'critical' },
					{ fieldName: 'description', fieldType: 'string', importance: 'high' },
					{ fieldName: 'image', fieldType: 'file', importance: 'medium' },
					{ fieldName: 'birthDate', fieldType: 'string', importance: 'medium' }
				]
			}
		]
	}
];

/**
 * Get component configuration by name
 * @param {string} componentName
 * @returns {Object|undefined}
 */
export function getComponentConfig(componentName) {
	return EXTRACTABLE_COMPONENTS.find((c) => c.componentName === componentName);
}

/**
 * Normalize Builder blocks across different API/SDK shapes.
 * Builder blocks sometimes look like:
 * - { component: 'PDFCarouselBlock', data: { ... } }
 * - { component: { name: 'PDFCarouselBlock', options: { ... } } }
 */
export function getBlockComponentName(block) {
	const c = block?.component;
	if (typeof c === 'string') return c;
	if (c && typeof c === 'object') {
		if (typeof c.name === 'string') return c.name;
		if (typeof c.component === 'string') return c.component;
	}
	if (typeof block?.type === 'string') return block.type;
	return '';
}

export function getBlockData(block) {
	if (block?.data && typeof block.data === 'object') return block.data;
	const c = block?.component;
	if (c && typeof c === 'object') {
		if (c.options && typeof c.options === 'object') return c.options;
		if (c.props && typeof c.props === 'object') return c.props;
	}
	if (block?.options && typeof block.options === 'object') return block.options;
	return null;
}

/**
 * Get all header field names from header category components
 * @returns {string[]}
 */
export function getHeaderFieldNames() {
	return EXTRACTABLE_COMPONENTS.filter((c) => c.category === 'header').flatMap((c) =>
		c.extractableFields.map((f) => f.fieldName)
	);
}

/**
 * Extract critical fields from a field array
 * @param {Object[]} extractableFields
 * @returns {string[]}
 */
function getCriticalFieldsFromArray(extractableFields) {
	return extractableFields
		.filter((f) => f.importance === 'critical')
		.map((f) => f.fieldName);
}

/**
 * Get critical field names for a component
 * @param {string} componentName
 * @returns {string[]}
 */
export function getCriticalFields(componentName) {
	const config = getComponentConfig(componentName);
	return config ? getCriticalFieldsFromArray(config.extractableFields) : [];
}

/**
 * Extract specified fields from a block data object
 * Recursively handles nested structures (lists, objects)
 * @param {Object} blockData - The block.data object
 * @param {Object} config - Component configuration
 * @returns {Object} Extracted fields
 */
export function extractFieldsFromBlock(blockData, config) {
	const result = {};

	if (!config || !blockData) return result;

	for (const field of config.extractableFields) {
		const value = blockData[field.fieldName];

		if (value === null || value === undefined) continue;

		if (field.fieldType === 'list' && Array.isArray(value)) {
			result[field.fieldName] = value.map((item) => extractListItem(item, field));
		} else if (field.fieldType === 'file') {
			result[field.fieldName] = resolveFileUrl(value);
		} else {
			result[field.fieldName] = value;
		}
	}

	return result;
}

/**
 * Extract fields from a list item based on list item field definitions
 * @param {any} item
 * @param {Object} field - Field definition with listItemFields
 * @returns {Object|string|any}
 */
function extractListItem(item, field) {
	if (!field.listItemFields || !item || typeof item !== 'object') {
		return item;
	}

	const result = {};
	for (const itemField of field.listItemFields) {
		const value = item[itemField.fieldName];
		if (value === null || value === undefined) continue;

		if (itemField.fieldType === 'list' && Array.isArray(value)) {
			result[itemField.fieldName] = value.map((subItem) =>
				extractListItem(subItem, itemField)
			);
		} else if (itemField.fieldType === 'file') {
			result[itemField.fieldName] = resolveFileUrl(value);
		} else {
			result[itemField.fieldName] = value;
		}
	}

	return result;
}

/**
 * Extract document/file references from a block based on component configuration
 * @param {Object} block - Builder block object
 * @param {Object} config - Component configuration
 * @returns {Array} Array of {url, label} for documents found
 */
export function extractDocumentRefsFromBlock(block, config) {
	const refs = [];
	const seen = new Set();

	if (!config || !block) return refs;

	const blockData = getBlockData(block);
	if (!blockData) return refs;

	for (const field of config.extractableFields) {
		if (field.fieldType === 'file') {
			const url = resolveFileUrl(blockData[field.fieldName]);
			if (url && !seen.has(url)) {
				refs.push({ url, label: blockData.title || field.fieldName });
				seen.add(url);
			}
		} else if (field.fieldType === 'list' && Array.isArray(blockData[field.fieldName])) {
			for (const item of blockData[field.fieldName]) {
				if (field.listItemFields) {
					for (const itemField of field.listItemFields) {
						if (itemField.fieldType === 'file') {
							const url = resolveFileUrl(item[itemField.fieldName]);
							if (url && !seen.has(url)) {
								refs.push({
									url,
									label: item.title || item.name || itemField.fieldName
								});
								seen.add(url);
							}
						} else if (itemField.fieldType === 'list' && Array.isArray(item[itemField.fieldName])) {
							for (const subItem of item[itemField.fieldName]) {
								if (itemField.listItemFields) {
									for (const subField of itemField.listItemFields) {
										if (subField.fieldType === 'file') {
											const url = resolveFileUrl(subItem[subField.fieldName]);
											if (url && !seen.has(url)) {
												refs.push({
													url,
													label:
														subItem.title ||
														subItem.name ||
														item.title ||
														subField.fieldName
												});
												seen.add(url);
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
	}

	return refs;
}

/**
 * Resolve file URL from various possible formats
 * Handles string URLs, objects with .url, nested {file: {url}}, and .path
 * @param {string|Object} fileField
 * @returns {string} URL or empty string
 */
export function resolveFileUrl(fileField) {
	if (!fileField) return '';

	const normalize = (url) => {
		const s = String(url || '').trim();
		if (!s) return '';
		if (s.startsWith('//')) return `https:${s}`;
		if (s.startsWith('/')) return `https://cdn.builder.io${s}`;
		return s;
	};

	if (typeof fileField === 'string') return normalize(fileField);
	if (typeof fileField === 'object') {
		if (typeof fileField.url === 'string') return normalize(fileField.url);
		if (fileField.file && typeof fileField.file.url === 'string') return normalize(fileField.file.url);
		if (typeof fileField.path === 'string') return normalize(fileField.path);
	}
	return '';
}

/**
 * Get all components that should be extracted at block level
 * @returns {string[]}
 */
export function getBlockLevelExtractionComponents() {
	return EXTRACTABLE_COMPONENTS.filter((c) => c.blockLevelExtraction).map(
		(c) => c.componentName
	);
}

/**
 * Get components by category
 * @param {string} category
 * @returns {Object[]}
 */
export function getComponentsByCategory(category) {
	return EXTRACTABLE_COMPONENTS.filter((c) => c.category === category);
}

/**
 * Flatten extracted component data for RAG/search
 * Converts nested structures into readable text
 * @param {string} componentName
 * @param {Object} blockData
 * @param {Object} config
 * @returns {string} Flattened text content
 */
export function flattenExtractedContent(componentName, blockData, config) {
	const pieces = [];

	if (!config) return '';

	for (const field of config.extractableFields) {
		const value = blockData[field.fieldName];
		if (value === null || value === undefined) continue;

		if (field.fieldType === 'list' && Array.isArray(value)) {
			for (const item of value) {
				if (field.listItemFields) {
					for (const itemField of field.listItemFields) {
						const itemValue = item[itemField.fieldName];
						if (itemValue && typeof itemValue === 'string') {
							pieces.push(itemValue);
						}
					}
				}
			}
		} else if (typeof value === 'string' && (field.fieldType === 'text' || field.fieldType === 'richText')) {
			pieces.push(value);
		}
	}

	return pieces.filter(Boolean).join('\n\n');
}
