import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseUrl !== 'https://your-supabase-url.supabase.co' &&
  supabaseAnonKey &&
  supabaseAnonKey !== 'your-supabase-anon-key'
);

export let supabase: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    console.warn('[Supabase Setup Warning]: Could not create Supabase client:', e);
    supabase = null;
  }
}

export interface LegalMetadata {
  statutes_and_sections?: string[];
  legal_domain?: string;
  key_legal_issues?: string[];
}

export interface JudgmentRecord {
  id: string;
  case_name: string;
  court: string;
  year: number;
  source_file: string;
  legal_metadata?: LegalMetadata;
}

export interface MemoryChunk {
  id: string;
  judgment_id?: string;
  document_id?: string;
  session_id?: string;
  case_name?: string;
  court?: string;
  year?: number;
  source_file?: string;
  content: string;
  chunk_index: number;
  embedding: number[];
  metadata?: Record<string, any>;
}

class InMemoryVectorStore {
  public judgments: JudgmentRecord[] = [];
  public corpusChunks: MemoryChunk[] = [];
  public uploadedDocs: Array<{ id: string; session_id: string; file_name: string; summary: any; legal_metadata?: LegalMetadata }> = [];
  public uploadedChunks: MemoryChunk[] = [];

  constructor() {
    this.loadCorpusFromIndex();
  }

  public loadCorpusFromIndex() {
    try {
      const indexPath = path.join(process.cwd(), 'data', 'corpus-index.json');
      if (fs.existsSync(indexPath)) {
        const raw = fs.readFileSync(indexPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.judgments && parsed.corpusChunks) {
          this.judgments = parsed.judgments;
          this.corpusChunks = parsed.corpusChunks;
          return;
        }
      }
    } catch (e) {
      console.warn('[InMemoryVectorStore]: Could not load corpus index JSON:', e);
    }

    this.judgments = [];
    this.corpusChunks = [];
  }

