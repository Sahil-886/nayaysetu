import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding, generateCompletion } from '@/lib/ollama';
import { supabase, isSupabaseConfigured, memoryStore, LegalMetadata } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, documentId } = await req.json();

    if (!sessionId && !documentId) {
      return NextResponse.json({ error: 'sessionId or documentId required' }, { status: 400 });
    }

    // Force reload corpus index from disk to be 100% up to date
    memoryStore.loadCorpusFromIndex();

    // Get uploaded document chunks & metadata for query embedding
    let targetChunkText = '';
    let uploadedFileName = '';
    let targetMetadata: LegalMetadata | undefined = undefined;

    // Find uploaded document record from memoryStore
    const docRecord = memoryStore.uploadedDocs.find(
      (d) => (documentId ? d.id === documentId : d.session_id === sessionId)
    );
    if (docRecord) {
      uploadedFileName = docRecord.file_name;
      targetMetadata = docRecord.legal_metadata;
    }

    if (isSupabaseConfigured && supabase && documentId) {
      const { data } = await supabase
        .from('uploaded_chunks')
        .select('content, metadata')
        .eq('document_id', documentId)
        .order('chunk_index', { ascending: true })
        .limit(3);
      if (data && data.length > 0) {
        targetChunkText = data.map((d) => d.content).join(' ');
        if (!uploadedFileName && data[0].metadata?.file_name) {
          uploadedFileName = data[0].metadata.file_name;
        }
        if (!targetMetadata && data[0].metadata?.legal_metadata) {
          targetMetadata = data[0].metadata.legal_metadata;
        }
      }
    }

    if (!targetChunkText) {
      const memChunks = memoryStore.uploadedChunks
        .filter((c) => (documentId ? c.document_id === documentId : c.session_id === sessionId))
        .sort((a, b) => a.chunk_index - b.chunk_index)
        .slice(0, 3);
      targetChunkText = memChunks.map((c) => c.content).join(' ');
      if (!uploadedFileName && memChunks.length > 0) {
        uploadedFileName = memChunks[0].metadata?.file_name || memChunks[0].metadata?.file || '';
      }
      if (!targetMetadata && memChunks.length > 0) {
        targetMetadata = memChunks[0].metadata?.legal_metadata;
      }
    }

    console.log(`[Precedents API Debug]: targetChunkText len=${targetChunkText?.length}`);

    if (!targetChunkText) {
      return NextResponse.json({ error: 'No document text found for precedent search.' }, { status: 404 });
    }

    // Fail-safe: Extract target document legal metadata using llama3.2 if missing
    if (!targetMetadata || !targetMetadata.statutes_and_sections || targetMetadata.statutes_and_sections.length === 0) {
      try {
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
          `JUDGMENT TEXT EXCERPT:\n${targetChunkText.slice(0, 1500)}`,
          metaPrompt,
          0.1
        );

        if (metaOutput) {
          const match = metaOutput.match(/\{[\s\S]*\}/);
          if (match) {
            const jsonMeta = JSON.parse(match[0]);
            targetMetadata = {
              statutes_and_sections: Array.isArray(jsonMeta.statutes_and_sections) ? jsonMeta.statutes_and_sections : [],
              legal_domain: typeof jsonMeta.legal_domain === 'string' ? jsonMeta.legal_domain : 'General Legal',
              key_legal_issues: Array.isArray(jsonMeta.key_legal_issues) ? jsonMeta.key_legal_issues : [],
            };
          }
        }
      } catch (e) {
        console.warn('[Precedents Legal Metadata Fallback Extraction Warning]:', e);
      }
    }

    // Generate query embedding for target document
    let queryEmbedding: number[] = [];
    try {
      queryEmbedding = await generateEmbedding(targetChunkText);
    } catch (e: any) {
      console.warn('[Precedents API Debug]: generateEmbedding warning:', e.message);
      queryEmbedding = new Array(768).fill(0.01);
    }

    console.log(`[Precedents API Debug]: queryEmbedding len=${queryEmbedding?.length}`);

    // Run Hybrid Precedent Matching against memoryStore corpus
    let matches = memoryStore.matchPrecedents(queryEmbedding, targetMetadata, 10);

    console.log(`[Precedents API Debug]: MemoryStore loaded ${memoryStore.judgments.length} judgments, ${memoryStore.corpusChunks.length} chunks.`);
    console.log(`[Precedents API Debug]: Target Metadata:`, JSON.stringify(targetMetadata));
    console.log(`[Precedents API Debug]: Raw Matches count: ${matches.length}`);
    matches.forEach((m) => {
      console.log(` - ${m.case_name} (${m.source_file}): Hybrid Score=${m.similarity}%, Shared Statutes=${JSON.stringify(m.shared_statutes)}, Domain Match=${m.domain_match}`);
    });

    // Exclude uploaded document itself from precedent search results
    matches = matches.filter((m) => {
      if (documentId && m.judgment_id === documentId) {
        return false;
      }
      if (uploadedFileName) {
        const uFile = uploadedFileName.toLowerCase().trim();
        const cFile = m.source_file.toLowerCase().trim();
        if (uFile === cFile) {
          return false;
        }
      }
      return true;
    });

    // STEP 4 — Honest Empty State / Relevance Filter
    // Precedent must share a statute OR share legal domain OR have hybrid score >= 35
    const legallyRelevantMatches = matches.filter(
      (m) => m.shared_statutes.length > 0 || m.domain_match || m.similarity >= 35
    );

    if (legallyRelevantMatches.length === 0) {
      return NextResponse.json({
        success: true,
        precedents: [],
        message: 'No legally relevant precedents in the current corpus (no shared statute or legal domain found).',
        targetMetadata,
      });
    }

    // STEP 3 — Format Precedents with REAL Reasons
    const results = legallyRelevantMatches.slice(0, 5).map((m) => {
      const snippetText = m.sample_content.slice(0, 280) + '...';

      let whySimilar = 'Related by general textual similarity; no shared statute or legal domain found.';

      if (m.shared_statutes.length > 0) {
        const issuesTag = m.legal_metadata?.key_legal_issues?.join(', ') || 'related legal issues';
        whySimilar = `Both cases apply ${m.shared_statutes.join(', ')} and concern ${issuesTag}.`;
      } else if (m.domain_match) {
        const issuesTag = m.legal_metadata?.key_legal_issues?.join(', ') || 'related legal principles';
        whySimilar = `Both cases belong to the ${m.legal_metadata?.legal_domain || 'same legal'} domain and concern ${issuesTag}.`;
      }

      return {
        judgment_id: m.judgment_id,
        case_name: m.case_name,
        court: m.court,
        year: m.year,
        source_file: m.source_file,
        similarity: m.similarity, // Hybrid score 0-100
        snippet: snippetText,
        why_similar: whySimilar,
        legal_domain: m.legal_metadata?.legal_domain || 'General Legal',
        statutes_and_sections: m.legal_metadata?.statutes_and_sections || [],
        shared_statutes: m.shared_statutes,
        domain_match: m.domain_match,
        hybrid_details: m.hybrid_details,
      };
    });

    return NextResponse.json({
      success: true,
      precedents: results,
      targetMetadata,
    });
  } catch (error: any) {
    console.error('[Precedents API Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute precedent search' },
      { status: 500 }
    );
  }
}
