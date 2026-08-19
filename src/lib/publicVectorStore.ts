import fs from 'fs';
import path from 'path';

export interface PublicDocument {
  id: string;
  title: string;
  category: string;
  statute: string;
  sections: string[];
  source_file: string;
}

export interface PublicChunk {
  id: string;
  doc_id: string;
  title: string;
  category: string;
  statute: string;
  sections: string[];
  source_file: string;
  content: string;
  chunk_index: number;
  embedding: number[];
}

export class PublicVectorStore {
  public documents: PublicDocument[] = [];
  public chunks: PublicChunk[] = [];

  constructor() {
    this.loadIndex();
  }

  public loadIndex() {
    try {
      const indexPath = path.join(process.cwd(), 'data', 'public-index.json');
      if (fs.existsSync(indexPath)) {
        const raw = fs.readFileSync(indexPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.documents && parsed.publicChunks) {
          this.documents = parsed.documents;
          this.chunks = parsed.publicChunks;
          return;
        }
      }
    } catch (e) {
      console.warn('[PublicVectorStore]: Could not load public-index.json:', e);
    }
    this.documents = [];
    this.chunks = [];
  }

  private cosineSimilarity(a: number[], b: number[]): number {
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

  public matchPublicStatutes(
    queryEmbedding: number[],
    matchCount = 4
  ): Array<{
    title: string;
    category: string;
    statute: string;
    sections: string[];
    source_file: string;
    content: string;
    similarity: number;
  }> {
    this.loadIndex();
    if (this.chunks.length === 0) return [];

    const scored = this.chunks.map((chunk) => ({
      title: chunk.title,
      category: chunk.category,
      statute: chunk.statute,
      sections: chunk.sections,
      source_file: chunk.source_file,
      content: chunk.content,
      similarity: this.cosineSimilarity(queryEmbedding, chunk.embedding),
    }));

    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, matchCount);
  }
}

const globalForPublicStore = globalThis as unknown as { publicStore?: PublicVectorStore };
export const publicVectorStore = globalForPublicStore.publicStore || new PublicVectorStore();
if (process.env.NODE_ENV !== 'production') globalForPublicStore.publicStore = publicVectorStore;
