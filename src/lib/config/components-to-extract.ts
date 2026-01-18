/**
 * Component Extraction Configuration
 *
 * This file defines which Builder.io components should be extracted for content ingestion
 * and which fields from each component are extractable. It serves as the single source of truth
 * for content extraction across all ingestion scripts.
 *
 * When adding new Builder components:
 * 1. Create the component in src/lib/components/builders/MyBlock.svelte with MyBlock.info.ts
 * 2. Add an entry to EXTRACTABLE_COMPONENTS array below
 * 3. Define extractable fields based on the component's inputs
 * 4. Set appropriate importance levels (critical > high > medium > low)
 * 5. Update docs/EXTRACTION_GUIDE.md with any special handling needed
 * 6. Run npm run ingest to test extraction
 */

export interface ExtractableField {
	/** Field name as it appears in the component props */
	fieldName: string;
	/** Type of content in this field */
	fieldType: 'text' | 'richText' | 'file' | 'url' | 'list' | 'number' | 'string' | 'boolean';
	/** Importance for ranking/weighting in RAG */
	importance: 'critical' | 'high' | 'medium' | 'low';
	/** Human-readable description of what this field contains */
	description?: string;
	/** For list-type fields, defines the shape of items in the list */
	listItemFields?: ExtractableField[];
}

export interface ExtractableComponentConfig {
	/** Component class name (e.g., 'ArticleHeaderBlock') */
	componentName: string;
	/** Display tag from .info.ts (for reference) */
	builderTag: string;
	/** Category for organization: header metadata, content body, documents, media, or nested refs */
	category: 'header' | 'content' | 'document' | 'media' | 'nested';
	/** Fields extractable from this component */
	extractableFields: ExtractableField[];
	/** If true, this component should be extracted at the block level in addition to being crawled by collectTextDeep */
	blockLevelExtraction?: boolean;
}

/**
 * Complete list of extractable Builder components.
 * Organized by category for maintainability.
 */
