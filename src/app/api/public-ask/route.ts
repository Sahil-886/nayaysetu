import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding, generateCompletion } from '@/lib/ollama';
import { publicVectorStore } from '@/lib/publicVectorStore';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question } = body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return NextResponse.json(
        { success: false, error: 'Please describe your legal situation.' },
        { status: 400 }
      );
    }

    // 1. Generate query embedding via local Ollama
    let queryEmbedding: number[] = [];
    try {
      queryEmbedding = await generateEmbedding(question.trim());
    } catch (err: any) {
      console.error('[Public Ask Error]: Could not generate embedding:', err);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to generate vector embedding via local Ollama: ${err.message}`,
        },
        { status: 500 }
      );
    }

    // 2. Retrieve top matching public statutory chunks
    const matches = publicVectorStore.matchPublicStatutes(queryEmbedding, 4);

    // Filter out low relevance matches (< 0.15 threshold if embeddings are active)
    const relevantMatches = matches.filter((m) => m.similarity > 0.12);

    if (relevantMatches.length === 0) {
      return NextResponse.json({
        success: true,
        found: false,
        rights: 'Information Not Found in Index',
        law: 'N/A',
        whatYouCanDo: 'The indexed public legal corpus does not contain specific information for this scenario. Please consult a qualified lawyer or your local Legal Services Authority (NALSA Helpline: 15100) for advice.',
        whereToGetHelp: 'NALSA Legal Aid Helpline: 15100 | State Legal Services Authority (SALSA)',
        citations: [],
        rawAnswer: 'The indexed public legal corpus does not contain specific information for this scenario. Please consult a qualified lawyer or your local Legal Services Authority for advice on your specific case.',
      });
    }

    // Prepare context snippet
    const contextText = relevantMatches
      .map(
        (m, idx) =>
          `[Source ${idx + 1} - ${m.title} (${m.statute})]:\n${m.content}`
      )
      .join('\n\n---\n\n');

    // Build prompt for 4-part structured response
    const systemPrompt = `You are "NyaySetu Public Legal Assistant", an AI tool providing general public legal information based strictly on Indian statutes and the Constitution.

CRITICAL INSTRUCTIONS & SAFETY RULES:
1. Base your answer ONLY on the provided STATUTORY CONTEXT below. Do NOT invent legal acts, section numbers, or rights.
2. Structure your response into EXACTLY four sections using these exact headers:
   ### 1. Your Rights
   ### 2. Applicable Law
   ### 3. What You Can Do
   ### 4. Where to Get Help

3. Content rules per section:
   - "Your Rights": Summarize the relevant legal rights guaranteed to the citizen, citing the source document.
   - "Applicable Law": Mention the specific Act(s), Code(s), or Article(s) from the context.
   - "What You Can Do": Outline GENERAL procedural options (e.g., send notice, approach labor commissioner, file consumer complaint). NEVER advise specific litigation tactics or promise guaranteed outcomes.
   - "Where to Get Help": Mention legal aid, helplines (e.g. NALSA 15100, Consumer 1915, Women 181), or relevant government offices.

4. SAFETY RESTRICTIONS:
   - NEVER promise outcomes ("you will win", "the court will rule in your favor").
   - NEVER guarantee results.
   - Frame steps as general options, NOT definitive legal advice.

STATUTORY CONTEXT:
${contextText}`;

    const userPrompt = `Citizen Situation: "${question.trim()}"

Provide the 4-part structured general legal information response based strictly on the statutory context above.`;

    const rawResponse = await generateCompletion(userPrompt, systemPrompt, 0.1);

    // Prepare citations list
    const citations = relevantMatches.map((m, idx) => ({
      id: `cit-${idx + 1}`,
      title: m.title,
      statute: m.statute,
      sections: m.sections,
      sourceFile: m.source_file,
      snippet: m.content.slice(0, 300),
      similarity: m.similarity,
    }));

    return NextResponse.json({
      success: true,
      found: true,
      answer: rawResponse,
      citations,
      disclaimer:
        'This is general legal information, NOT legal advice. Laws vary by situation and change over time. Please consult a qualified lawyer or your nearest Legal Services Authority for advice on your specific case.',
    });
  } catch (err: any) {
    console.error('[Public Ask Route Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
