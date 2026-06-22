-- Migration: 002_chunks
-- Purpose: Chunk table with pgvector embedding column and ANN index.
-- Satisfies: FR-EM-3 (ANN index), FR-IG-4 (metadata per chunk), FR-PS-1.
CREATE TABLE IF NOT EXISTS chunks (
    chunk_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id    UUID NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
    content_hash   TEXT NOT NULL,
    source         TEXT NOT NULL,
    page           INT,
    section        TEXT,
    chunk_index    INT NOT NULL,
    char_start     INT,
    char_end       INT,
    text           TEXT NOT NULL,
    token_count    INT NOT NULL DEFAULT 0,
    embedding      VECTOR(1536),                  -- text-embedding-3-small dimension
    embed_model    TEXT,
    embed_dims     INT,
    embedded_at    TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_document FOREIGN KEY (document_id)
        REFERENCES documents(document_id) ON DELETE CASCADE
);

-- Approximate-nearest-neighbour index for cosine similarity search
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_cosine
    ON chunks USING hnsw (embedding vector_cosine_ops);

-- Look up chunks by document for re-ingest / cleanup
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks(document_id);
