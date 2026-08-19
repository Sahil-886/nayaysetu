import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding, generateCompletion } from '@/lib/ollama';
import { supabase, isSupabaseConfigured, memoryStore } from '@/lib/supabase';
import { getLanguageInstruction, getNotFoundMessage } from '@/lib/language';

export async function POST(req: NextRequest) {
  try {
    const { question, sessionId, documentId, language } = await req.json();

    if (!question || typeof question !== 'string' || !question.trim()) {
      return NextResponse.json({ error: 'Question text is required' }, { status: 400 });
    }

    // 1. Embed query vector
    const queryEmbedding = await generateEmbedding(question.trim());

    let matches: Array<{ id: string; content: string; chunk_index: number; similarity: number }> = [];

    // 2. Vector Search in Supabase or memoryStore
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.rpc('match_uploaded_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: 0.15,
        match_count: 3,
        p_session_id: sessionId || '',
      });

      if (!error && data && data.length > 0) {
        matches = data.map((d: any) => ({
          id: d.id,
          content: d.content,
          chunk_index: d.chunk_index,
          similarity: d.similarity,
        }));
      }
    }

    if (matches.length === 0) {
      // Memory Store vector search
      matches = memoryStore.matchUploadedChunks(queryEmbedding, sessionId || '', 3);
    }

    // Filter out low similarity results
    const relevantMatches = matches.filter((m) => m.similarity >= 0.15);

    const notFoundText = getNotFoundMessage(language);

    if (relevantMatches.length === 0) {
      return NextResponse.json({
        answer: notFoundText,
        citations: [],
        found: false,
      });
    }

    // Prepare Context Prompt with explicit Chunk Labels
    const contextPrompt = relevantMatches
      .map((m) => `=== [Chunk ${m.chunk_index}] ===\n${m.content}`)
      .join('\n\n');

    const systemPrompt = `You are NyaySetu, an authoritative AI Legal Research Assistant.
Answer the user's question strictly using ONLY the provided retrieved context chunks.

STYLE (mandatory):
- Lead with the DIRECT answer in 1-2 sentences. No preamble, no "Based on the context…".
- Follow with brief supporting detail only if the question demands it.
- Keep total answer under ~120 words unless the question explicitly asks for a detailed breakdown.
- When listing items (dates, amounts, parties, steps, provisions), use a concise bullet list instead of a dense paragraph.
- Use short paragraphs (2-3 sentences max each).
- Write in clear, professional legal language. No filler phrases.

GROUNDING RULES (strict):
1. If the exact answer is not clearly present or supported by the context, reply EXACTLY: "${notFoundText}"
2. NEVER invent legal citations, precedents, or factual claims not present in the context.
3. Include inline source citations using the format [Chunk X] immediately after any fact or legal reasoning taken from that chunk.${getLanguageInstruction(language)}`;

    const userPrompt = `Retrieved Context Chunks:\n${contextPrompt}\n\nUser Question: ${question}\n\nGive a concise, direct answer with inline [Chunk X] citations:`;

    const llmAnswer = await generateCompletion(userPrompt, systemPrompt, 0.1, 300000);

    // Format citations list for UI drawer
    const citations = relevantMatches.map((m) => ({
      chunk_index: m.chunk_index,
      snippet: m.content.slice(0, 300) + '...',
      similarity: Math.round(m.similarity * 100) / 100,
    }));

    return NextResponse.json({
      answer: llmAnswer || notFoundText,
      citations,
      found: !llmAnswer.includes(notFoundText) && !llmAnswer.includes('Not found in the provided documents'),
    });
  } catch (error: any) {
    console.error('[Ask API Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete Q&A inference' },
      { status: 500 }
    );
  }
}
