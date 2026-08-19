import { NextRequest, NextResponse } from 'next/server';
import { generateCompletion } from '@/lib/ollama';
import { supabase, isSupabaseConfigured, memoryStore } from '@/lib/supabase';

function parseLlmJson(rawOutput: string): any {
  if (!rawOutput || !rawOutput.trim()) return null;

  // 1. Strip markdown code fences
  let clean = rawOutput.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

  // 2. Extract JSON object substring
  const match = clean.match(/\{[\s\S]*\}/);
  if (!match) return null;

  let jsonStr = match[0];

  // 3. Attempt direct parse
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    // Attempt cleanup: remove trailing commas before closing braces/brackets
    try {
      jsonStr = jsonStr.replace(/,\s*([\}\]])/g, '$1');
      return JSON.parse(jsonStr);
    } catch (e2) {
      console.error('[Summarize API]: Failed to parse JSON even after cleanup:', rawOutput.slice(0, 300));
      return null;
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { sessionId, documentId } = body;

    if (!sessionId && !documentId) {
      return NextResponse.json(
        { error: 'sessionId or documentId is required' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let headChunks: Array<{ content: string; chunk_index: number }> = [];
    let tailChunks: Array<{ content: string; chunk_index: number }> = [];

    // Fetch chunks from Supabase or memoryStore
    if (isSupabaseConfigured && supabase && documentId) {
      const { data: headData } = await supabase
        .from('uploaded_chunks')
        .select('content, chunk_index')
        .eq('document_id', documentId)
        .order('chunk_index', { ascending: true })
        .limit(3);

      if (headData && headData.length > 0) {
        headChunks = headData;
      }

      const { data: tailData } = await supabase
        .from('uploaded_chunks')
        .select('content, chunk_index')
        .eq('document_id', documentId)
        .order('chunk_index', { ascending: false })
        .limit(2);

      if (tailData && tailData.length > 0) {
        tailChunks = tailData.reverse();
      }
    }

    if (headChunks.length === 0) {
      const allMemChunks = memoryStore.uploadedChunks
        .filter((c) => (documentId ? c.document_id === documentId : c.session_id === sessionId))
        .sort((a, b) => a.chunk_index - b.chunk_index);

      if (allMemChunks.length > 0) {
        headChunks = allMemChunks.slice(0, 2);
        if (allMemChunks.length > 2) {
          tailChunks = allMemChunks.slice(-2);
        }
      }
    }

    if (headChunks.length === 0) {
      return NextResponse.json(
        { error: 'No chunks found for the specified document.' },
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Retrieve extracted legal metadata from memoryStore or Supabase if available
    let storedStatutes: string[] = [];
    const docRecord = memoryStore.uploadedDocs.find(
      (d) => (documentId ? d.id === documentId : d.session_id === sessionId)
    );
    if (docRecord?.legal_metadata?.statutes_and_sections) {
      storedStatutes = docRecord.legal_metadata.statutes_and_sections;
    }

    // Combine head chunks (1, 2) + non-overlapping tail chunks
    const headIndexes = new Set(headChunks.map((c) => c.chunk_index));
    const combinedChunks = [
      ...headChunks,
      ...tailChunks.filter((c) => !headIndexes.has(c.chunk_index)),
    ].sort((a, b) => a.chunk_index - b.chunk_index);

    const contextText = combinedChunks
      .map((c) => `[Chunk ${c.chunk_index}]:\n${c.content}`)
      .join('\n\n---\n\n');

    const systemPrompt = `You are an expert judicial analyst and legal document parser.
Analyze the provided court judgment text and return a SINGLE raw JSON object with 10 keys.

KEYS TO RETURN IN JSON:
1. "parties": Exact party names from Page-1 header (e.g. "PRIYA VERMA vs VIKRAM VERMA").
2. "core_issue": Summary of the core legal issue.
3. "key_facts": Background facts of the case.
4. "holding": Court final ruling and disposition.
5. "relief_sought": What the appellant/petitioner asks the court to order or grant.
6. "legal_issues": Precise question(s) of law under review (1-3 issues).
7. "statutes_applied": Exact acts or sections cited (e.g. "Section 24 Hindu Marriage Act 1955").
8. "material_facts": Legally material facts (key dates, actions, monetary amounts).
9. "procedural_history": Lower court path and rulings.
10. "holding_ratio": Final holding and binding legal ratio decidendi.

RULES:
- Extract EVERY field strictly from the provided text ONLY.
- If a field cannot be found, return "Not stated in document" for that field. Never invent or pad.
- Return ONLY raw JSON. No markdown backticks, no markdown formatting.`;

    const userPrompt = `JUDGMENT DOCUMENT TEXT (CONTAINS PAGE 1 HEADER & CASE BODY):\n${contextText}\n\nReturn JSON:`;

    const llmOutput = await generateCompletion(userPrompt, systemPrompt, 0.1, 300000);

    if (!llmOutput || !llmOutput.trim()) {
      return NextResponse.json(
        { error: 'Summary generation failed — empty response from local model.' },
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Robust JSON parsing using helper
    const parsed = parseLlmJson(llmOutput);

    if (!parsed || typeof parsed !== 'object') {
      return NextResponse.json(
        { error: 'Summary generation failed — invalid JSON response from model. Click Re-Analyze to retry.' },
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Header Regex Fallback for Parties
    const extractPartiesFromHeader = (chunks: typeof combinedChunks): string | null => {
      const headerText = chunks.slice(0, 2).map((c) => c.content).join('\n');
      
      const vsMatch = headerText.match(/([A-Z][A-Za-z\s\.\,\(\)]+?)\s*(?:\.\.\.|\-|\,|\s)+?\s*(?:APPELLANT|PETITIONER|PLAINTIFF)?\s+(?:VERSUS|VS\.|V\.)\s+([A-Z][A-Za-z\s\.\,\(\)]+?)\s*(?:\.\.\.|\-|\,|\s)+?\s*(?:RESPONDENT|DEFENDANT)/i);
      if (vsMatch && vsMatch[1] && vsMatch[2]) {
        const p1 = vsMatch[1].replace(/IN THE SUPREME COURT.*|CIVIL APPELLATE.*|CRIMINAL.*|NO\.\s*\d+.*/gi, '').trim();
        const p2 = vsMatch[2].trim();
        if (p1.length > 2 && p2.length > 2) {
          return `${p1} vs ${p2}`;
        }
      }

      const simpleMatch = headerText.match(/([A-Z][A-Za-z\s]{2,40})\s+(?:v\.|vs\.|versus)\s+([A-Z][A-Za-z\s]{2,40})/i);
      if (simpleMatch && simpleMatch[1] && simpleMatch[2]) {
        return `${simpleMatch[1].trim()} vs ${simpleMatch[2].trim()}`;
      }

      return null;
    };

    // Helper to get value supporting both snake_case and camelCase
    const getVal = (obj: any, ...keys: string[]): any => {
      for (const k of keys) {
        if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
      }
      return undefined;
    };

    // Helper to sanitize generic placeholder text
    const sanitizeField = (val: any, fallbackStr?: string): string => {
      if (Array.isArray(val)) {
        const cleanArr = val.map((v) => String(v).trim()).filter(Boolean);
        return cleanArr.length > 0 ? cleanArr.join(', ') : (fallbackStr || 'Not stated in document');
      }
      if (!val || typeof val !== 'string') return fallbackStr || 'Not stated in document';
      const clean = val.trim();
      const lower = clean.toLowerCase();
      if (
        lower.includes('appellant/petitioner v. respondent') ||
        lower.includes('central legal question') ||
        lower.includes('essential background facts') ||
        lower.includes('ratio decidendi and court ruling') ||
        (clean.startsWith('<') && clean.endsWith('>'))
      ) {
        return fallbackStr || 'Not stated in document';
      }
      return clean;
    };

    let partiesValue = sanitizeField(getVal(parsed, 'parties', 'Parties'));
    if (partiesValue === 'Not stated in document') {
      const headerExtracted = extractPartiesFromHeader(combinedChunks);
      if (headerExtracted) {
        partiesValue = headerExtracted;
      }
    }

    const coreIssueVal = sanitizeField(getVal(parsed, 'core_issue', 'coreIssue', 'core_legal_issue'));
    const keyFactsVal = sanitizeField(getVal(parsed, 'key_facts', 'keyFacts', 'facts'));
    const holdingVal = sanitizeField(getVal(parsed, 'holding', 'Holding', 'outcome'));

    let statutesAppliedVal = sanitizeField(getVal(parsed, 'statutes_applied', 'statutesApplied', 'statutes'));
    if (statutesAppliedVal === 'Not stated in document' && storedStatutes.length > 0) {
      statutesAppliedVal = storedStatutes.join(', ');
    }

    const summaryObj = {
      parties: partiesValue,
      core_issue: coreIssueVal,
      key_facts: keyFactsVal,
      holding: holdingVal,
    };

    const judicialChecklistObj = {
      relief_sought: sanitizeField(getVal(parsed, 'relief_sought', 'reliefSought', 'prayer')),
      legal_issues: sanitizeField(getVal(parsed, 'legal_issues', 'legalIssues', 'questions_of_law'), coreIssueVal),
      statutes_applied: statutesAppliedVal,
      material_facts: sanitizeField(getVal(parsed, 'material_facts', 'materialFacts'), keyFactsVal),
      procedural_history: sanitizeField(getVal(parsed, 'procedural_history', 'proceduralHistory', 'appeals')),
      holding_ratio: sanitizeField(getVal(parsed, 'holding_ratio', 'holdingRatio'), holdingVal),
    };

    return NextResponse.json(
      {
        success: true,
        summary: summaryObj,
        judicialChecklist: judicialChecklistObj,
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[Summarize API Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate document summary. Click Re-Analyze to retry.' },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
