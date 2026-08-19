import { NextRequest, NextResponse } from 'next/server';
import { parseAndChunkPDF } from '@/lib/pdf';
import { generateEmbedding, generateCompletion } from '@/lib/ollama';
import { supabase, isSupabaseConfigured, memoryStore, LegalMetadata } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const sessionId = (formData.get('sessionId') as string) || `session-${Date.now()}`;

    if (!file) {
      return NextResponse.json({ error: 'No PDF file uploaded' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Uploaded file must be a PDF' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse & Chunk PDF
    const parsed = await parseAndChunkPDF(buffer);
    if (!parsed.chunks || parsed.chunks.length === 0) {
      return NextResponse.json({ error: 'Extracted PDF text was empty or unreadable.' }, { status: 400 });
    }

    let documentId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // STEP 1 — Extract Legal Metadata (statutes, domain, issues) for uploaded document
    let legalMetadata: LegalMetadata = {
      statutes_and_sections: [],
      legal_domain: 'General Legal',
      key_legal_issues: [],
    };

    try {
      const headerText = parsed.chunks.slice(0, 3).map((c) => c.content).join('\n');
      const metaPrompt = `Analyze the court judgment text below and extract legal metadata in raw JSON:

Rules:
1. "statutes_and_sections": Array of exact statutes, acts, or sections cited in the text (e.g. ["Section 138 Negotiable Instruments Act", "Section 24 Hindu Marriage Act", "Section 498A IPC", "Article 21 Constitution"]).
2. "legal_domain": ONE broad category string from: "Negotiable Instruments/Cheque", "Matrimonial/Maintenance", "Property/Adverse Possession", "Service/Disability Pension", "Criminal", "Constitutional", "Contract/Specific Performance".
3. "key_legal_issues": Array of 2-4 concise legal concept tags.

Return ONLY raw JSON with these 3 keys:
{
  "statutes_and_sections": ["..."],
  "legal_domain": "...",
  "key_legal_issues": ["..."]
}`;

      const metaOutput = await generateCompletion(
        `JUDGMENT TEXT EXCERPT:\n${headerText}`,
        metaPrompt,
        0.1
      );

      if (metaOutput) {
        const match = metaOutput.match(/\{[\s\S]*\}/);
        if (match) {
          const jsonMeta = JSON.parse(match[0]);
          if (Array.isArray(jsonMeta.statutes_and_sections)) {
            legalMetadata.statutes_and_sections = jsonMeta.statutes_and_sections;
          }
          if (typeof jsonMeta.legal_domain === 'string') {
            legalMetadata.legal_domain = jsonMeta.legal_domain;
          }
          if (Array.isArray(jsonMeta.key_legal_issues)) {
            legalMetadata.key_legal_issues = jsonMeta.key_legal_issues;
          }
        }
      }
    } catch (e) {
      console.warn('[Ingest Legal Metadata Extraction Warning]:', e);
    }

    // Store Document record in Supabase if configured
    if (isSupabaseConfigured && supabase) {
      const { data: doc, error: dErr } = await supabase
        .from('uploaded_documents')
        .insert({
          session_id: sessionId,
          file_name: file.name,
          metadata: { legal_metadata: legalMetadata },
        })
        .select('id')
        .single();

      if (!dErr && doc) {
        documentId = doc.id;
      }
    }

    // Always record document in memoryStore as well
    memoryStore.uploadedDocs.push({
      id: documentId,
      session_id: sessionId,
      file_name: file.name,
      summary: null,
      legal_metadata: legalMetadata,
    });

    // Clear previous chunks for this session to ensure scoped fresh Q&A
    memoryStore.uploadedChunks = memoryStore.uploadedChunks.filter((c) => c.session_id !== sessionId);

    const chunkResults = [];

    // Embed each chunk
    for (const chunk of parsed.chunks) {
      const embedding = await generateEmbedding(chunk.content);

      if (isSupabaseConfigured && supabase) {
        await supabase.from('uploaded_chunks').insert({
          document_id: documentId,
          session_id: sessionId,
          content: chunk.content,
          chunk_index: chunk.chunk_index,
          embedding,
          metadata: { file_name: file.name, legal_metadata: legalMetadata },
        });
      }

      const memChunk = {
        id: `uchunk-${documentId}-${chunk.chunk_index}`,
        document_id: documentId,
        session_id: sessionId,
        content: chunk.content,
        chunk_index: chunk.chunk_index,
        embedding,
        metadata: { file_name: file.name, legal_metadata: legalMetadata },
      };

      memoryStore.uploadedChunks.push(memChunk);
      chunkResults.push({
        chunk_index: chunk.chunk_index,
        snippet: chunk.content.slice(0, 150) + '...',
      });
    }

    return NextResponse.json({
      success: true,
      documentId,
      sessionId,
      fileName: file.name,
      numPages: parsed.numPages,
      totalChunks: parsed.chunks.length,
      legalMetadata,
      chunks: chunkResults,
    });
  } catch (error: any) {
    console.error('[Ingest API Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to ingest and parse PDF document' },
      { status: 500 }
    );
  }
}
