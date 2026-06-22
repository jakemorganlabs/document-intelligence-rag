-- Migration: 004_dead_letter
-- Purpose: Dead-letter / quarantine table for unhandled ingest and query failures.
-- Satisfies: FR-ER-1 (single error path).
CREATE TABLE IF NOT EXISTS dead_letters (
    dl_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage         TEXT NOT NULL,                -- ingest | query | embedding | generate
    item_type     TEXT NOT NULL,                -- document | query | chunk | batch
    item_snapshot JSONB,                        -- payload that failed
    error         TEXT,
    error_code    TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at   TIMESTAMPTZ,
    resolved_by   TEXT
);

CREATE INDEX IF NOT EXISTS idx_dl_stage_created ON dead_letters(stage, created_at DESC);
