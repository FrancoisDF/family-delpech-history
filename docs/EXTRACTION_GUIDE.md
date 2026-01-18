# Content Extraction Guide

This guide explains how the Builder.io content extraction system works and how to maintain it as your component library grows.

## Overview

The content extraction system is designed to intelligently pull structured data from Builder.io components for ingestion into your RAG (Retrieval-Augmented Generation) system and search indices.

Instead of hardcoding which fields to extract, we maintain a **component configuration file** that serves as the single source of truth for what gets extracted from each Builder component.

**Key Files:**
- `src/lib/config/components-to-extract.ts` — Component configuration and metadata
- `scripts/lib/component-extraction-helpers.mjs` — Extraction utility functions
- `scripts/ingest-builder-content.mjs` — Ingestion script for Builder.io content
- `scripts/ingest-all-content.mjs` — Unified ingestion (local docs + Builder.io)

## How Extraction Works

### 1. Header/Metadata Extraction

When ingesting a Builder.io article, the system first extracts **header-level fields** from the entry's top-level data:

```javascript
// From extractBuilderPostText(entry)
const headerFields = getHeaderFieldNames(); // Dynamically from config
// Returns: ['title', 'excerpt', 'author', 'date', 'readTime', 'category', ...]

for (const field of headerFields) {
  if (entry.data[field] exists) {
    extract and normalize it
  }
}
```

**Example:** An article with `title`, `excerpt`, `author`, and `date` will have all these extracted and combined into the article chunk's text content.

### 2. Block-Level Content Extraction

For each block (component) in the article, the system:

1. **Identifies the component type** from `block.component` or `block.type`
2. **Looks up the component configuration** to find extractable fields
3. **Extracts specified fields** from `block.data` based on the config
4. **Recursively handles nested structures** like lists of objects

**Example:** A `PDFCarouselBlock` contains:
```javascript
{
  component: 'PDFCarouselBlock',
  data: {
    title: 'Documents',
    description: 'Important resources',
    pdfs: [
      { title: 'Report 2024', description: '...', pdfFile: 'https://...' },
      { title: 'Guide', description: '...', pdfFile: 'https://...' }
    ]
  }
}
```

The config specifies that `pdfs[].title`, `pdfs[].description`, and `pdfs[].pdfFile` should all be extracted.

### 3. Document Reference Extraction

As content is extracted, the system identifies downloadable documents (PDFs, Word files, etc.):

```javascript
// From extractDocumentRefsFromBuilderEntry(entry)
const refs = extractDocumentRefsFromBlock(block, config);
// Returns: [{ url: 'https://...pdf', label: 'Document title' }, ...]

// Documents are then:
// 1. Downloaded asynchronously
// 2. Extracted (text from PDF, DOCX, etc.)
// 3. Chunked and ingested as separate chunks
```

This allows full-text search across both article content and attached documents.

### 4. Text Normalization

All extracted text is normalized for consistency:

- **HTML** is stripped of tags while preserving semantic meaning
- **Markdown** formatting is removed while keeping text content
- **Multiple whitespace** is collapsed to single spaces
- **HTML entities** are decoded (e.g., `&nbsp;` → space)

## Component Categories

Components are organized into categories for organizational clarity:

### Header Category
Metadata about the article itself:
- `ArticleHeaderBlock` — Title, excerpt, author, date, etc.

### Content Category
Main body content blocks:
- `ArticleContentBlock` — Rich HTML/markdown paragraph content
- `RichTextBlock` — General rich text
- `TextSectionBlock` — Text with section heading
- `ArticleSectionBlock` — Section with title and optional image
- `TwoColumnTextBlock` — Left and right column content
- `QuoteBlock` — Quote with attribution
- `CalloutBlock` — Highlighted callout content
- `CTABlock` — Call-to-action with description

### Document Category
Files and downloadable documents:
- `PDFCarouselBlock` — Carousel of PDF documents
- `AccordionBlock` — Expandable sections with nested documents

### Media Category
Images and videos:
- `ImageBlock` — Single image with alt text and caption
- `ImageGalleryBlock` — Gallery of multiple images
- `VideoEmbedBlock` — Embedded video

### Nested Category
Components that reference other content:
- `ArticleCarouselBlock` — References to other articles

## Field Importance Levels

Each extractable field has an importance level that helps prioritize what matters most:

