/**
 * Server-side utility to extract plain text from uploaded files.
 * Supports .txt, .pdf, and .docx formats.
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const SUPPORTED_TYPES: Record<string, string> = {
	'text/plain': 'txt',
	'application/pdf': 'pdf',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
};

const EXTENSION_MAP: Record<string, string> = {
	'.txt': 'txt',
	'.pdf': 'pdf',
	'.docx': 'docx'
};

export class FileParseError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'FileParseError';
	}
}

/**
 * Detect file type from MIME type or filename extension.
 */
function detectFileType(mimeType: string, fileName?: string): string {
	const fromMime = SUPPORTED_TYPES[mimeType];
	if (fromMime) return fromMime;

	if (fileName) {
		const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
		const fromExt = EXTENSION_MAP[ext];
		if (fromExt) return fromExt;
	}

	throw new FileParseError(
		`Type de fichier non supporte: ${mimeType}. Formats acceptes: .txt, .pdf, .docx`
	);
}

/**
 * Extract plain text from a file buffer based on its type.
 */
export async function parseFile(
	buffer: Buffer | ArrayBuffer,
	mimeType: string,
	fileName?: string
): Promise<string> {
	const buf = buffer instanceof ArrayBuffer ? Buffer.from(buffer) : buffer;

	if (buf.length > MAX_FILE_SIZE) {
		throw new FileParseError(
			`Fichier trop volumineux (${(buf.length / 1024 / 1024).toFixed(1)} Mo). Maximum: 10 Mo.`
		);
	}

	if (buf.length === 0) {
		throw new FileParseError('Le fichier est vide.');
	}

	const fileType = detectFileType(mimeType, fileName);

	switch (fileType) {
		case 'txt':
			return parseTxt(buf);
		case 'pdf':
			return parsePdf(buf);
		case 'docx':
			return parseDocx(buf);
		default:
			throw new FileParseError(`Type non gere: ${fileType}`);
	}
}

function parseTxt(buffer: Buffer): string {
	const text = buffer.toString('utf-8').trim();
	if (!text) {
		throw new FileParseError('Le fichier texte est vide.');
	}
	return text;
}

async function parsePdf(buffer: Buffer): Promise<string> {
	const pdfParse = (await import('pdf-parse')).default;
	const result = await pdfParse(buffer);
	const text = (result.text || '').trim();

	if (!text) {
		throw new FileParseError(
			'Aucun texte extrait du PDF. Il s\'agit peut-etre d\'un PDF image (scanne). ' +
			'Utilisez un outil OCR pour extraire le texte, puis collez-le manuellement.'
		);
	}

	return text;
}

async function parseDocx(buffer: Buffer): Promise<string> {
	const mammoth = await import('mammoth');
	const result = await mammoth.extractRawText({ buffer });
	const text = (result.value || '').trim();

	if (!text) {
		throw new FileParseError('Aucun texte extrait du fichier DOCX.');
	}

	return text;
}

export { MAX_FILE_SIZE, SUPPORTED_TYPES, EXTENSION_MAP };
