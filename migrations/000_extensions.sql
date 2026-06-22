-- Migration: 000_extensions
-- Purpose: Enable required Postgres extensions idempotently.
-- Rationale: pgvector provides vector type + ANN index (FR-EM-3); pgcrypto provides gen_random_uuid().
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
