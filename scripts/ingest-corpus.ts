import fs from 'fs';
import path from 'path';
import { parseAndChunkPDF } from '../src/lib/pdf';
import { generateEmbedding, checkOllamaHealth } from '../src/lib/ollama';
import { supabase, isSupabaseConfigured, memoryStore } from '../src/lib/supabase';

async function main() {
  console.log('----------------------------------------------------');
  console.log('⚖️  NyaySetu: Pre-indexed Corpus Ingestion Script');
  console.log('----------------------------------------------------');

  // 1. Verify Ollama Health
  const health = await checkOllamaHealth();
  if (!health.online) {
    console.error('❌ Error: Local Ollama service is not reachable on http://127.0.0.1:11434.');
    console.error(`Details: ${health.error}`);
    process.exit(1);
  }
  if (!health.hasEmbedModel) {
    console.warn(`⚠️ Warning: Embeddings model 'nomic-embed-text' was not detected in Ollama tags.`);
  }

  console.log(`✅ Local Ollama is online with models: ${health.models.join(', ')}`);
  console.log(`ℹ️ Supabase status: ${isSupabaseConfigured ? 'Connected to live Supabase DB' : 'Using Local In-Memory Fallback'}`);

  const judgmentsDir = path.join(process.cwd(), 'data', 'judgments');
  if (!fs.existsSync(judgmentsDir)) {
    console.error(`❌ Data directory not found: ${judgmentsDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(judgmentsDir).filter((f) => f.endsWith('.pdf'));
  if (files.length === 0) {
    console.warn('⚠️ No PDF files found in data/judgments directory.');
    process.exit(0);
  }

  console.log(`\n📚 Found ${files.length} judgment PDFs to process...`);

  let totalChunksIngested = 0;

  for (const file of files) {
    const filePath = path.join(judgmentsDir, file);
    console.log(`\n📄 Processing: ${file}`);

    const fileBuffer = fs.readFileSync(filePath);
    const parsed = await parseAndChunkPDF(fileBuffer);

    // Extract metadata from file name (e.g. Kesavananda_Bharati_v_State_of_Kerala_1973.pdf)
    const baseName = path.basename(file, '.pdf');
    const parts = baseName.split('_');
    const rawYear = parts[parts.length - 1];
    const year = /^\d{4}$/.test(rawYear) ? parseInt(rawYear, 10) : 2020;
    const caseName = baseName.replace(/_\d{4}$/, '').replace(/_/g, ' ');

    console.log(`   Case Name: ${caseName}`);
    console.log(`   Year: ${year}`);
    console.log(`   Extracted Text Chunks: ${parsed.chunks.length}`);

    let judgmentId = `corp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Store in Supabase if configured
    if (isSupabaseConfigured && supabase) {
      const { data: judgment, error: jErr } = await supabase
        .from('judgments')
        .insert({
          case_name: caseName,
          court: 'Supreme Court of India',
          year,
          source_file: file,
        })
        .select('id')
        .single();

      if (jErr) {
        console.error(`   ❌ Failed to insert judgment record into Supabase:`, jErr.message);
      } else if (judgment) {
        judgmentId = judgment.id;
      }
    }

    // Always seed Memory Store as well
    memoryStore.judgments.push({
      id: judgmentId,
      case_name: caseName,
      court: 'Supreme Court of India',
      year,
      source_file: file,
    });

    for (const chunk of parsed.chunks) {
      console.log(`   -> Embedding chunk #${chunk.chunk_index} (${chunk.content.length} chars)...`);
      const embedding = await generateEmbedding(chunk.content);

      if (isSupabaseConfigured && supabase) {
        const { error: cErr } = await supabase.from('judgment_chunks').insert({
          judgment_id: judgmentId,
          content: chunk.content,
          chunk_index: chunk.chunk_index,
          embedding,
          metadata: { case_name: caseName, year, file },
        });
        if (cErr) {
          console.error(`      ❌ Supabase chunk insert error:`, cErr.message);
        }
      }

      memoryStore.corpusChunks.push({
        id: `chunk-${judgmentId}-${chunk.chunk_index}`,
        judgment_id: judgmentId,
        case_name: caseName,
        court: 'Supreme Court of India',
        year,
        source_file: file,
        content: chunk.content,
        chunk_index: chunk.chunk_index,
        embedding,
        metadata: { case_name: caseName, year, file },
      });

      totalChunksIngested++;
    }

    console.log(`   ✅ Finished: ${file}`);
  }

  // Save corpus index JSON file for local dev server auto-loading
  const indexPath = path.join(process.cwd(), 'data', 'corpus-index.json');
  fs.writeFileSync(
    indexPath,
    JSON.stringify(
      {
        judgments: memoryStore.judgments,
        corpusChunks: memoryStore.corpusChunks,
      },
      null,
      2
    )
  );
  console.log(`📁 Saved pre-indexed vector corpus to ${indexPath}`);

  console.log('\n----------------------------------------------------');
  console.log(`🎉 Ingestion Complete!`);
  console.log(`📊 Ingested ${files.length} judgments & ${totalChunksIngested} vector chunks into pgvector store.`);
  console.log('----------------------------------------------------');
}

main().catch(console.error);