export const EXTRACTABLE_COMPONENTS: ExtractableComponentConfig[] = [
	// ============================================================
	// HEADER / METADATA COMPONENTS
	// Article metadata that appears at the top of content
	// ============================================================

	{
		componentName: 'BlogDetailBlock',
		builderTag: 'Article Pages',
		category: 'header',
		extractableFields: [
			{
				fieldName: 'title',
				fieldType: 'text',
				importance: 'critical',
				description: 'Article title'
			},
			{
				fieldName: 'excerpt',
				fieldType: 'string',
				importance: 'critical',
				description: 'Article excerpt'
			},
			{
				fieldName: 'content',
				fieldType: 'richText',
				importance: 'critical',
				description: 'Main article body content'
			},
			{
				fieldName: 'author',
				fieldType: 'string',
				importance: 'high',
				description: 'Article author'
			},
			{
				fieldName: 'date',
				fieldType: 'string',
				importance: 'high',
				description: 'Publication date'
			},
			{
				fieldName: 'readTime',
				fieldType: 'string',
				importance: 'medium',
				description: 'Estimated reading time'
			},
			{
				fieldName: 'category',
				fieldType: 'string',
				importance: 'medium',
				description: 'Article category'
			},
			{
				fieldName: 'featuredImage',
				fieldType: 'file',
				importance: 'medium',
				description: 'Article featured image'
			}
		]
	},

	{
		componentName: 'ArticleHeaderBlock',
		builderTag: 'Article Header',
		category: 'header',
		extractableFields: [
			{
				fieldName: 'title',
				fieldType: 'text',
				importance: 'critical',
				description: 'Main article title'
			},
			{
				fieldName: 'excerpt',
				fieldType: 'richText',
				importance: 'critical',
				description: 'Article excerpt/summary shown below title'
			},
			{
				fieldName: 'author',
				fieldType: 'string',
				importance: 'high',
				description: 'Article author name'
			},
			{
				fieldName: 'date',
				fieldType: 'string',
				importance: 'high',
				description: 'Publication date'
			},
			{
				fieldName: 'readTime',
				fieldType: 'string',
				importance: 'medium',
				description: 'Estimated reading time'
			},
			{
				fieldName: 'category',
				fieldType: 'string',
				importance: 'medium',
				description: 'Article category/topic classification'
			},
			{
				fieldName: 'featuredImage',
				fieldType: 'file',
				importance: 'medium',
				description: 'Main article image URL'
			},
			{
				fieldName: 'pdfFile',
				fieldType: 'file',
				importance: 'medium',
				description: 'Downloadable PDF at article level (alternative to PDFCarouselBlock)'
			}
		]
	},

	// ============================================================
	// CONTENT COMPONENTS
	// Main body content blocks with text
	// ============================================================

	{
		componentName: 'ArticleContentBlock',
		builderTag: 'Text & Paragraphs',
		category: 'content',
		extractableFields: [
			{
				fieldName: 'content',
				fieldType: 'richText',
				importance: 'critical',
				description: 'Main article body content in rich HTML/markdown format'
			}
		],
		blockLevelExtraction: true
	},

	{
		componentName: 'RichTextBlock',
		builderTag: 'Rich Text',
		category: 'content',
		extractableFields: [
			{
				fieldName: 'content',
				fieldType: 'richText',
				importance: 'critical',
				description: 'Richly formatted text content'
			}
		],
		blockLevelExtraction: true
	},

	{
		componentName: 'TextSectionBlock',
		builderTag: 'Text Section',
		category: 'content',
		extractableFields: [
			{
				fieldName: 'content',
				fieldType: 'richText',
				importance: 'high',
				description: 'Section content in rich format'
			}
		],
		blockLevelExtraction: true
	},

	{
		componentName: 'ArticleSectionBlock',
		builderTag: 'Content Sections',
		category: 'content',
		extractableFields: [
			{
				fieldName: 'title',
				fieldType: 'text',
				importance: 'high',
				description: 'Section heading'
			},
			{
				fieldName: 'content',
				fieldType: 'richText',
				importance: 'critical',
				description: 'Section body content'
			},
			{
				fieldName: 'image',
				fieldType: 'file',
				importance: 'medium',
				description: 'Section image file URL'
			},
			{
				fieldName: 'imageAlt',
				fieldType: 'string',
				importance: 'medium',
				description: 'Alt text for optional section image (accessibility)'
			}
		],
		blockLevelExtraction: true
	},

	{
		componentName: 'TwoColumnTextBlock',
		builderTag: 'Two Column Text',
		category: 'content',
		extractableFields: [
			{
				fieldName: 'title',
				fieldType: 'text',
				importance: 'high',
				description: 'Block heading'
			},
			{
				fieldName: 'leftContent',
				fieldType: 'richText',
				importance: 'critical',
				description: 'Content in left column'
			},
			{
				fieldName: 'rightContent',
				fieldType: 'richText',
				importance: 'critical',
				description: 'Content in right column'
			}
		],
		blockLevelExtraction: true
	},

	{
		componentName: 'QuoteBlock',
		builderTag: 'Quote',
		category: 'content',
		extractableFields: [
			{
				fieldName: 'quote',
				fieldType: 'richText',
				importance: 'critical',
				description: 'The quote text itself'
			},
			{
				fieldName: 'author',
				fieldType: 'string',
				importance: 'high',
				description: 'Name of person being quoted'
			},
			{
				fieldName: 'authorTitle',
				fieldType: 'string',
				importance: 'medium',
				description: 'Author title, position, or affiliation'
			}
		],
		blockLevelExtraction: true
	},

	{
		componentName: 'CalloutBlock',
		builderTag: 'Callout',
		category: 'content',
		extractableFields: [
			{
				fieldName: 'title',
				fieldType: 'text',
				importance: 'high',
				description: 'Callout heading'
			},
			{
				fieldName: 'content',
				fieldType: 'richText',
				importance: 'high',
				description: 'Important highlighted content'
			}
		],
		blockLevelExtraction: true
	},

	{
		componentName: 'CTABlock',
		builderTag: 'Call To Action',
		category: 'content',
		extractableFields: [
			{
				fieldName: 'title',
				fieldType: 'text',
				importance: 'high',
				description: 'CTA heading'
			},
			{
				fieldName: 'description',
				fieldType: 'richText',
				importance: 'high',
				description: 'CTA description text'
			},
			{
				fieldName: 'buttonText',
				fieldType: 'string',
				importance: 'medium',
				description: 'Text displayed on CTA button'
			},
			{
				fieldName: 'buttonLink',
				fieldType: 'url',
				importance: 'high',
				description: 'URL that CTA button links to'
			}
		],
		blockLevelExtraction: true
	},

	// ============================================================
	// DOCUMENT COMPONENTS
	// PDFs and downloadable documents
	// ============================================================

	{
		componentName: 'PDFCarouselBlock',
		builderTag: 'PDF Carousel',
		category: 'document',
		extractableFields: [
			{
				fieldName: 'title',
				fieldType: 'text',
				importance: 'high',
				description: 'Carousel section title (e.g., "Documents")'
			},
			{
				fieldName: 'description',
				fieldType: 'richText',
				importance: 'medium',
				description: 'Carousel description/intro text'
			},
			{
				fieldName: 'pdfs',
				fieldType: 'list',
				importance: 'critical',
				description: 'List of PDF documents',
				listItemFields: [
					{
						fieldName: 'id',
						fieldType: 'string',
						importance: 'medium',
						description: 'Unique ID for this PDF'
					},
					{
						fieldName: 'title',
						fieldType: 'text',
						importance: 'critical',
						description: 'PDF document title'
					},
					{
						fieldName: 'description',
						fieldType: 'richText',
						importance: 'high',
						description: 'What this PDF contains'
					},
					{
						fieldName: 'pdfFile',
						fieldType: 'file',
						importance: 'critical',
						description: 'PDF file URL for download/extraction'
					}
				]
			}
		],
		blockLevelExtraction: true
	},

	{
		componentName: 'AccordionBlock',
		builderTag: 'Accordion',
		category: 'document',
		extractableFields: [
			{
				fieldName: 'title',
				fieldType: 'text',
				importance: 'high',
				description: 'Accordion section title'
			},
			{
				fieldName: 'sections',
				fieldType: 'list',
				importance: 'high',
				description: 'List of accordion sections with expandable content',
				listItemFields: [
					{
						fieldName: 'title',
						fieldType: 'text',
						importance: 'high',
						description: 'Section heading in accordion'
					},
					{
						fieldName: 'content',
						fieldType: 'richText',
						importance: 'high',
						description: 'Section body content when expanded'
					},
					{
						fieldName: 'documents',
						fieldType: 'list',
						importance: 'critical',
						description: 'Documents listed within this section',
						listItemFields: [
							{
								fieldName: 'name',
								fieldType: 'text',
								importance: 'high',
								description: 'Document name'
							},
							{
								fieldName: 'description',
								fieldType: 'richText',
								importance: 'medium',
								description: 'What the document contains'
							},
							{
								fieldName: 'file',
								fieldType: 'file',
								importance: 'critical',
								description: 'Document file URL (PDF, DOCX, etc.)'
							}
						]
					}
				]
			}
		],
		blockLevelExtraction: true
	},

	{
		componentName: 'HeroBlock',
		builderTag: 'Hero & Headers',
		category: 'content',
		extractableFields: [
			{
				fieldName: 'title',
				fieldType: 'text',
				importance: 'high',
				description: 'Hero section title'
			},
			{
				fieldName: 'description',
				fieldType: 'string',
				importance: 'high',
				description: 'Hero section description'
			},
			{
				fieldName: 'backgroundImage',
				fieldType: 'file',
				importance: 'medium',
				description: 'Hero background image URL'
			},
			{
				fieldName: 'primaryButtonText',
				fieldType: 'string',
				importance: 'medium',
				description: 'Text on primary button'
			},
			{
				fieldName: 'primaryButtonLink',
				fieldType: 'url',
				importance: 'medium',
				description: 'URL for primary button'
			},
			{
				fieldName: 'secondaryButtonText',
				fieldType: 'string',
				importance: 'low',
				description: 'Text on secondary button'
			},
			{
				fieldName: 'secondaryButtonLink',
				fieldType: 'url',
				importance: 'low',
				description: 'URL for secondary button'
			}
		],
		blockLevelExtraction: true
	},

	// ============================================================
	// MEDIA COMPONENTS
	// Images, galleries, videos
	// ============================================================

	{
		componentName: 'ImageBlock',
		builderTag: 'Image',
		category: 'media',
		extractableFields: [
			{
				fieldName: 'imageUrl',
				fieldType: 'file',
				importance: 'medium',
				description: 'Image file URL'
			},
			{
				fieldName: 'imageAlt',
				fieldType: 'string',
				importance: 'high',
				description: 'Image alt text (important for accessibility and context)'
			},
			{
				fieldName: 'caption',
				fieldType: 'text',
				importance: 'medium',
				description: 'Image caption text'
			}
		],
		blockLevelExtraction: true
	},

	{
		componentName: 'ImageGalleryBlock',
		builderTag: 'Image Gallery',
		category: 'media',
		extractableFields: [
			{
				fieldName: 'title',
				fieldType: 'text',
				importance: 'high',
				description: 'Gallery title'
			},
			{
				fieldName: 'images',
				fieldType: 'list',
				importance: 'high',
				description: 'List of gallery images',
				listItemFields: [
					{
						fieldName: 'url',
						fieldType: 'file',
						importance: 'medium',
						description: 'Image file URL'
					},
					{
						fieldName: 'alt',
						fieldType: 'string',
						importance: 'high',
						description: 'Image alt text'
					},
					{
						fieldName: 'caption',
						fieldType: 'text',
						importance: 'medium',
						description: 'Image caption'
					},
					{
						fieldName: 'description',
						fieldType: 'richText',
						importance: 'medium',
						description: 'Detailed image description'
					}
				]
			}
		],
		blockLevelExtraction: true
	},

	{
		componentName: 'VideoEmbedBlock',
		builderTag: 'Video Embed',
		category: 'media',
		extractableFields: [
			{
				fieldName: 'videoUrl',
				fieldType: 'url',
				importance: 'high',
				description: 'Embedded video URL'
			},
			{
				fieldName: 'title',
				fieldType: 'text',
				importance: 'high',
				description: 'Video title'
			},
			{
				fieldName: 'caption',
				fieldType: 'text',
				importance: 'medium',
				description: 'Video caption/description'
			}
		],
		blockLevelExtraction: true
	},

	// ============================================================
	// NESTED / REFERENCE COMPONENTS
	// Components that reference other content
	// ============================================================

	{
		componentName: 'ArticleCarouselBlock',
		builderTag: 'Article Carousel',
		category: 'nested',
		extractableFields: [
			{
				fieldName: 'title',
				fieldType: 'text',
				importance: 'high',
				description: 'Carousel section title'
			},
			{
				fieldName: 'articles',
				fieldType: 'list',
				importance: 'high',
				description: 'Referenced article metadata in carousel',
				listItemFields: [
					{
						fieldName: 'id',
						fieldType: 'string',
						importance: 'high',
						description: 'Referenced article ID'
					},
					{
						fieldName: 'title',
						fieldType: 'text',
						importance: 'high',
						description: 'Referenced article title'
					},
					{
						fieldName: 'excerpt',
						fieldType: 'richText',
						importance: 'high',
						description: 'Referenced article excerpt'
					},
					{
						fieldName: 'date',
						fieldType: 'string',
						importance: 'medium',
						description: 'Referenced article date'
					},
					{
						fieldName: 'readTime',
						fieldType: 'string',
						importance: 'medium',
						description: 'Referenced article reading time'
					},
					{
						fieldName: 'category',
						fieldType: 'string',
						importance: 'medium',
						description: 'Referenced article category'
					},
					{
						fieldName: 'featuredImage',
						fieldType: 'file',
						importance: 'medium',
						description: 'Referenced article featured image'
					}
				]
			}
		]
	},

	{
		componentName: 'StorySectionCard',
		builderTag: 'Story Section Card',
		category: 'media',
		extractableFields: [
			{
				fieldName: 'title',
				fieldType: 'text',
				importance: 'critical',
				description: 'Story card title'
			},
			{
				fieldName: 'description',
				fieldType: 'string',
				importance: 'critical',
				description: 'Story card description'
			},
			{
				fieldName: 'year',
				fieldType: 'number',
				importance: 'high',
				description: 'Year associated with the story'
			},
			{
				fieldName: 'audioUrl',
				fieldType: 'file',
				importance: 'high',
				description: 'Audio file URL for story narration'
			},
			{
				fieldName: 'tags',
				fieldType: 'list',
				importance: 'medium',
				description: 'Tags for categorizing stories'
			}
		],
		blockLevelExtraction: true
	},

	{
		componentName: 'GenealogyBlock',
		builderTag: 'Genealogy Tree',
		category: 'content',
		extractableFields: [
			{
				fieldName: 'title',
				fieldType: 'text',
				importance: 'high',
				description: 'Genealogy tree title'
			},
			{
				fieldName: 'description',
				fieldType: 'richText',
				importance: 'medium',
				description: 'Genealogy tree description'
			},
			{
				fieldName: 'rootPersonId',
				fieldType: 'string',
				importance: 'high',
				description: 'ID of root person in family tree'
			},
			{
				fieldName: 'people',
				fieldType: 'list',
				importance: 'critical',
				description: 'List of people in the genealogy tree',
				listItemFields: [
					{
						fieldName: 'id',
						fieldType: 'string',
						importance: 'critical',
						description: 'Person ID'
					},
					{
						fieldName: 'name',
						fieldType: 'text',
						importance: 'critical',
						description: 'Person name'
					},
					{
						fieldName: 'description',
						fieldType: 'string',
						importance: 'high',
						description: 'Person biography or description'
					},
					{
						fieldName: 'image',
						fieldType: 'file',
						importance: 'medium',
						description: 'Person portrait image URL'
					},
					{
						fieldName: 'birthDate',
						fieldType: 'string',
						importance: 'medium',
						description: 'Person birth date'
					}
				]
			}
		],
		blockLevelExtraction: true
	}
];

