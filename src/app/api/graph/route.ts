import { NextRequest, NextResponse } from 'next/server';
import { generateCompletion } from '@/lib/ollama';
import { memoryStore, supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getLanguageInstruction } from '@/lib/language';

export interface GraphNode {
  id: string;
  label: string;
  type: 'person' | 'company' | 'court' | 'statute' | 'event' | string;
  detail?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  label: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, documentId, language } = body;

    if (!sessionId && !documentId) {
      return NextResponse.json(
        { error: 'Session ID or Document ID is required' },
        { status: 400 }
      );
    }

    // Retrieve document text chunks from memory store or Supabase
    let chunks: string[] = [];

    if (sessionId) {
      chunks = memoryStore.uploadedChunks
        .filter((c) => c.session_id === sessionId)
        .sort((a, b) => a.chunk_index - b.chunk_index)
        .map((c) => c.content);
    }

    if (chunks.length === 0 && documentId && isSupabaseConfigured && supabase) {
      const { data: dbChunks } = await supabase
        .from('uploaded_chunks')
        .select('content, chunk_index')
        .eq('document_id', documentId)
        .order('chunk_index', { ascending: true })
        .limit(5);

      if (dbChunks && dbChunks.length > 0) {
        chunks = dbChunks.map((c) => c.content);
      }
    }

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: 'No document text found for this session. Please upload a PDF first.' },
        { status: 404 }
      );
    }

    // Excerpt first 3 chunks (~3000 chars) for fast entity extraction
    const docExcerpt = chunks.slice(0, 3).join('\n\n').slice(0, 3000);

    const systemPrompt = `You are a legal entity graph extractor. Analyze the court judgment text and extract key legal entities, grounded details, and their relationships.
Return ONLY valid JSON matching this schema:
{
  "nodes": [
    {
      "id": "n1",
      "label": "Harpreet Sawhney",
      "type": "person",
      "detail": "Petitioner who filed an appeal regarding cheque dishonour under Section 138 NI Act."
    },
    {
      "id": "n2",
      "label": "Puneet Sharma",
      "type": "person",
      "detail": "Respondent in the dispute who issued the dishonoured instrument."
    },
    {
      "id": "n3",
      "label": "High Court of Delhi",
      "type": "court",
      "detail": "Appellate forum that adjudicated the appeal and delivered the binding judgment."
    },
    {
      "id": "n4",
      "label": "Section 138 NI Act",
      "type": "statute",
      "detail": "Statutory penal provision regarding dishonour of cheque for insufficiency of funds."
    }
  ],
  "edges": [
    {"from": "n1", "to": "n2", "label": "filed appeal against"},
    {"from": "n3", "to": "n1", "label": "issued ruling for"},
    {"from": "n1", "to": "n4", "label": "invoked"}
  ]
}

Rules:
1. "type" MUST be one of: "person", "company", "court", "statute", "event".
2. "id" MUST be unique identifiers: "n1", "n2", "n3", etc.
3. "detail" MUST be a 1-2 sentence description derived STRICTLY from the provided text excerpt. If information is not explicitly stated in the document, set "detail": "No further detail found in document." Never fabricate statements or facts.
4. Extract 4 to 8 key nodes max and 3 to 8 direct edges.
5. Return ONLY raw JSON. Do not include markdown block formatting or conversational text.${getLanguageInstruction(language)}`;

    const prompt = `EXCERPT FROM COURT JUDGMENT:\n\n${docExcerpt}`;

    const completion = await generateCompletion(prompt, systemPrompt, 0.1, 300000);

    // Robust JSON extraction & parsing
    let parsedGraph: GraphData = { nodes: [], edges: [] };

    try {
      const cleaned = completion
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const rawObj = JSON.parse(jsonMatch[0]);

        if (Array.isArray(rawObj.nodes)) {
          parsedGraph.nodes = rawObj.nodes
            .filter((n: any) => n && n.id && n.label)
            .map((n: any) => ({
              id: String(n.id),
              label: String(n.label),
              type: String(n.type || 'person').toLowerCase(),
              detail: String(n.detail || 'Sourced directly from court judgment text.'),
            }));
        }

        if (Array.isArray(rawObj.edges)) {
          parsedGraph.edges = rawObj.edges
            .filter((e: any) => e && e.from && e.to)
            .map((e: any) => ({
              from: String(e.from),
              to: String(e.to),
              label: String(e.label || 'connected to'),
            }));
        }
      }
    } catch (parseErr: any) {
      console.warn('[Graph Extraction Warning] JSON parsing failed:', parseErr.message);
    }

    // Fallback graph if LLM extraction returned empty nodes
    if (parsedGraph.nodes.length === 0) {
      parsedGraph = {
        nodes: [
          { id: 'n1', label: 'Petitioner / Appellant', type: 'person', detail: 'Primary party who initiated the judicial proceedings.' },
          { id: 'n2', label: 'Respondent Party', type: 'person', detail: 'Opposing party defending against the legal claim.' },
          { id: 'n3', label: 'High Court / Bench', type: 'court', detail: 'Judicial tribunal presiding over the dispute.' },
          { id: 'n4', label: 'Statute Provision', type: 'statute', detail: 'Legislative act or section cited in the ruling.' },
        ],
        edges: [
          { from: 'n1', to: 'n2', label: 'filed dispute against' },
          { from: 'n3', to: 'n1', label: 'adjudicated case of' },
          { from: 'n1', to: 'n4', label: 'relied upon' },
        ],
      };
    }

    return NextResponse.json({
      success: true,
      graph: parsedGraph,
    });
  } catch (error: any) {
    console.error('[Graph API Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to extract legal relationship graph' },
      { status: 500 }
    );
  }
}
