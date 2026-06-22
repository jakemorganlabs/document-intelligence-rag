# Document Intelligence RAG

Grounded retrieval-augmented generation with citations and deterministic abstention.

**Portfolio Piece II · MICT-RAG-002 · Sessions S01 + S02 — Deterministic Core + Ingest Pipeline**

An answer it cannot cite is an answer it must not give.

[![CI](https://github.com/jakemorganlabs/document-intelligence-rag/actions/workflows/test.yml/badge.svg)](https://github.com/jakemorganlabs/document-intelligence-rag/actions/workflows/test.yml)

## Model stack

| Role | Provider | Model |
|------|----------|-------|
| **Generation (RAG answers)** | Google | `google/gemma-4-26B-A4B-it` |
| **Embeddings** | OpenAI | `text-embedding-3-small` |

Generation is pinned to **Google Gemma** — not Anthropic, Claude, or Haiku. See `config/generation.json` and `src/generation_config.ts`.

## What this session delivers

### S01 — Deterministic Core

The deterministic half of the system — no model calls, no network:

- **Chunker** — token-aware, structural-boundary-preferring, pure function
- **Citation verifier** — whitespace-normalized snippet match + chunk-in-set check
- **Abstention decision** — pre-generation relevance gate + post-generation cross-field rules
- **JSON Schemas** — `ChunkRecord` and `GroundedAnswer` (draft 2020-12)
- **Postgres migrations** — documents, chunks (pgvector HNSW), query audit, dead letter

### S02 — Ingest Pipeline

The path from PDF to indexed vector with three invariants:

- **Idempotent** — unchanged documents (matching `content_hash`) are skipped
- **Resilient** — un-embedded chunks remain in the database for re-rerun
- **Tolerant** — one corrupt file in a batch does not abort the others

| Component | File | Description |
|-----------|------|-------------|
| PDF/Text extractor | `sidecar/extract.py` | Python sidecar using `pypdf`, returns page-tagged JSON |
| Hash utility | `src/hash.ts` | SHA-256 content hash for idempotency |
| Idempotency check | `src/idempotency.ts` | Skip re-ingest on unchanged content |
| Embedder | `src/embedder.ts` | Batched OpenAI calls with retry and backoff |
| Vector store | `src/vector_store.ts` | Transactional document + chunk persistence |
| Ingest orchestrator | `src/ingest.ts` | End-to-end: file → extraction → chunk → embed → persist |
| CLI entry point | `scripts/ingest.ts` | Single-file or batch ingestion from command line |
| Re-embed command | `scripts/embed_pending.ts` | Re-runs embeddings for un-embedded chunks (FR-EM-4) |
| ANN sanity | `scripts/ann_sanity.ts` | Top-k cosine query timing check |
| Smoke test | `scripts/ingest_smoke.sh` | Full S02 acceptance suite |

## Prerequisites

- Node.js 20+
- Python 3 with `pypdf` (`pip install -r sidecar/requirements.txt`)
- Docker (for local Postgres + pgvector)
- OpenAI API key for embeddings (set in `.env`)

## Quick start

```bash
# Install dependencies
npm install

# Install Python sidecar dependencies
pip install -r sidecar/requirements.txt

# Start Postgres with pgvector
docker compose up -d

# Configure environment
cp .env.example .env
# Edit .env and set EMBEDDING_PROVIDER_API_KEY

# Apply migrations
npm run migrate:fresh

# Generate smoke-test PDF fixtures
python3 fixtures/generate_smoke_pdfs.py

# Run tests
npm test

# Ingest a single file
npm run ingest -- fixtures/smoke_pdfs/smoke_01_guidelines.pdf

# Ingest an entire directory
npm run ingest -- fixtures/smoke_pdfs/

# Re-embed any pending chunks
npm run embed:pending

# Run full S02 smoke test (requires DATABASE_URL + API key)
npm run ingest:smoke
```

## Project layout

```
config/              Versioned chunking, retrieval, and generation parameters
migrations/          Postgres schema (pgvector, HNSW index)
schemas/             JSON Schema contracts (S01)
sidecar/
  extract.py         Python PDF/text extractor
  requirements.txt Python dependencies
src/
  chunker.ts         Pure token-aware chunker (S01)
  citation_verifier.ts
  abstention.ts
  generation_config.ts
  hash.ts            SHA-256 content hash
  pdf_extractor.ts   Sidecar client
  idempotency.ts     Skip-if-unchanged logic
  embedder.ts        Batched OpenAI embedding with retry
  vector_store.ts    Transactional document + chunk persistence
  ingest.ts          Orchestrator (file → vectors)
  db.ts              Database repository / CRUD
tests/               Unit tests for all components
fixtures/
  smoke_pdfs/        Synthetic PDFs for testing
  generate_smoke_pdfs.py
scripts/
  ingest.ts           CLI entry point for ingestion
  embed_pending.ts  Re-run un-embedded chunks
  ann_sanity.ts       ANN timing check
  ingest_smoke.sh     Full acceptance test
```

## Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run unit tests + schema validation (S01 + S02) |
| `npm run typecheck` | TypeScript compile check |
| `npm run migrate` | Apply pending SQL migrations |
| `npm run migrate:fresh` | Drop schema and re-apply all migrations |
| `npm run ingest -- <path>` | Ingest a file or directory |
| `npm run embed:pending` | Embed chunks where `embedding IS NULL` |
| `npm run ingest:smoke` | Run full S02 smoke test suite |

## S02 Acceptance Criteria

1. **3 PDFs ingest cleanly** — text extracted with page boundaries, chunks generated, vectors stored
2. **Re-ingest is a no-op** — matching `content_hash` returns `status: skipped`, 0 new rows
3. **Corrupt PDF tolerated** — one bad file in a batch doesn't abort the others (FR-IG-6)
4. **Embedding failure handled** — failed chunks recorded as un-embedded; `scripts/embed_pending.ts` picks them up (FR-EM-4)
5. **ANN queryable** — top-6 cosine similarity query returns results in <100 ms on ~100 chunks

## Re-ingest policy

On re-ingest of a **modified** document: **replace** (delete old chunks, insert new — wrapped in a single transaction). This keeps the portfolio simple. Version tracking is listed under Risks as an alternative if requirements change.

## Spec references

- Parent SRS/TDD: MICT-RAG-002 v1.0
- Session S01: MICT-RAG-002-S01 (Deterministic Core)
- Session S02: MICT-RAG-002-S02 (Ingest Pipeline)

## License

MIT
