import pdfParse from 'pdf-parse';
import zlib from 'zlib';

export interface PDFChunk {
  chunk_index: number;
  content: string;
  wordCount: number;
  metadata?: Record<string, any>;
}

export interface ParsedPDF {
  text: string;
  numPages: number;
  info: any;
  chunks: PDFChunk[];
}

/**
 * Clean text from PDF stream
 */
export function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, ' ')
    .replace(/ +/g, ' ')
    .trim();
}

/**
 * Decode PDF text operators from hex <...> Tj or string (...) Tj
 */
function decodeHexOrString(str: string): string {
  const matches: string[] = [];

  // 1. Hex format: <4841525052454554...> Tj
  const hexRegex = /<([0-9A-Fa-f]+)>\s*T[jJ]/g;
  let hMatch;
  while ((hMatch = hexRegex.exec(str)) !== null) {
    try {
      const hex = hMatch[1];
      const decoded = Buffer.from(hex, 'hex').toString('utf-8').trim();
      if (decoded && !decoded.startsWith('%PDF') && decoded.length > 1) {
        matches.push(decoded);
      }
    } catch (e) {
      // ignore
    }
  }

  if (matches.length > 0) {
    return matches.join('\n');
  }

  // 2. ASCII format: (Text) Tj
  const tjRegex = /\(([^()]+)\)\s*T[jJ]/g;
  let match;
  while ((match = tjRegex.exec(str)) !== null) {
    if (match[1] && match[1].trim()) {
      const unescaped = match[1].replace(/\\([()])/g, '$1').trim();
      if (unescaped && !unescaped.startsWith('FEFF') && unescaped.length > 1) {
        matches.push(unescaped);
      }
    }
  }

  if (matches.length > 0) {
    return matches.join('\n');
  }

  return '';
}

/**
 * Clean stream text extractor if pdf-parse encounters structural errors
 */
function extractRawTextFromBuffer(buffer: Buffer): string {
  const str = buffer.toString('latin1');
  const textParts: string[] = [];

  // Extract from zlib / unzip compressed streams
  const streamRegex = /stream[\r\n]+([\s\S]*?)endstream/g;
  let streamMatch;
  while ((streamMatch = streamRegex.exec(str)) !== null) {
    try {
      const rawStream = Buffer.from(streamMatch[1], 'latin1');
      let decompressed = '';
      try {
        decompressed = zlib.unzipSync(rawStream).toString('utf-8');
      } catch (e) {
        try {
          decompressed = zlib.inflateRawSync(rawStream).toString('utf-8');
        } catch (e2) {
          decompressed = zlib.inflateSync(rawStream).toString('utf-8');
        }
      }

      const decoded = decodeHexOrString(decompressed);
      if (decoded) {
        textParts.push(decoded);
      }
    } catch (e) {
      // not zlib stream
    }
  }

  if (textParts.length > 0) {
    return cleanText(textParts.join('\n'));
  }

  const directDecoded = decodeHexOrString(str);
  if (directDecoded) {
    return cleanText(directDecoded);
  }

  const cleanStr = str.replace(/%PDF-[\s\S]*?endstream/g, '').replace(/[^\x20-\x7E\n]/g, ' ');
  return cleanText(cleanStr);
}

/**
 * Parse PDF Buffer into structured text and chunks
 */
export async function parseAndChunkPDF(
  buffer: Buffer,
  chunkSize = 1500,
  chunkOverlap = 300
): Promise<ParsedPDF> {
  let rawText = '';
  let numPages = 1;
  let info = {};

  try {
    const dataUint8 = new Uint8Array(buffer);
    const parsed = await pdfParse(Buffer.from(dataUint8));
    if (parsed.text && cleanText(parsed.text).length > 20) {
      rawText = cleanText(parsed.text);
      numPages = parsed.numpages || 1;
      info = parsed.info || {};
    }
  } catch (err: any) {
    console.warn('[PDF Parse Warning]: Falling back to stream text extractor:', err.message);
  }

  if (!rawText || rawText.length < 20) {
    rawText = extractRawTextFromBuffer(buffer);
  }

  if (!rawText || rawText.length < 10) {
    throw new Error('Could not extract readable text from PDF file.');
  }

  const chunks = createChunks(rawText, chunkSize, chunkOverlap);

  return {
    text: rawText,
    numPages,
    info,
    chunks,
  };
}

/**
 * Sentence-aware chunker with specified overlap
 */
export function createChunks(
  text: string,
  chunkSize = 1500,
  chunkOverlap = 300
): PDFChunk[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: PDFChunk[] = [];
  let currentChunk = '';
  let chunkIndex = 1;

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    if ((currentChunk + '\n\n' + trimmedPara).length <= chunkSize) {
      currentChunk = currentChunk ? `${currentChunk}\n\n${trimmedPara}` : trimmedPara;
    } else {
      if (currentChunk) {
        chunks.push({
          chunk_index: chunkIndex++,
          content: currentChunk.trim(),
          wordCount: currentChunk.trim().split(/\s+/).length,
        });

        const overlapStart = Math.max(0, currentChunk.length - chunkOverlap);
        const overlapText = currentChunk.slice(overlapStart);
        const sentenceMatch = overlapText.search(/[.!?]\s+/);
        const cleanOverlap = sentenceMatch !== -1 ? overlapText.slice(sentenceMatch + 2) : overlapText;

        currentChunk = `${cleanOverlap.trim()}\n\n${trimmedPara}`;
      } else {
        const sentences = trimmedPara.match(/[^.!?]+[.!?]+(\s+|$)/g) || [trimmedPara];
        for (const sentence of sentences) {
          if ((currentChunk + ' ' + sentence).length <= chunkSize) {
            currentChunk = currentChunk ? `${currentChunk} ${sentence.trim()}` : sentence.trim();
          } else {
            if (currentChunk) {
              chunks.push({
                chunk_index: chunkIndex++,
                content: currentChunk.trim(),
                wordCount: currentChunk.trim().split(/\s+/).length,
              });
              const overlapStart = Math.max(0, currentChunk.length - chunkOverlap);
              currentChunk = `${currentChunk.slice(overlapStart).trim()} ${sentence.trim()}`;
            } else {
              chunks.push({
                chunk_index: chunkIndex++,
                content: sentence.slice(0, chunkSize).trim(),
                wordCount: sentence.slice(0, chunkSize).trim().split(/\s+/).length,
              });
              currentChunk = sentence.slice(chunkSize - chunkOverlap).trim();
            }
          }
        }
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push({
      chunk_index: chunkIndex++,
      content: currentChunk.trim(),
      wordCount: currentChunk.trim().split(/\s+/).length,
    });
  }

  return chunks;
}
