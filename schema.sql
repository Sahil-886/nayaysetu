-- ==========================================
-- NyaySetu: Supabase pgvector Schema
-- ==========================================

-- 1. Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Pre-indexed Judgment Corpus Table
CREATE TABLE IF NOT EXISTS judgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_name TEXT NOT NULL,
  court TEXT DEFAULT 'Supreme Court of India',
  year INTEGER,
  source_file TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Judgment Chunks Table with 768-dim Embeddings (nomic-embed-text)
CREATE TABLE IF NOT EXISTS judgment_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judgment_id UUID REFERENCES judgments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding VECTOR(768),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HNSW Vector Index for Corpus Similarity Search
CREATE INDEX IF NOT EXISTS judgment_chunks_embedding_hnsw_idx 
ON judgment_chunks USING hnsw (embedding vector_cosine_ops);

-- 4. Session Uploaded Documents Table
CREATE TABLE IF NOT EXISTS uploaded_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  summary JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Uploaded Document Chunks Table
CREATE TABLE IF NOT EXISTS uploaded_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES uploaded_documents(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding VECTOR(768),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HNSW Vector Index for Uploaded Document Chunks
CREATE INDEX IF NOT EXISTS uploaded_chunks_embedding_hnsw_idx 
ON uploaded_chunks USING hnsw (embedding vector_cosine_ops);

-- 6. RPC Function for Uploaded Chunks Grounded Retrieval
CREATE OR REPLACE FUNCTION match_uploaded_chunks (
  query_embedding VECTOR(768),
  match_threshold FLOAT DEFAULT 0.1,
  match_count INT DEFAULT 5,
  p_session_id TEXT DEFAULT ''
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  chunk_index INT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    uc.id,
    uc.document_id,
    uc.content,
    uc.chunk_index,
    (1 - (uc.embedding <=> query_embedding))::FLOAT AS similarity
  FROM uploaded_chunks uc
  WHERE (p_session_id = '' OR uc.session_id = p_session_id)
    AND (1 - (uc.embedding <=> query_embedding)) > match_threshold
  ORDER BY uc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 7. RPC Function for Precedent Matching across Corpus
CREATE OR REPLACE FUNCTION match_precedents (
  query_embedding VECTOR(768),
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  judgment_id UUID,
  case_name TEXT,
  court TEXT,
  year INT,
  source_file TEXT,
  sample_content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH scored_chunks AS (
    SELECT
      jc.judgment_id,
      jc.content,
      (1 - (jc.embedding <=> query_embedding))::FLOAT AS sim_score,
      ROW_NUMBER() OVER (PARTITION BY jc.judgment_id ORDER BY (jc.embedding <=> query_embedding) ASC) as rn
    FROM judgment_chunks jc
  )
  SELECT
    j.id AS judgment_id,
    j.case_name,
    j.court,
    j.year,
    j.source_file,
    sc.content AS sample_content,
    sc.sim_score AS similarity
  FROM scored_chunks sc
  JOIN judgments j ON j.id = sc.judgment_id
  WHERE sc.rn = 1
  ORDER BY sc.sim_score DESC
  LIMIT match_count;
END;
$$;
