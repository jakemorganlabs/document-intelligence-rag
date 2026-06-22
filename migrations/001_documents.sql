-- Migration: 001_documents
-- Purpose: Parent table for ingested documents.
-- Satisfies: FR-IG-5 (idempotency via content_hash), FR-PS-1 (persistence).
CREATE TABLE IF NOT EXISTS documents (
    document_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source         TEXT NOT NULL,
    content_hash   TEXT NOT NULL UNIQUE,
    page_count     INT NOT NULL DEFAULT 0,
    chunk_count    INT NOT NULL DEFAULT 0,
    status         TEXT NOT NULL DEFAULT 'pending',   -- pending | indexing | indexed | failed
    ingested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Look up by hash quickly for idempotency checks
CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_content_hash ON documents(content_hash);