// ============================================================
// HELPER FUNCTIONS FOR ACCESSING CONFIGURATION
// ============================================================

/**
 * Get the configuration for a specific component by name
 * @param componentName Component class name (e.g., 'ArticleHeaderBlock')
 * @returns Component configuration or undefined if not found
 */
export function getComponentConfig(
	componentName: string
): ExtractableComponentConfig | undefined {
	return EXTRACTABLE_COMPONENTS.find((c) => c.componentName === componentName);
}

/**
 * Get all field names that are marked as header metadata
 * Used to determine which fields to extract from entry.data at the article level
 * @returns Array of header field names
 */
export function getHeaderFieldNames(): string[] {
	return EXTRACTABLE_COMPONENTS.filter((c) => c.category === 'header').flatMap((c) =>
		c.extractableFields.map((f) => f.fieldName)
	);
}

/**
 * Get critical fields for a specific component
 * Critical fields should not be skipped during extraction
 * @param componentName Component name
 * @returns Array of critical field names
 */
export function getCriticalFields(componentName: string): string[] {
	const config = getComponentConfig(componentName);
	return (
		config?.extractableFields
			.filter((f) => f.importance === 'critical')
			.map((f) => f.fieldName) ?? []
	);
}

/**
 * Get all components in a specific category
 * Useful for filtering extraction by content type
 * @param category Component category
 * @returns Array of component configurations
 */
