/**
 * Query Pipeline — end-to-end query handler (§12.B).
 *
 * Flow:
 *  1. Retrieve chunks (embed query + ANN search)
 *  2. Pre-generation relevance gate (abstain if nothing ≥ floor)
 *  3. Assemble prompt
 *  4. Call Gemma generator (JSON mode + responseSchema)
 *  5. Schema validate (ajv)
 *  6. Citation gate (chunk-in-set + snippet-present)
 *  7. Repair loop (max 1 attempt), then downgrade
 *  8. Persist audit
 *  9. Return GroundedAnswer
 */
import { retrieveChunks } from "./retriever.js";
import {
  preGenerationGate,
  makeInsufficientEvidence,
  validatePostGeneration,
} from "./abstention.js";
import { assemblePrompt } from "./context_assembler.js";
import { generateGroundedAnswer, generateRepair } from "./generator.js";
import { getClient } from "./db.js";
import type { PoolClient } from "pg";
import type {
  GroundedAnswer,
  QueryAudit,
} from "../types/index.js";
import generationConfig from "../config/generation.json" with { type: "json" };
import groundedAnswerSchema from "../schemas/grounded_answer.schema.json" with { type: "json" };
import { Ajv } from "ajv";

const ajv = new Ajv({ strict: false, validateSchema: false });
const validateGroundedAnswer = ajv.compile(groundedAnswerSchema);

export interface QueryOptions {
  question: string;
  topK?: number;
  client?: PoolClient;
}

export interface QueryResult {
  answer: GroundedAnswer;
  audit: QueryAudit;
}

export async function queryDocument(
  opts: QueryOptions
): Promise<QueryResult> {
  const startTotal = performance.now();
  const ownClient = !opts.client;
  const client = opts.client ?? (await getClient());

  // --- Step 1: Retrieve (embed + ANN) ---
  const retrieveStart = performance.now();
  const { chunks: retrieved, topScore } = await retrieveChunks({
    question: opts.question,
    topK: opts.topK,
    client,
  });
  const retrieveMs = Math.round(performance.now() - retrieveStart);

  // --- Step 2: Pre-generation relevance gate ---
  const gate1 = preGenerationGate(retrieved);
  if (!gate1.proceed) {
    const result = gate1.result;
    const audit = await writeAudit(client, {
      question: opts.question,
      retrievedIds: retrieved.map((c) => c.chunk_id),
      scores: Object.fromEntries(retrieved.map((c) => [c.chunk_id, c.similarity])),
      status: result.status,
      answer: result.answer,
      citations: result.citations,
      modelId: null,
      parameters: null,
      gateFired: "relevance",
      topScore,
      repairUsed: false,
      latencyMs: retrieveMs,
      inputTokens: 0,
      outputTokens: 0,
      rawOutput: null,
    });
    if (ownClient) client.release();
    return { answer: result, audit };
  }

  const surviving = gate1.surviving;

  // --- Step 3: Assemble prompt ---
  const { prompt } = assemblePrompt(surviving, opts.question);

  // --- Step 4: Generate ---
  const genStart = performance.now();
  let genResult = await generateGroundedAnswer({ prompt });
  let genMs = Math.round(performance.now() - genStart);

  let rawOutput = genResult.rawText;
  let repairUsed = false;
  let currentAnswer = genResult.answer;

  // --- Step 5: Schema validate ---
  const schemaValid = validateGroundedAnswer(currentAnswer);

  if (!schemaValid) {
    const schemaError = ajv.errorsText(validateGroundedAnswer.errors ?? []);
    const repaired = await generateRepair({
      prompt,
      priorRawText: rawOutput,
      validationError: `Schema validation failed: ${schemaError}`,
    });
    repairUsed = true;
    rawOutput = repaired.rawText;
    currentAnswer = repaired.answer;
    genMs += repaired.latencyMs;
  }

  // --- Step 6+7: Citation gate with optional repair ---
  const firstPost = validatePostGeneration(currentAnswer, surviving);

  let finalAnswer: GroundedAnswer;
  let finalGate: "none" | "citation" | "cross_field" = "none";

  if (firstPost.outcome === "accept") {
    finalAnswer = currentAnswer;
  } else if (firstPost.outcome === "abstain") {
    finalAnswer = firstPost.result;
    finalGate = firstPost.gate;
  } else {
    // citation gate fired "repair" — attempt repair once
    if (!repairUsed) {
      const repaired = await generateRepair({
        prompt,
        priorRawText: rawOutput,
        validationError: `Citation verification failed: ${firstPost.reasons.join("; ")}`,
      });
      repairUsed = true;
      rawOutput = repaired.rawText;
      currentAnswer = repaired.answer;
      genMs += repaired.latencyMs;

      const secondPost = validatePostGeneration(currentAnswer, surviving);
      if (secondPost.outcome === "accept") {
        finalAnswer = currentAnswer;
      } else if (secondPost.outcome === "abstain") {
        finalAnswer = secondPost.result;
        finalGate = secondPost.gate;
      } else {
        finalAnswer = makeInsufficientEvidence();
        finalGate = "citation";
      }
    } else {
      // Already used repair for schema; downgrade
      finalAnswer = makeInsufficientEvidence();
      finalGate = "citation";
    }
  }

  const totalLatency = Math.round(performance.now() - startTotal);

  // --- Step 8: Audit ---
  const audit = await writeAudit(client, {
    question: opts.question,
    retrievedIds: retrieved.map((c) => c.chunk_id),
    scores: Object.fromEntries(retrieved.map((c) => [c.chunk_id, c.similarity])),
    status: finalAnswer.status,
    answer: finalAnswer.answer,
    citations: finalAnswer.citations,
    modelId: generationConfig.model_id,
    parameters: { temperature: generationConfig.temperature, max_tokens: generationConfig.max_tokens },
    gateFired: finalGate === "none" ? null : finalGate,
    topScore,
    repairUsed,
    latencyMs: totalLatency,
    inputTokens: genResult.inputTokens,
    outputTokens: genResult.outputTokens,
    rawOutput,
  });

  if (ownClient) client.release();
  return { answer: finalAnswer, audit };
}

