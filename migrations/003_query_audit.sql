-- Migration: 003_query_audit
-- Purpose: Per-query audit record capturing retrieval, generation, citations, and cost.
-- Satisfies: FR-PS-2, NFR-OB-1.
CREATE TABLE IF NOT EXISTS query_audits (
    audit_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question          TEXT NOT NULL,
    retrieved_ids     TEXT[] NOT NULL DEFAULT '{}',
    scores            JSONB NOT NULL DEFAULT '{}',
    status            TEXT NOT NULL,                    -- answered | insufficient_evidence | error
    answer            TEXT,
    citations         JSONB NOT NULL DEFAULT '[]',
    model_id          TEXT,
    parameters        JSONB,
    cache_read_tokens INT,
    cache_write_tokens INT,
    repair_used       BOOLEAN NOT NULL DEFAULT FALSE,
    latency_ms        INT,
    token_counts      JSONB,
    gate_fired        TEXT,                               -- relevance | citation | none
    top_score         NUMERIC,
    error_info        JSONB,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
