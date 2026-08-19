import { NextRequest, NextResponse } from 'next/server';
import { generateCompletion } from '@/lib/ollama';
import { supabase, isSupabaseConfigured, memoryStore } from '@/lib/supabase';
import { getLanguageInstruction } from '@/lib/language';

function parseLlmJson(rawOutput: string): any {
  if (!rawOutput || !rawOutput.trim()) return null;

  let clean = rawOutput.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  const match = clean.match(/\{[\s\S]*\}/);
  if (!match) return null;

  let jsonStr = match[0];
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    try {
      jsonStr = jsonStr.replace(/,\s*([\}\]])/g, '$1');
      return JSON.parse(jsonStr);
    } catch (e2) {
      console.error('[Public Explain API]: Failed to parse JSON:', rawOutput.slice(0, 300));
      return null;
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { sessionId, documentId, language } = body;

    if (!sessionId && !documentId) {
      return NextResponse.json(
        { error: 'sessionId or documentId is required' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let chunks: Array<{ content: string; chunk_index: number }> = [];

    if (isSupabaseConfigured && supabase && documentId) {
      const { data } = await supabase
        .from('uploaded_chunks')
        .select('content, chunk_index')
        .eq('document_id', documentId)
        .order('chunk_index', { ascending: true })
        .limit(4);

      if (data && data.length > 0) {
        chunks = data;
      }
    }

    if (chunks.length === 0) {
      const allMemChunks = memoryStore.uploadedChunks
        .filter((c) => (documentId ? c.document_id === documentId : c.session_id === sessionId))
        .sort((a, b) => a.chunk_index - b.chunk_index);

      if (allMemChunks.length > 0) {
        chunks = allMemChunks.slice(0, 4);
      }
    }

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: 'No document text found for this session. Please upload a PDF first.' },
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const docExcerpt = chunks
      .map((c) => `[Chunk ${c.chunk_index}]:\n${c.content}`)
      .join('\n\n---\n\n')
      .slice(0, 4500);

    const langInstruction = getLanguageInstruction(language);
    const unstatedFallback = language === 'hi'
      ? 'दस्तावेज़ में उल्लेख नहीं है'
      : language === 'mr'
      ? 'दस्तऐवजात उल्लेख नाही'
      : language === 'ta'
      ? 'ஆவணத்தில் குறிப்பிடப்படவில்லை'
      : 'Not stated in document.';

    const systemPrompt = `${langInstruction}

You are "NyaySetu Plain-Language Legal Explainer", an AI assistant helping Indian citizens understand legal notices, court orders, and judgments.
Analyze the provided document text and return a SINGLE raw JSON object with 5 keys.

JSON KEYS & VALUE REQUIREMENTS:
1. "document_type": What kind of document is this? Explain in simple everyday terms (e.g., in Hindi: "संपत्ति विवाद से संबंधित कोर्ट नोटिस", "जमानत आदेश").
2. "key_content": Plain-language summary of what happened and what the document actually says. Avoid legal jargon.
3. "meaning": What does this document mean for the person in practical, everyday terms?
4. "next_steps": General procedural steps a citizen can take (e.g. gather records, reply within deadline, consult legal aid). NOT formal legal advice.
5. "deadlines": Any explicit dates, reply windows, or hearing dates mentioned in the text. If none, return "No explicit deadline stated in text."

RULES:
- Base ALL explanations STRICTLY on the provided text ONLY.
- Write ALL 5 JSON string values completely in the requested output language (${language === 'hi' ? 'Hindi / हिंदी' : language === 'mr' ? 'Marathi / मराठी' : language === 'ta' ? 'Tamil / தமிழ்' : 'English'}).
- Keep legal citations, section numbers, act titles, and case names recognizable.
- If information is not in the text, return "${unstatedFallback}" for that field.
- Return ONLY raw JSON. Do not include markdown code fences or conversational filler.${langInstruction}`;

    const userPrompt = `DOCUMENT TEXT EXCERPT:\n${docExcerpt}\n\nReturn JSON:`;

    const llmOutput = await generateCompletion(userPrompt, systemPrompt, 0.1, 300000);

    if (!llmOutput || !llmOutput.trim()) {
      return NextResponse.json(
        { error: 'Document explanation failed — empty response from model.' },
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const parsed = parseLlmJson(llmOutput);

    if (!parsed || typeof parsed !== 'object') {
      return NextResponse.json(
        { error: 'Document explanation failed — invalid response format. Please retry.' },
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return NextResponse.json({
      success: true,
      explanation: {
        document_type: parsed.document_type || 'Legal Document Notice',
        key_content: parsed.key_content || 'Not stated in document',
        meaning: parsed.meaning || 'Not stated in document',
        next_steps: parsed.next_steps || 'Consult a qualified lawyer or Legal Aid helpline 15100.',
        deadlines: parsed.deadlines || 'No explicit deadline stated in text.',
      },
    });
  } catch (error: any) {
    console.error('[Public Explain API Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to explain document in plain language' },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
