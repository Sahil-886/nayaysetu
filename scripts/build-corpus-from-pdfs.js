const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function cleanText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, ' ')
    .replace(/ +/g, ' ')
    .trim();
}

function extractRawTextFromBuffer(buffer) {
  const str = buffer.toString('latin1');
  const matches = [];

  const streamRegex = /stream[\r\n]+([\s\S]*?)endstream/g;
  let streamMatch;
  while ((streamMatch = streamRegex.exec(str)) !== null) {
    try {
      const rawStream = Buffer.from(streamMatch[1], 'latin1');
      const decompressed = zlib.inflateSync(rawStream).toString('utf-8');
      const tjRegex = /\(([^()]+)\)\s*T[jJ]/g;
      let match;
      while ((match = tjRegex.exec(decompressed)) !== null) {
        if (match[1] && match[1].trim()) {
          const unescaped = match[1].replace(/\\([()])/g, '$1').trim();
          if (unescaped && !unescaped.startsWith('FEFF') && unescaped.length > 1) {
            matches.push(unescaped);
          }
        }
      }
    } catch (e) {
      // not compressed
    }
  }

  if (matches.length > 0) {
    return cleanText(matches.join('\n'));
  }

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
    return cleanText(matches.join('\n'));
  }

  const cleanStr = str.replace(/%PDF-[\s\S]*?endstream/g, '').replace(/[^\x20-\x7E\n]/g, ' ');
  return cleanText(cleanStr);
}

async function generateEmbedding(text) {
  const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
  try {
    const res = await fetch(`${ollamaUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text', prompt: text }),
    });
    const data = await res.json();
    if (data.embedding && Array.isArray(data.embedding)) {
      return data.embedding;
    }
  } catch (e) {
    console.warn('[Ingest Embedding Warning]:', e.message);
  }
  return new Array(768).fill(0.01);
}

async function main() {
  console.log('----------------------------------------------------');
  console.log('⚖️  NyaySetu: Pure Ingest Corpus from Real PDFs');
  console.log('----------------------------------------------------');

  const judgmentsDir = path.join(process.cwd(), 'data', 'judgments');
  if (!fs.existsSync(judgmentsDir)) {
    console.error('Data directory not found:', judgmentsDir);
    process.exit(1);
  }

  const pdfFiles = fs.readdirSync(judgmentsDir).filter((f) => f.endsWith('.pdf'));
  console.log(`Found ${pdfFiles.length} real PDF files in /data/judgments:`);
  pdfFiles.forEach((f) => console.log(' -', f));

  const judgments = [];
  const corpusChunks = [];

  for (const file of pdfFiles) {
    const filePath = path.join(judgmentsDir, file);
    const buffer = fs.readFileSync(filePath);
    const text = extractRawTextFromBuffer(buffer);

    const baseName = path.basename(file, '.pdf');
    const parts = baseName.split('_');
    const rawYear = parts[parts.length - 1];
    const year = /^\d{4}$/.test(rawYear) ? parseInt(rawYear, 10) : 2020;
    const caseName = baseName.replace(/_\d{4}$/, '').replace(/_/g, ' ');

    console.log(`\n📄 Parsing Real PDF: ${file}`);
    console.log(`   Case Name: ${caseName}`);
    console.log(`   Year: ${year}`);
    console.log(`   Extracted Text Length: ${text.length} chars`);
    console.log(`   Real PDF Excerpt:\n   "${text.slice(0, 180).replace(/\n/g, ' ')}..."`);

    const judgmentId = `corp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    judgments.push({
      id: judgmentId,
      case_name: caseName,
      court: 'Supreme Court of India',
      year,
      source_file: file,
    });

    console.log(`   -> Generating nomic-embed-text vector...`);
    const embedding = await generateEmbedding(text);

    corpusChunks.push({
      id: `chunk-${judgmentId}-1`,
      judgment_id: judgmentId,
      case_name: caseName,
      court: 'Supreme Court of India',
      year,
      source_file: file,
      content: text,
      chunk_index: 1,
      embedding,
      metadata: { case_name: caseName, year, file },
    });
  }

  const indexPath = path.join(process.cwd(), 'data', 'corpus-index.json');
  fs.writeFileSync(
    indexPath,
    JSON.stringify({ judgments, corpusChunks }, null, 2)
  );

  console.log('\n----------------------------------------------------');
  console.log('🎉 Corpus Wiped & Re-ingested ONLY from real PDF files!');
  console.log('📁 Saved index to data/corpus-index.json');
  console.log('----------------------------------------------------');
}

main().catch(console.error);