| Level | Purpose | Examples |
|-------|---------|----------|
| **critical** | Must be extracted; core content | `content`, `title`, `quote`, `pdfFile` |
| **high** | Important for context and search | `excerpt`, `author`, `description` |
| **medium** | Nice to have for enrichment | `date`, `readTime`, `caption` |
| **low** | Metadata only | IDs, internal references |

Future enhancements could weight critical fields higher in RAG ranking.

## Adding a New Builder Component

When you create a new Builder component, follow this process:

### Step 1: Create the Component

Create the Svelte component and its metadata:

```svelte
<!-- src/lib/components/builders/MyCustomBlock.svelte -->
<script>
  export let title = '';
  export let content = '';
  export let items = [];
</script>

<div>
  <h2>{title}</h2>
  <p>{@html content}</p>
  {#each items as item}
    <div>{item.label}: {item.value}</div>
  {/each}
</div>
```

```typescript
// src/lib/components/builders/MyCustomBlock.info.ts
import type { RegisteredComponent } from '@builder.io/sdk-svelte';
import MyCustomBlock from './MyCustomBlock.svelte';

export const myCustomBlockInfo: RegisteredComponent = {
  component: MyCustomBlock as any,
  name: 'MyCustomBlock',
  tag: 'My Custom Block',
  inputs: [
    { name: 'title', type: 'string', defaultValue: '' },
    { name: 'content', type: 'richText', defaultValue: '' },
    {
      name: 'items',
      type: 'list',
      defaultValue: [],
      subFields: [
        { name: 'label', type: 'string' },
        { name: 'value', type: 'string' }
      ]
    }
  ]
};
```

Register it in `src/lib/components/builders/index.ts`:

```typescript
import { myCustomBlockInfo } from './MyCustomBlock.info';
// ... add to builderComponents array
```

### Step 2: Add to Extraction Config

Update `src/lib/config/components-to-extract.ts`:

```typescript
{
  componentName: 'MyCustomBlock',
  builderTag: 'My Custom Block',
  category: 'content',  // or 'document', 'media', 'nested'
  extractableFields: [
    {
      fieldName: 'title',
      fieldType: 'text',
      importance: 'high',
      description: 'Block heading'
    },
    {
      fieldName: 'content',
      fieldType: 'richText',
      importance: 'critical',
      description: 'Main content'
    },
    {
      fieldName: 'items',
      fieldType: 'list',
      importance: 'high',
      description: 'Custom items',
      listItemFields: [
        { fieldName: 'label', fieldType: 'string', importance: 'high' },
        { fieldName: 'value', fieldType: 'string', importance: 'high' }
      ]
    }
  ],
  blockLevelExtraction: true  // if content is important
}
```

### Step 3: Update Helper Configuration

Update the duplicate config in `scripts/lib/component-extraction-helpers.mjs`:

```javascript
// Keep this in sync with the TypeScript version
{
  componentName: 'MyCustomBlock',
  category: 'content',
  blockLevelExtraction: true,
  extractableFields: [
    { fieldName: 'title', fieldType: 'text', importance: 'high' },
    { fieldName: 'content', fieldType: 'richText', importance: 'critical' },
    {
      fieldName: 'items',
      fieldType: 'list',
      importance: 'high',
      listItemFields: [
        { fieldName: 'label', fieldType: 'string', importance: 'high' },
        { fieldName: 'value', fieldType: 'string', importance: 'high' }
      ]
    }
  ]
}
```

### Step 4: Test Extraction

Run the ingestion script to test:

```bash
npm run ingest
# or
npm run ingest:builder
```

Check that your component content appears in the resulting `static/family-data.json` chunks.

### Step 5: Update Documentation

Add a section to this guide documenting:
- What the component is for
- Which fields are extracted and why
- Any special handling needed

## Troubleshooting Extraction

### Content Not Being Extracted

**Problem:** Your component's content doesn't appear in chunks.

**Solutions:**
1. Check that the component is registered in `src/lib/components/builders/index.ts`
2. Verify the component name matches exactly in the config (case-sensitive)
3. Ensure fields are defined in the config with the correct `fieldName`
4. Check that `blockLevelExtraction: true` is set if you want block-level extraction
5. Run ingestion with verbose logging to see what's happening

### Duplicate Content

