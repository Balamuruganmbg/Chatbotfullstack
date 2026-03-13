import fs from 'fs';
import path from 'path';
import { logger } from './logger';

// ─── Type declarations for modules that may lack full TS types ─────────────────

// pdf-parse default export
type PdfParse = (buffer: Buffer) => Promise<{ text: string; numpages: number }>;
// mammoth extractRawText
type Mammoth = { extractRawText: (opts: { path: string }) => Promise<{ value: string }> };

// ─── Lazy loaders (avoids top-level import failures if optional deps absent) ──

let _pdfParse: PdfParse | null = null;
let _mammoth: Mammoth | null = null;

const loadPdfParse = async (): Promise<PdfParse> => {
  if (!_pdfParse) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _pdfParse = require('pdf-parse') as PdfParse;
  }
  return _pdfParse;
};

const loadMammoth = async (): Promise<Mammoth> => {
  if (!_mammoth) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _mammoth = require('mammoth') as Mammoth;
  }
  return _mammoth;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normaliseText = (raw: string): string =>
  raw
    .replace(/\r\n/g, '\n')           // Windows line endings
    .replace(/\r/g, '\n')             // Old Mac line endings
    .replace(/\n{3,}/g, '\n\n')       // Collapse runs of blank lines
    .replace(/[ \t]{2,}/g, ' ')       // Collapse horizontal whitespace
    .trim();

// ─── Extraction functions per mime-type ───────────────────────────────────────

const extractPdf = async (filePath: string): Promise<string> => {
  const pdfParse = await loadPdfParse();
  const buffer = fs.readFileSync(filePath);
  const result = await pdfParse(buffer);
  return normaliseText(result.text);
};

const extractDocx = async (filePath: string): Promise<string> => {
  const mammoth = await loadMammoth();
  const result = await mammoth.extractRawText({ path: filePath });
  return normaliseText(result.value);
};

const extractTxt = (filePath: string): string => {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return normaliseText(raw);
};

// ─── Public API ───────────────────────────────────────────────────────────────

export interface ExtractionResult {
  content: string;
  charCount: number;
  pageCount?: number;
}

/**
 * Extract plain text from a PDF, DOCX, or TXT file.
 *
 * @param filePath  Absolute or relative path to the uploaded file
 * @param mimeType  MIME type string from Multer (e.g. 'application/pdf')
 */
export const extractText = async (
  filePath: string,
  mimeType: string
): Promise<ExtractionResult> => {
  const resolved = path.resolve(filePath);

  if (!fs.existsSync(resolved)) {
    throw new Error(`File not found at path: ${resolved}`);
  }

  let content = '';

  try {
    if (mimeType === 'application/pdf') {
      content = await extractPdf(resolved);
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    ) {
      content = await extractDocx(resolved);
    } else if (mimeType === 'text/plain') {
      content = extractTxt(resolved);
    } else {
      throw new Error(`Unsupported MIME type for text extraction: ${mimeType}`);
    }

    if (!content || content.length < 10) {
      logger.warn(`Extracted very short content (${content.length} chars) from ${filePath}`);
    }

    logger.info(`Extracted ${content.length} chars from ${path.basename(filePath)} [${mimeType}]`);

    return {
      content,
      charCount: content.length,
    };
  } catch (error) {
    logger.error(`Text extraction failed for ${filePath}: ${error}`);
    throw error;
  }
};

// ─── Context builder ──────────────────────────────────────────────────────────

const MAX_CONTEXT_CHARS = 12_000; // ~3k tokens — safe for most LLMs

/**
 * Merge multiple document contents into a single context string.
 * Truncates gracefully if the combined content exceeds the token budget.
 *
 * @param docs  Array of { originalName, content } objects
 */
export const buildDocumentContext = (
  docs: Array<{ originalName: string; content: string }>
): string => {
  if (docs.length === 0) return '';

  const sections: string[] = [];
  let totalChars = 0;

  for (const doc of docs) {
    if (!doc.content) continue;

    const header = `\n--- Document: "${doc.originalName}" ---\n`;
    const remaining = MAX_CONTEXT_CHARS - totalChars - header.length;

    if (remaining <= 0) break;

    const body =
      doc.content.length > remaining
        ? doc.content.slice(0, remaining) + '\n[...content truncated...]'
        : doc.content;

    sections.push(header + body);
    totalChars += header.length + body.length;
  }

  return sections.join('\n');
};

// ─── Response generator (Mode 1 — keyword search, no external AI) ─────────────

/**
 * Generate a document-aware answer without an external LLM.
 * Searches for relevant sentences in the document context.
 */
export const generateDocumentAnswer = (
  question: string,
  documentContext: string,
  docNames: string[]
): string => {
  const keywords = question
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));

  const sentences = documentContext
    .split(/[.!?\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  // Score each sentence by keyword matches
  const scored = sentences.map((sentence) => {
    const lower = sentence.toLowerCase();
    const score = keywords.reduce((acc, kw) => acc + (lower.includes(kw) ? 1 : 0), 0);
    return { sentence, score };
  });

  const relevant = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((s) => s.sentence);

  const docList = docNames.map((n) => `"${n}"`).join(', ');

  if (relevant.length === 0) {
    return (
      `I searched through your uploaded document${docNames.length > 1 ? 's' : ''} ` +
      `(${docList}) but couldn't find specific information about "${question}". ` +
      `The document${docNames.length > 1 ? 's do' : ' does'} not appear to contain content ` +
      `directly relevant to your query. Try rephrasing your question or upload a more relevant document.`
    );
  }

  const excerpts = relevant.map((s) => `• ${s}`).join('\n');

  return (
    `Based on your uploaded document${docNames.length > 1 ? 's' : ''} (${docList}), ` +
    `here is what I found relevant to your question:\n\n` +
    `${excerpts}\n\n` +
    `---\n*This answer was generated from your document content. ` +
    `For more precise analysis, consider integrating an AI provider (OpenAI / Anthropic) via the \`OPENAI_API_KEY\` environment variable.*`
  );
};

// Common English stop words to skip during keyword matching
const STOP_WORDS = new Set([
  'what', 'does', 'that', 'this', 'with', 'have', 'from', 'they',
  'will', 'been', 'were', 'said', 'each', 'which', 'their', 'there',
  'about', 'would', 'these', 'other', 'into', 'more', 'also', 'than',
  'then', 'some', 'could', 'when', 'your', 'like', 'just', 'know',
  'time', 'very', 'much', 'most', 'only', 'over', 'such', 'even',
]);
