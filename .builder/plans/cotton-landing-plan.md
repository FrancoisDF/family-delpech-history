# File Upload Support for Document Admin Console

## Goal

Replace the current "paste text" approach with a proper file upload that accepts `.txt`, `.pdf`, and `.docx` files. The server extracts text automatically before chunking and embedding.

## Libraries

- **PDF**: `pdf-parse` — pure JS/TS, works on Node.js, extracts text from a buffer with `new PDFParse({ data: buffer })` then `.getText()`
- **DOCX**: `mammoth` — mature, well-maintained, designed for Google Docs / Word `.docx` export. Has `extractRawText({ buffer })` which returns paragraphs separated by double newlines — exactly matching the existing chunker's paragraph split logic

## Changes

### 1. Install dependencies

```
npm install pdf-parse mammoth
```

### 2. Create `src/lib/server/file-parser.ts`

A server-side utility that takes a file buffer + mime type and returns extracted plain text:

- `.txt` / `text/plain` → decode buffer as UTF-8 string
- `.pdf` / `application/pdf` → use `pdf-parse` to extract text
- `.docx` / `application/vnd.openxmlformats-officedocument.wordprocessingml.document` → use `mammoth.extractRawText({ buffer })` to get plain text (paragraphs already separated by `\n\n`)
- Reject other file types with a clear error message

### 3. Update `POST /api/admin/documents` (`src/routes/api/admin/documents/+server.ts`)

Currently expects JSON with a `content` field. Add a second code path for `multipart/form-data`:

- Check `Content-Type` header:
  - If `application/json` → existing behaviour (paste flow still works)
  - If `multipart/form-data` → parse the uploaded file using SvelteKit's built-in `request.formData()`
- Extract the file from the form data, get its buffer and mime type
- Call `parseFile(buffer, mimeType)` from the new utility
- The rest of the pipeline (insert source_documents, chunk, embed) stays identical
- Store the original filename in the `source_documents` metadata for reference
- File size limit: 10 MB (reject larger files early with a clear error)

### 4. Update the admin UI (`src/routes/admin/+page.svelte`)

Replace the textarea-based form in the Documents tab collapsible section:

- Add a file input (`<input type="file" accept=".txt,.pdf,.docx">`) with drag-and-drop support
- Keep the existing metadata fields (title, author, year, category, tags)
- Auto-fill the title from the filename (without extension) if the title field is empty
- Show a preview of the file name, size, and detected type after selection
- On submit, send as `FormData` (multipart) instead of JSON
- Keep a "paste text" fallback toggle — a simple toggle/tab ("Upload file" | "Paste text") so the paste workflow still works for quick edits
- Show a progress indicator during upload+processing since embedding can take time

### 5. Validation and error handling

- Max file size: 10 MB (check client-side before upload, and server-side)
- Supported types only: `.txt`, `.pdf`, `.docx` — reject others with a user-friendly message
- If text extraction yields empty content, return an error
- If the file is a scanned PDF (image-only, no text layer), `pdf-parse` will return empty text — show a message suggesting to use OCR first or paste the OCR text manually

## Files to create/modify

| File | Action |
|------|--------|
| `package.json` | Add `pdf-parse` and `mammoth` dependencies |
| `src/lib/server/file-parser.ts` | **Create** — text extraction utility |
| `src/routes/api/admin/documents/+server.ts` | Modify POST to handle multipart/form-data |
| `src/routes/admin/+page.svelte` | Modify document form: add file upload + drag-drop UI |

## Notes

- The existing paste-text flow is preserved as a fallback — no breaking changes
- mammoth's `extractRawText` outputs paragraphs separated by `\n\n`, which directly matches the existing `chunkText()` paragraph-splitting logic, so no chunker changes needed
- Google Docs "Download as .docx" produces clean `.docx` files that mammoth handles well
