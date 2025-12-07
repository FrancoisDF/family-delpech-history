# Document Processing Guide for Family History Chatbot

This guide explains how to organize and process your family documents (markdown, PDF, Word) for the local RAG (Retrieval-Augmented Generation) chatbot.

## Overview

The document ingestion pipeline processes your local family documents and creates an optimized indexed database (`static/family-data.json`) that powers the privacy-first family history chatbot. All processing happens locally—no data leaves your device.

## Supported File Formats

### Markdown (.md)
- **Best for:** Text-based documents with rich formatting
- **Supports:** YAML frontmatter metadata, headers, lists, emphasis
- **Example:** `/documents/1850s/Biography.md`

### PDF (.pdf)
- **Best for:** Scanned documents, printed materials, legacy archives
- **Requirement:** Searchable text (not image-only scans)
- **Example:** `/documents/1880s/Family_Records.pdf`

### Word Documents (.docx)
- **Best for:** Modern office documents
- **Supports:** Text extraction; complex formatting may be simplified
- **Example:** `/documents/1900s/Travel_Accounts.docx`

## Document Organization Structure

Organize your documents by **year** and optionally by **category**:

```
documents/
├── 1800s/
│   └── Origins.md
├── 1818/
│   ├── La_Chaumière.md
│   ├── House_Records.pdf
│   └── Construction_Notes.docx
├── 1820s/
│   ├── Family_Events/
│   │   ├── Wedding_1820.md
│   │   └── Birth_Records.pdf
│   └── Agricultural_Notes.md
├── 1850s/
│   ├── Marie_Antoinette/
│   │   ├── biography.md
│   │   ├── letters.pdf
│   │   └── family_tree.md
│   └── Genealogy/
│       ├── Complete_Genealogy.md
│       └── Lineage_Charts.pdf
├── 1870s/
│   ├── Great_Famine.md
│   ├── Survival_Stories.pdf
│   └── Economic_Impact.md
├── 1880s/
│   ├── Occupations/
│   │   ├── trades.md
│   │   └── apprenticeships.pdf
│   └── Business_Records.md
└── 1900s/
    ├── Early_1900s/
    │   ├── Travel_Stories.md
    │   └── Atlantic_Crossing.pdf
    └── Immigration.md
```

### Directory Naming Conventions

- **Year folders:** Use format like `1818`, `1850s`, `1890s`, `Early_1900s`
- **Category folders:** Use descriptive names like `Family_Events`, `Marie_Antoinette`, `Travel_Stories`
- **File names:** Use underscores for spaces, descriptive names: `Birth_Records`, `Biography`

## Adding Metadata with YAML Frontmatter

For markdown files, add optional metadata at the top using YAML frontmatter:

```markdown
---
title: "La Chaumière - Our Ancestral Home"
author: "Family Archives"
year: 1818
category: "Architecture"
tags: ["house", "ancestral", "Provence"]
---

# La Chaumière

This is the document content...
```

### Supported Frontmatter Fields

| Field | Type | Required | Example |
|-------|------|----------|---------|
| `title` | String | No | "La Chaumière - Ancestral Home" |
| `author` | String | No | "Family Archives" |
| `year` | String/Number | No | 1818 or "1850s" |
| `category` | String | No | "Architecture", "Biography" |
| `tags` | Array | No | ["house", "ancestral"] |

**Note:** If frontmatter is not provided, the system will infer metadata from directory structure and filenames.

## Running Document Ingestion

### Basic Ingestion

```bash
# Ingest documents from default location (./documents)
npm run ingest:documents

# Alternative command (same functionality)
npm run prepare:rag
```

### Advanced Options

```bash
# Use custom source directory
node scripts/ingest-local-documents.mjs --source ./my-docs

# Use custom output location
node scripts/ingest-local-documents.mjs --output ./static/my-data.json

# Enable verbose logging
node scripts/ingest-local-documents.mjs --verbose

# Use custom configuration file
node scripts/ingest-local-documents.mjs --config ./my-config.json

# Combine options
node scripts/ingest-local-documents.mjs --source ./docs --verbose
```

