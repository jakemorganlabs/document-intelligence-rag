/**
 * Embedder unit tests — batching, retry, failure semantics.
 *
 * Satisfies: FR-EM-1 (batched embedding), FR-EM-4 (un-embedded remain re-runnable).
 */
import { describe, it, expect } from "vitest";
import { embedTexts, getEmbeddingConfigFromEnv } from "../src/embedder.js";

describe("getEmbeddingConfigFromEnv", () => {
  it("provides sensible defaults when env is absent", () => {
    const cfg = getEmbeddingConfigFromEnv();
    expect(cfg.model).toBe("text-embedding-3-small");
    expect(cfg.batchSize).toBe(100);
    expect(cfg.maxRetries).toBe(3);
    expect(cfg.baseDelayMs).toBe(2000);
  });
});

describe("embedTexts (live API)", () => {
  it("embeds a batch of two short texts", async () => {
    const apiKey = process.env.EMBEDDING_PROVIDER_API_KEY;
    if (!apiKey) {
      console.warn("Skipping live embed test — EMBEDDING_PROVIDER_API_KEY not set");
      return;
    }
    const result = await embedTexts(
      ["A quick brown fox", "Lazy dog on a rug"],
      { apiKey, batchSize: 2 }
    );
    expect(result.succeeded.length).toBe(2);
    expect(result.failed.length).toBe(0);
    expect(result.succeeded[0]!.embedding.length).toBe(1536);
    expect(result.succeeded[0]!.embedModel).toBe("text-embedding-3-small");
    expect(result.succeeded[0]!.embedDims).toBe(1536);
  });

  it("returns failed list when API key is invalid", async () => {
    const result = await embedTexts(["Hello"], {
      apiKey: "invalid_key_12345",
      maxRetries: 1,
      baseDelayMs: 100,
    });
    expect(result.failed.length).toBe(1);
    expect(result.succeeded.length).toBe(0);
  });
});