// --- helper: write audit row ---

interface AuditWriteOpts {
  question: string;
  retrievedIds: string[];
  scores: Record<string, number>;
  status: GroundedAnswer["status"];
  answer: string;
  citations: GroundedAnswer["citations"];
  modelId: string | null;
  parameters: Record<string, unknown> | null;
  gateFired: "relevance" | "citation" | "cross_field" | "none" | null;
  topScore: number;
  repairUsed: boolean;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  rawOutput: string | null;
}

async function writeAudit(
  client: PoolClient,
  opts: AuditWriteOpts
): Promise<QueryAudit> {
  const res = await client.query<{ audit_id: string }>(
    `INSERT INTO query_audits
      (question, retrieved_ids, scores, status, answer, citations,
       model_id, parameters, gate_fired, top_score, repair_used,
       latency_ms, token_counts, error_info)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING audit_id`,
    [
      opts.question,
      opts.retrievedIds,
      JSON.stringify(opts.scores),
      opts.status,
      opts.answer,
      JSON.stringify(opts.citations),
      opts.modelId,
      opts.parameters ? JSON.stringify(opts.parameters) : null,
      opts.gateFired,
      opts.topScore,
      opts.repairUsed,
      opts.latencyMs,
      JSON.stringify({
        input_tokens: opts.inputTokens,
        output_tokens: opts.outputTokens,
        total_tokens: opts.inputTokens + opts.outputTokens,
      }),
      opts.rawOutput ? JSON.stringify({ raw_output: opts.rawOutput }) : null,
    ]
  );

  return {
    audit_id: res.rows[0]!.audit_id,
    question: opts.question,
    retrieved_ids: opts.retrievedIds,
    scores: opts.scores,
    status: opts.status as QueryAudit["status"],
    answer: opts.answer,
    citations: opts.citations,
    model_id: opts.modelId,
    parameters: opts.parameters,
    gate_fired: opts.gateFired,
    top_score: opts.topScore,
    repair_used: opts.repairUsed,
    latency_ms: opts.latencyMs,
  } as unknown as QueryAudit;
}