### Configuration File

Create a custom configuration file (e.g., `scripts/config.custom.json`):

```json
{
  "sourceDir": "./my-documents",
  "outputPath": "./static/family-data.json",
  "chunkSize": 900,
  "chunkOverlap": 250,
  "minChunkLength": 50,
  "maxFilesPerCategory": 0,
  "verboseLogging": true,
  "fileTypes": [".md", ".pdf", ".docx"],
  "excludeDirs": ["node_modules", ".git"]
}
```

Then use it:
```bash
node scripts/ingest-local-documents.mjs --config scripts/config.custom.json
```

## Configuration Options

### Chunk Size & Overlap

- **`chunkSize`** (default: 900): Characters per chunk. Larger chunks = fewer chunks but less precise retrieval.
- **`chunkOverlap`** (default: 250): Character overlap between chunks. Helps preserve context across chunk boundaries.

**Recommendation:** 
- Small documents (< 100 pages): `chunkSize: 800, overlap: 150`
- Large documents (> 500 pages): `chunkSize: 1200, overlap: 300`
- Default (mixed): `chunkSize: 900, overlap: 250`

### Minimum Chunk Length

- **`minChunkLength`** (default: 50): Skip chunks smaller than this. Prevents empty or near-empty chunks.

**Recommendation:** Keep at 50 characters to avoid trivial fragments.

### File Filtering

- **`maxFilesPerCategory`** (default: 0): Limit files per category (0 = no limit). Useful for testing with large datasets.
- **`excludeDirs`**: Folders to skip during walk (default: `node_modules`, `.git`, `.vscode`).

## The Complete Workflow

### Step 1: Organize Documents

Place your documents in `./documents/` following the recommended structure.

### Step 2: Add Metadata (Optional)

For markdown files, add YAML frontmatter with metadata. For PDF/DOCX, metadata is extracted from directory structure.

### Step 3: Run Ingestion

```bash
npm run ingest:documents
```

The script will:
- ✅ Walk the documents directory
- ✅ Extract text from all supported formats
- ✅ Parse metadata (from structure and frontmatter)
- ✅ Perform semantic chunking
- ✅ Deduplicate chunks
- ✅ Validate output format
- ✅ Write `static/family-data.json`

### Step 4: Precompute Embeddings (Optional)

For better retrieval quality with TF-IDF embeddings:

```bash
npm run prepare:embeddings
```

This creates:
- `static/family-embeddings.json` - Precomputed TF-IDF vectors
- `static/family-vocab.json` - Vocabulary and IDF weights

The chat will automatically use these if available.

### Step 5: Test in Chat Interface

```bash
npm run dev
```

Visit `http://localhost:5173/chat` and ask questions about your family history!

## Troubleshooting

### Q: "No document files found"

**A:** Ensure documents are in `./documents/` with supported extensions (`.md`, `.pdf`, `.docx`). Check spelling of directory and file names.

### Q: PDF extraction returns gibberish

**A:** The PDF may be image-based (scanned without OCR). Only searchable PDFs are supported. Use OCR software to convert image-based PDFs first.

### Q: Chunks are too large or too small

**A:** Adjust `chunkSize` and `chunkOverlap` in config.documents.json:
- Too large (poor retrieval): Decrease `chunkSize` to 600-700
- Too small (too many chunks): Increase `chunkSize` to 1000-1200

### Q: YAML frontmatter not being parsed

**A:** Ensure the frontmatter is at the very beginning of the file:
```markdown
---
title: "My Document"
---

Content starts here...
```

Do not add any blank lines before the first `---`.

### Q: Out of memory during ingestion