  public cosineSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length === 0 || b.length === 0) return 0;
    const len = Math.min(a.length, b.length);
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < len; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  public computeHybridMatchScore(
    targetMeta: LegalMetadata | undefined,
    corpusMeta: LegalMetadata | undefined,
    cosineSim: number
  ): {
    hybridScore: number;
    statuteScore: number;
    domainScore: number;
    issuesScore: number;
    embedScore: number;
    sharedStatutes: string[];
    sharedIssues: string[];
    domainMatch: boolean;
  } {
    const targetStatutes = targetMeta?.statutes_and_sections || [];
    const corpusStatutes = corpusMeta?.statutes_and_sections || [];

    const targetDomain = (targetMeta?.legal_domain || '').toLowerCase().trim();
    const corpusDomain = (corpusMeta?.legal_domain || '').toLowerCase().trim();

    const targetIssues = targetMeta?.key_legal_issues || [];
    const corpusIssues = corpusMeta?.key_legal_issues || [];

    // 1. Statute Overlap (Max 50 pts)
    const sharedStatutes: string[] = [];
    for (const ts of targetStatutes) {
      const cleanTs = ts.toLowerCase();
      for (const cs of corpusStatutes) {
        const cleanCs = cs.toLowerCase();
        const tsNum = cleanTs.match(/(section\s*\d+|article\s*\d+|\d+)/i)?.[0];
        const csNum = cleanCs.match(/(section\s*\d+|article\s*\d+|\d+)/i)?.[0];
        const tsCleanBase = cleanTs.replace(/\d{4}/g, '').trim();
        const csCleanBase = cleanCs.replace(/\d{4}/g, '').trim();

        if (
          cleanTs === cleanCs ||
          tsCleanBase === csCleanBase ||
          (tsNum && csNum && tsNum === csNum && (cleanTs.includes(csCleanBase) || cleanCs.includes(tsCleanBase)))
        ) {
          if (!sharedStatutes.includes(cs)) {
            sharedStatutes.push(cs);
          }
        }
      }
    }

    let statuteScore = 0;
    if (sharedStatutes.length > 0) {
      statuteScore = Math.min(50, 35 + (sharedStatutes.length - 1) * 15);
    }

    // 2. Domain Match (Max 25 pts)
    let domainMatch = false;
    let domainScore = 0;
    if (targetDomain && corpusDomain) {
      const tDomParts = targetDomain.split('/');
      const cDomParts = corpusDomain.split('/');
      const hasPartMatch = tDomParts.some((tp) => cDomParts.some((cp) => tp.trim() === cp.trim()));
      if (
        targetDomain === corpusDomain ||
        targetDomain.includes(corpusDomain) ||
        corpusDomain.includes(targetDomain) ||
        hasPartMatch
      ) {
        domainMatch = true;
        domainScore = 25;
      }
    }

    // 3. Key Issues Overlap (Max 15 pts)
    const sharedIssues: string[] = [];
    for (const ti of targetIssues) {
      const cleanTi = ti.toLowerCase();
      for (const ci of corpusIssues) {
        const cleanCi = ci.toLowerCase();
        if (cleanTi === cleanCi || cleanTi.includes(cleanCi) || cleanCi.includes(cleanTi)) {
          if (!sharedIssues.includes(ci)) {
            sharedIssues.push(ci);
          }
        }
      }
    }
    const issuesScore = Math.min(15, sharedIssues.length * 7.5);

    // 4. Embedding Cosine Similarity (Max 10 pts)
    const embedScore = Math.round(Math.max(0, Math.min(1, cosineSim)) * 10);

    const hybridScore = Math.min(100, Math.round(statuteScore + domainScore + issuesScore + embedScore));

    return {
      hybridScore,
      statuteScore,
      domainScore,
      issuesScore,
      embedScore,
      sharedStatutes,
      sharedIssues,
      domainMatch,
    };
  }

  public matchUploadedChunks(queryEmbedding: number[], sessionId: string, matchCount = 5): Array<{ id: string; content: string; chunk_index: number; similarity: number }> {
    const sessionChunks = this.uploadedChunks.filter((c) => !sessionId || c.session_id === sessionId);

    const scored = sessionChunks.map((chunk) => ({
      id: chunk.id,
      content: chunk.content,
      chunk_index: chunk.chunk_index,
      similarity: this.cosineSimilarity(queryEmbedding, chunk.embedding),
    }));

    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, matchCount);
  }

  public matchPrecedents(
    queryEmbedding: number[],
    targetMetadata?: LegalMetadata,
    matchCount: number = 5
  ): Array<{
    judgment_id: string;
    case_name: string;
    court: string;
    year: number;
    source_file: string;
    sample_content: string;
    similarity: number;
    legal_metadata?: LegalMetadata;
    shared_statutes: string[];
    domain_match: boolean;
    hybrid_details: any;
  }> {
    this.loadCorpusFromIndex();

    if (this.corpusChunks.length === 0 || this.judgments.length === 0) {
      return [];
    }

    const caseScores = new Map<string, { maxSim: number; sampleContent: string; judgment: JudgmentRecord }>();

    for (const chunk of this.corpusChunks) {
      let judgment = this.judgments.find((j) => j.id === chunk.judgment_id);
      if (!judgment && chunk.source_file) {
        judgment = this.judgments.find((j) => j.source_file === chunk.source_file);
      }
      if (!judgment) continue;

      const sim = this.cosineSimilarity(queryEmbedding, chunk.embedding);
      const existing = caseScores.get(judgment.id);

      if (!existing || sim > existing.maxSim) {
        caseScores.set(judgment.id, {
          maxSim: sim,
          sampleContent: chunk.content,
          judgment,
        });
      }
    }

    const results = Array.from(caseScores.values()).map((item) => {
      const hybrid = this.computeHybridMatchScore(targetMetadata, item.judgment.legal_metadata, item.maxSim);
      return {
        judgment_id: item.judgment.id,
        case_name: item.judgment.case_name,
        court: item.judgment.court,
        year: item.judgment.year,
        source_file: item.judgment.source_file,
        sample_content: item.sampleContent,
        similarity: hybrid.hybridScore,
        legal_metadata: item.judgment.legal_metadata,
        shared_statutes: hybrid.sharedStatutes,
        domain_match: hybrid.domainMatch,
        hybrid_details: hybrid,
      };
    });

    results.sort((a, b) => b.similarity - a.similarity);
    
    // Ensure matchCount is a valid number
    const limit = typeof matchCount === 'number' ? matchCount : 5;
    return results.slice(0, limit);
  }
}

const globalForMemory = globalThis as unknown as { memoryStore?: InMemoryVectorStore };
export const memoryStore = globalForMemory.memoryStore || new InMemoryVectorStore();
if (process.env.NODE_ENV !== 'production') globalForMemory.memoryStore = memoryStore;
