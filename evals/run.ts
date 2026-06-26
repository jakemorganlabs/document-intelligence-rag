#!/usr/bin/env tsx
/**
 * Eval runner — ingest eval corpus, run all labeled fixtures, collect results.
 *
 * Usage:
 *   npx tsx evals/run.ts [--clean]
 *
 * With --clean, drops the public schema and re-runs migrations before ingest.
 */
import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Client, type PoolClient } from "pg";
import { getClient } from "../src/db.js";
import { ingestFile } from "../src/ingest.js";
import { queryDocument } from "../src/query.js";
import { runMigrations } from "../scripts/migrate.js";
import type {
  AnswerableLabel,
  AdversarialLabel,
  FixtureResult,
  UnanswerableLabel,
} from "./types.js";

const __dirname = resolve(fileURLToPath(import.meta.url), "..");
const CORPUS_DIR = resolve(__dirname, "../fixtures/eval_corpus/pdfs");
const QUESTIONS_DIR = resolve(__dirname, "../fixtures/eval_corpus/questions");

/* ---------- helpers ---------- */

async function loadFixtures<T>(filename: string): Promise<T[]> {
  const raw = await readFile(join(QUESTIONS_DIR, filename), "utf-8");
  return JSON.parse(raw) as T[];
}

async function getPdfFiles(): Promise<string[]> {
  const files = await readdir(CORPUS_DIR);
  return files
    .filter((f) => f.toLowerCase().endsWith(".pdf"))
    .map((f) => join(CORPUS_DIR, f))
    .sort();
}

async function ingestCorpus(client: PoolClient): Promise<void> {
  const files = await getPdfFiles();
  console.log(`[eval] Ingesting ${files.length} eval PDFs...`);
  for (const file of files) {
    const result = await ingestFile(file, client);
    console.log(
      `  ${result.status === "indexed" ? "[OK]" : result.status === "skipped" ? "[SK]" : "[ER]"} ${result.source} | chunks: ${result.chunksTotal} | embed: ${result.chunksEmbedded}`
    );
  }
  console.log("[eval] Ingest complete.");
}

async function runFixture(
  label: { id: string; question: string; expectedStatus?: "answered" | "insufficient_evidence" },
  client: PoolClient
): Promise<FixtureResult> {
  try {
    const result = await queryDocument({ question: label.question, client });
    return {
      labelId: label.id,
      question: label.question,
      category: "unknown",
      expectedStatus: label.expectedStatus,
      answer: result.answer,
      retrieved: result.retrieved,
      topScore: result.audit.top_score ?? 0,
      repairUsed: result.audit.repair_used,
      gateFired: result.audit.gate_fired,
      latencyMs: result.audit.latency_ms,
    };
  } catch (err) {
    return {
      labelId: label.id,
      question: label.question,
      category: "unknown",
      expectedStatus: label.expectedStatus,
      answer: {
        status: "insufficient_evidence",
        answer: "Eval error: query pipeline failed.",
        citations: [],
      },
      retrieved: [],
      topScore: 0,
      repairUsed: false,
      gateFired: null,
      latencyMs: 0,
      error: (err as Error).message,
    };
  }
}

/* ---------- public API ---------- */

export interface EvalRunResult {
  answerableResults: FixtureResult[];
  unanswerableResults: FixtureResult[];
  adversarialResults: FixtureResult[];
}

export async function runEvals(
  options: { client?: PoolClient; skipIngest?: boolean } = {}
): Promise<EvalRunResult> {
  const ownClient = !options.client;
  const client = options.client ?? (await getClient());

  if (!options.skipIngest) {
    // Simple check: if no documents exist, assume we need to ingest
    const docCount = await client.query("SELECT COUNT(*) AS n FROM documents");
    if (Number(docCount.rows[0]?.n ?? 0) === 0) {
      await ingestCorpus(client);
    } else {
      console.log("[eval] Documents already present; skip ingest (use --clean to force refresh).");
    }
  }

  const answerable = await loadFixtures<AnswerableLabel>("answerable.json");
  const unanswerable = await loadFixtures<UnanswerableLabel>("unanswerable.json");
  const adversarial = await loadFixtures<AdversarialLabel>("adversarial.json");

  console.log(`[eval] Running ${answerable.length} answerable fixtures...`);
  const answerableResults: FixtureResult[] = [];
  for (const label of answerable) {
    const r = await runFixture(
      { id: label.id, question: label.question, expectedStatus: undefined },
      client
    );
    r.category = label.category;
    answerableResults.push(r);
  }

  console.log(`[eval] Running ${unanswerable.length} unanswerable fixtures...`);
  const unanswerableResults: FixtureResult[] = [];
  for (const label of unanswerable) {
    const r = await runFixture(
      { id: label.id, question: label.question, expectedStatus: "insufficient_evidence" },
      client
    );
    r.category = "unanswerable";
    unanswerableResults.push(r);
  }

  console.log(`[eval] Running ${adversarial.length} adversarial fixtures...`);
  const adversarialResults: FixtureResult[] = [];
  for (const label of adversarial) {
    const r = await runFixture(
      { id: label.id, question: label.question, expectedStatus: label.expected_status },
      client
    );
    r.category = label.category;
    adversarialResults.push(r);
  }

  if (ownClient) client.release();

  return { answerableResults, unanswerableResults, adversarialResults };
}

/* ---------- CLI ---------- */

async function main() {
  const cleanFlag = process.argv.includes("--clean");

  if (cleanFlag) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is required");
    }
    const adminClient = new Client({ connectionString });
    await adminClient.connect();
    console.log("[eval] Dropping public schema for clean eval...");
    await adminClient.query("DROP SCHEMA IF EXISTS public CASCADE");
    await adminClient.query("CREATE SCHEMA public");
    await adminClient.query("GRANT ALL ON SCHEMA public TO public");
    await adminClient.end();
    await runMigrations(connectionString);
  }

  const results = await runEvals();

  // Save raw results for debugging
  const resultsPath = resolve(__dirname, "results.json");
  const resultsJson = JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      answerable: results.answerableResults,
      unanswerable: results.unanswerableResults,
      adversarial: results.adversarialResults,
    },
    null,
    2
  );
  const { writeFile } = await import("node:fs/promises");
  await writeFile(resultsPath, resultsJson, "utf-8");
  console.log(`[eval] Raw results written to ${resultsPath}`);
}

if (import.meta.url === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error("[eval] Fatal error:", err);
    process.exit(1);
  });
}
