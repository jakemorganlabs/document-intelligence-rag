# Document Intelligence RAG

Grounded retrieval-augmented generation with citations and deterministic abstention.

**Portfolio Piece II · MICT-RAG-002 · Session S01 — Deterministic Core**

An answer it cannot cite is an answer it must not give.

[![CI](https://github.com/jakemorganlabs/document-intelligence-rag/actions/workflows/test.yml/badge.svg)](https://github.com/jakemorganlabs/document-intelligence-rag/actions/workflows/test.yml)

## What this session delivers

Session S01 implements the deterministic half of the system — no model calls, no network:

- **Chunker** — token-aware, structural-boundary-preferring, pure function
- **Citation verifier** — whitespace-normalized snippet match + chunk-in-set check
- **Abstention decision** — pre-generation relevance gate + post-generation cross-field rules
- **JSON Schemas** — `ChunkRecord` and `GroundedAnswer` (draft 2020-12)
- **Postgres migrations** — documents, chunks (pgvector HNSW), query audit, dead letter

## Prerequisites

- Node.js 20+
- Docker (for local Postgres + pgvector)

## Quick start

```bash
# Install dependencies
npm install

# Start Postgres with pgvector
docker compose up -d

# Verify pgvector extension
docker compose exec postgres psql -U postgres -d docintel \
  -c "SELECT extname FROM pg_extension WHERE extname = 'vector';"

# Apply migrations
cp .env.example .env
npm run migrate

# Run tests
npm test
```

## Project layout

```
config/           Versioned chunking + retrieval parameters
migrations/       Postgres schema (pgvector, HNSW index)
schemas/          JSON Schema contracts (§11.1, §11.2)
src/
  chunker.ts      Pure token-aware chunker
  citation_verifier.ts
  abstention.ts
tests/            Unit tests for all deterministic components
```

## Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run unit tests + schema validation |
| `npm run typecheck` | TypeScript compile check |
| `npm run migrate` | Apply pending SQL migrations |
| `npm run migrate:fresh` | Drop schema and re-apply all migrations |

## Spec references

- Parent SRS/TDD: MICT-RAG-002 v1.0
- This session: MICT-RAG-002-S01 (Deterministic Core)

## License

MIT
