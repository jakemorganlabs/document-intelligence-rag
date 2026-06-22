import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Ajv } from "ajv";
import addFormatsModule from "ajv-formats";
import { describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemasDir = path.join(__dirname, "..", "schemas");

const addFormats =
  typeof addFormatsModule === "function"
    ? addFormatsModule
    : (addFormatsModule as { default: (ajv: Ajv) => Ajv }).default;

const ajv = new Ajv({
  allErrors: true,
  strict: false,
  validateSchema: false,
});
addFormats(ajv);

const chunkSchema = JSON.parse(
  readFileSync(path.join(schemasDir, "chunk_record.schema.json"), "utf8")
);
const answerSchema = JSON.parse(
  readFileSync(path.join(schemasDir, "grounded_answer.schema.json"), "utf8")
);

const validateChunk = ajv.compile(chunkSchema);
const validateAnswer = ajv.compile(answerSchema);

describe("schema validation", () => {
  it("validates chunk_record.schema.json with draft 2020-12", () => {
    expect(chunkSchema.$schema).toBe(
      "https://json-schema.org/draft/2020-12/schema"
    );

    const valid = {
      chunk_id: "00000000-0000-4000-8000-000000000010",
      document_id: "00000000-0000-4000-8000-000000000001",
      content_hash: "sha256:deadbeef",
      source: "Structured-Cabling-Standards-Handbook.pdf",
      page: 14,
      section: "4.2 Horizontal Cabling Distances",
      chunk_index: 0,
      char_start: 0,
      char_end: 120,
      text: "The horizontal permanent link is limited to 90 m.",
      token_count: 12,
      embed_model: "text-embedding-3-small",
      embed_dims: 1536,
      embedded_at: "2026-06-21T00:00:00.000Z",
    };

    expect(validateChunk(valid)).toBe(true);
  });

  it("rejects chunk records with additional properties", () => {
    const invalid = {
      chunk_id: "00000000-0000-4000-8000-000000000010",
      document_id: "00000000-0000-4000-8000-000000000001",
      content_hash: "sha256:deadbeef",
      source: "doc.pdf",
      page: 1,
      section: null,
      chunk_index: 0,
      char_start: 0,
      char_end: 10,
      text: "hello",
      token_count: 1,
      unexpected: true,
    };

    expect(validateChunk(invalid)).toBe(false);
  });

  it("validates grounded_answer.schema.json", () => {
    expect(answerSchema.$schema).toBe(
      "https://json-schema.org/draft/2020-12/schema"
    );

    const answered = {
      status: "answered",
      answer: "The permanent link is limited to 90 m.",
      citations: [
        {
          chunk_id: "c-37",
          source: "Structured-Cabling-Standards-Handbook.pdf",
          page: 14,
          snippet: "limited to 90 m",
        },
      ],
    };

    const abstained = {
      status: "insufficient_evidence",
      answer:
        "I don't have enough information in the provided documents to answer that.",
      citations: [],
    };

    expect(validateAnswer(answered)).toBe(true);
    expect(validateAnswer(abstained)).toBe(true);
  });

  it("rejects grounded answers with additional properties", () => {
    const invalid = {
      status: "answered",
      answer: "test",
      citations: [],
      extra: true,
    };

    expect(validateAnswer(invalid)).toBe(false);
  });
});