**A:** With very large files (> 500MB total):
1. Increase Node.js memory: `node --max-old-space-size=4096 scripts/ingest-local-documents.mjs`
2. Process in batches: Move some documents to a separate folder
3. Reduce `chunkSize` to process faster

### Q: Chat doesn't find relevant documents

**A:** 
1. Check that `static/family-data.json` was created successfully
2. Run embeddings precomputation: `npm run prepare:embeddings`
3. Try enabling the local LLM summarizer in `src/lib/ai/config.ts`
4. Check browser console for errors

### Q: How to re-ingest documents?

**A:** Simply run `npm run ingest:documents` again. It will:
1. Re-process all documents
2. Overwrite the previous `family-data.json`
3. Preserve your original document files

## Performance Tips

### For Large Document Collections (500MB - 2GB)

1. **Batch Ingestion:** Split documents into categories, ingest separately
   ```bash
   mv documents/1900s documents.archive/
   npm run ingest:documents  # Ingest older documents first
   mv documents.archive/1900s documents/
   npm run ingest:documents  # Re-run with complete set
   ```

2. **Optimize Chunk Size:** Use larger chunks for faster processing
   ```json
   {
     "chunkSize": 1200,
     "chunkOverlap": 300
   }
   ```

3. **Monitor Progress:** Run with verbose logging
   ```bash
   npm run ingest:documents -- --verbose
   ```

### For Better Retrieval Quality

1. **Enable Embeddings:** Precompute TF-IDF vectors
   ```bash
   npm run prepare:embeddings
   ```

2. **Enable Summarizer:** Use local LLM to synthesize answers
   - Set `ENABLE_LOCAL_LLM = true` in `src/lib/ai/config.ts`
   - See docs/ON_DEVICE_RAG.md for details

3. **Clean Document Text:** Remove special characters, excessive whitespace
   - Ensures better chunking at paragraph boundaries
   - Improves token matching during search

## Migration from Builder.io

If you were previously using Builder.io:

1. **Export Builder.io content** to Markdown/PDF files
2. **Organize** into `./documents/` directory structure
3. **Run:** `npm run ingest:documents`
4. The new `family-data.json` replaces the old one
5. Chat interface requires NO changes—same API

The `ingest-builder-content.mjs` script is still available as `npm run prepare:rag:builder` if needed.

## Example: Complete Setup from Scratch

```bash
# 1. Create directory structure
mkdir -p documents/{1818,1850s/Marie_Antoinette,1870s,1900s}

# 2. Add markdown documents with frontmatter
cat > documents/1818/La_Chaumière.md << 'EOF'
---
title: "La Chaumière"
year: 1818
category: "Architecture"
---

# The ancestral home...
EOF

# 3. Add PDF documents (place existing PDF files)
cp ~/Downloads/family_records.pdf documents/1850s/

# 4. Run ingestion
npm run ingest:documents

# 5. Precompute embeddings
npm run prepare:embeddings

# 6. Test in dev environment
npm run dev
```

Visit `http://localhost:5173/chat` and start asking questions!

## Advanced: Custom Document Processing

To customize document extraction or chunking:

1. **Edit** `scripts/ingest-local-documents.mjs`
2. **Modify** functions like `chunkText()` or `extractMetadataFromPath()`
3. **Re-run** `npm run ingest:documents`

See inline comments in the script for customization points.

## Files Reference

| File | Purpose |
|------|---------|
| `scripts/ingest-local-documents.mjs` | Main document ingestion pipeline |
| `scripts/config.documents.json` | Configuration file (optional) |
| `documents/` | Your family document source directory |
| `static/family-data.json` | Generated indexed chunks (do not edit) |
| `static/family-embeddings.json` | Generated TF-IDF vectors (optional) |
| `static/family-vocab.json` | Generated vocabulary (optional) |

## See Also

- **docs/ON_DEVICE_RAG.md** - Architecture and RAG system details
- **src/lib/ai/** - Search, embeddings, and generation code
- **src/routes/chat/** - Chat interface implementation
