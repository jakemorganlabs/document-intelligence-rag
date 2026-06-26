/**                                                                                                                                                                                                                          
 * Generator — Google Gemma adapter for grounded answer generation (§10.8, FR-AN-1..5).
 *
 * Uses @google/genai with JSON mode (responseMimeType: application/json) and
 * a responseSchema to constrain output. Gemma relies on prompt discipline +
 * responseSchema + post-generation validation as the guarantee stack.
 *
 * Repair loop: exactly one corrective re-call on schema or citation failure.
 */
import { GoogleGenAI } from "@google/genai";
import generationConfig from "../config/generation.json" with { type: "json" };
import type { GroundedAnswer } from "../types/index.js";

export interface GenerateOptions {
  prompt: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface GenerateResult {
  answer: GroundedAnswer;
  rawText: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  latencyMs: number;
}

function buildGemmaClient(): GoogleGenAI {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY ?? "";
  if (!apiKey) {
    throw new Error("GOOGLE_GENAI_API_KEY not set");
  }
  return new GoogleGenAI({ apiKey });
}

function buildResponseSchema(): Record<string, unknown> {
  return {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: ["answered", "insufficient_evidence"],
      },
      answer: { type: "string" },
      citations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            chunk_id: { type: "string" },
            source: { type: "string" },
            page: {
              oneOf: [{ type: "integer" }, { type: "null" }],
            },
            snippet: { type: "string" },
          },
          required: ["chunk_id", "source", "snippet"],
        },
      },
    },
    required: ["status", "answer", "citations"],
  };
}

function stripMarkdownFences(text: string): string {
  const cleaned = text
    .replace(/^```(?:json)?\s*/, "")
    .replace(/```\s*$/, "")
    .trim();
  // Find first '{' and last '}'
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return cleaned;
  }
  return cleaned.slice(firstBrace, lastBrace + 1);
}

export async function generateGroundedAnswer(
  opts: GenerateOptions
): Promise<GenerateResult> {
  const client = buildGemmaClient();
  const model = opts.model ?? generationConfig.model_id;
  const temperature = opts.temperature ?? generationConfig.temperature;
  const maxTokens = opts.maxOutputTokens ?? generationConfig.max_tokens;

  const start = performance.now();

  const result = await client.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
    config: {
      temperature,
      maxOutputTokens: maxTokens,
      responseMimeType: "application/json",
      responseSchema: buildResponseSchema(),
    },
  });

  const latencyMs = Math.round(performance.now() - start);

  const rawText =
    typeof result.text === "string" ? result.text : JSON.stringify(result.text);

  const stripped = stripMarkdownFences(rawText);

  let answer: GroundedAnswer;
  try {
    answer = JSON.parse(stripped) as GroundedAnswer;
  } catch (err) {
    answer = {
      status: "insufficient_evidence",
      answer: "I don't have enough information in the provided documents to answer that.",
      citations: [],
    };
  }

  const usage = (result as unknown as { usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number } }).usageMetadata;
  const inputTokens = usage?.promptTokenCount ?? 0;
  const outputTokens = usage?.candidatesTokenCount ?? 0;
  const totalTokens = usage?.totalTokenCount ?? inputTokens + outputTokens;

  return {
    answer,
    rawText: stripped,
    inputTokens,
    outputTokens,
    totalTokens,
    latencyMs,
  };
}

export async function generateRepair(
  opts: GenerateOptions & {
    priorRawText: string;
    validationError: string;
  }
): Promise<GenerateResult> {
  const repairPrompt = [
    `Your previous response failed validation:\n${opts.validationError}\n`,
    `Your previous output was:\n${opts.priorRawText}\n`,
    `Please provide a corrected JSON response strictly matching the required schema.`,
    `Make sure every citation chunk_id exists in the passages and every snippet is verbatim.`,
    opts.prompt,
  ].join("\n\n---\n\n");

  return generateGroundedAnswer({
    ...opts,
    prompt: repairPrompt,
  });
}