**Problem:** Same content appears in multiple chunks.

**Normal behavior:** Content may appear in both the article's general text extraction (via `collectTextDeep`) and as dedicated block extraction. This is expected and the deduplication system (based on first 100 chars) removes exact duplicates.

### Documents Not Downloading

**Problem:** Linked PDFs/documents not being extracted.

**Check:**
1. Are file URLs in the correct format? (must start with `https://` or `http://`)
2. Do they have document extensions (.pdf, .docx, .md, .txt)?
3. Check ingestion logs for 404 errors or timeout messages
4. Verify the file field is marked as `fieldType: 'file'` in config

## Field Types Reference

| Type | Description | Example | Extraction |
|------|-------------|---------|-----------|
| `text` | Plain text string | `"Article Title"` | Extracted as-is |
| `string` | Short text field | `"author name"` | Extracted as-is |
| `richText` | HTML/Markdown content | `"<p>Content</p>"` or `"# Heading"` | Normalized (HTML stripped/Markdown simplified) |
| `file` | File URL or file object | `"https://example.com/doc.pdf"` or `{url: "..."}` | URL extracted for document processing |
| `url` | Web URL | `"https://example.com/video"` | Extracted as-is |
| `list` | Array of objects | `[{title: "...", value: "..."}]` | Each item's extractable fields are processed |
| `number` | Numeric value | `42`, `3.14` | Not extracted (metadata only) |
| `boolean` | True/false flag | `true` | Not extracted (metadata only) |

## Configuration Structure

For reference, here's the TypeScript interface:

```typescript
interface ExtractableField {
  fieldName: string;                    // Name of field in component props
  fieldType: 'text' | 'richText' | ... // Type of content
  importance: 'critical' | 'high' | ... // Priority level
  description?: string;                 // What this field contains
  listItemFields?: ExtractableField[];   // For list types: shape of items
}

interface ExtractableComponentConfig {
  componentName: string;                // Exact component class name
  builderTag: string;                   // Display tag from .info.ts
  category: 'header' | 'content' | ...; // Category for organization
  extractableFields: ExtractableField[]; // Fields to extract
  blockLevelExtraction?: boolean;        // Extract as dedicated block?
}
```

## Performance Considerations

- **Chunking:** Content is chunked at ~900 characters with 250 character overlap for RAG
- **Concurrency:** Document downloads happen with concurrency limit of 4 to avoid overwhelming servers
- **Caching:** In `ingest-all-content.mjs`, downloads are cached to avoid re-fetching
- **Deduplication:** Exact duplicate chunks (by first 100 chars) are removed

## Debugging

Enable verbose logging by checking the ingestion script output:

```bash
# Full ingestion with logging
PUBLIC_BUILDER_API_KEY=your_key npm run ingest

# Watch for:
# - "Fetched X items for model 'blog-articles'"
# - "Wrote X chunks to static/family-data.json"
# - Any "Failed to download" warnings
```

## Related Files

- **Ingestion Scripts:** `scripts/ingest-builder-content.mjs`, `scripts/ingest-all-content.mjs`
- **Configuration:** `src/lib/config/components-to-extract.ts`
- **Helpers:** `scripts/lib/component-extraction-helpers.mjs`
- **Server Utilities:** `src/lib/server/builder.ts` (runtime Builder.io integration)
- **Output:** `static/family-data.json` (extracted chunks)
- **Embeddings:** `static/family-embeddings.json`, `static/family-vocab.json` (for RAG)

## FAQ

**Q: Why duplicate the config in both TypeScript and JavaScript?**
A: The ingestion scripts run in Node.js and can't directly import TypeScript files. The duplicate serves as the source of truth for Node scripts while the TypeScript version is available to the frontend.

**Q: Can I import the config from `src/lib/` in my Node script?**
A: Not directly without compilation. The `.mjs` scripts are run directly by Node. For now, keeping both in sync is necessary. Future refactoring could generate the `.mjs` version from the TypeScript source.

**Q: What happens if I remove a component from the config?**
A: Its content will still be extracted by the fallback `collectTextDeep` function, but with less structure. Recommended: keep deprecated components in config but mark as `blockLevelExtraction: false`.

**Q: How do I weight critical fields higher in search?**
A: Currently not implemented, but the importance levels are captured in the configuration and could be used in future enhancements to weight RAG results.