export function getComponentsByCategory(
	category: ExtractableComponentConfig['category']
): ExtractableComponentConfig[] {
	return EXTRACTABLE_COMPONENTS.filter((c) => c.category === category);
}

/**
 * Get all component names that should be extracted at the block level
 * These components have important structured content that benefits from dedicated extraction
 * @returns Array of component names
 */
export function getBlockLevelExtractionComponents(): string[] {
	return EXTRACTABLE_COMPONENTS.filter((c) => c.blockLevelExtraction).map((c) =>
		c.componentName
	);
}

/**
 * Get all extractable file fields (images, PDFs, videos)
 * Useful for document reference extraction
 * @returns Array of {componentName, fieldName, fieldType}
 */
export function getFileFields(): Array<{
	componentName: string;
	fieldName: string;
	fieldType: ExtractableField['fieldType'];
}> {
	const fileFields: Array<{
		componentName: string;
		fieldName: string;
		fieldType: ExtractableField['fieldType'];
	}> = [];

	for (const component of EXTRACTABLE_COMPONENTS) {
		function collectFileFields(
			fields: ExtractableField[],
			componentName: string,
			prefix = ''
		) {
			for (const field of fields) {
				if (field.fieldType === 'file' || field.fieldType === 'url') {
					fileFields.push({
						componentName,
						fieldName: prefix ? `${prefix}.${field.fieldName}` : field.fieldName,
						fieldType: field.fieldType
					});
				}
				if (field.fieldType === 'list' && field.listItemFields) {
					collectFileFields(
						field.listItemFields,
						componentName,
						prefix ? `${prefix}.${field.fieldName}` : field.fieldName
					);
				}
			}
		}

		collectFileFields(component.extractableFields, component.componentName);
	}

	return fileFields;
}
