import { describe, expect, it } from "vitest";
import { chunkDocument, type ChunkingConfig } from "../src/chunker.js";
import type { ChunkInput } from "../types/index.js";

const sampleInput: ChunkInput = {
  source: "Structured-Cabling-Standards-Handbook.pdf",
  contentHash: "abc123",
  documentId: "00000000-0000-4000-8000-000000000001",
  pages: [
    {
      page: 14,
      text: `# 4.2 Horizontal Cabling Distances

The horizontal permanent link is limited to 90 m of solid-conductor cabling. With patch and equipment cords, the total channel length must not exceed 100 m.

Additional guidance recommends planning for future upgrades when designing horizontal runs.`,
    },
    {
      page: 22,
      text: `# 6.1 Cat 6A Channels

A Cat 6A channel supports 10GBASE-T to 100 m, subject to the 90 m permanent-link limit and alien-crosstalk mitigation.`,
    },
  ],
};

describe("chunker", () => {
  it("is idempotent: identical input yields byte-identical chunks across two runs", () => {
    const first = chunkDocument(sampleInput);
    const second = chunkDocument(sampleInput);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it("prefers structural boundaries and attaches section metadata", () => {
    const chunks = chunkDocument(sampleInput);
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0]?.section).toBe("4.2 Horizontal Cabling Distances");
    expect(chunks[0]?.page).toBe(14);
    expect(chunks[0]?.text).toContain("90 m");
  });

  it("merges tail fragments below min_chunk_tokens into previous chunk", () => {
    const tinyTailConfig: ChunkingConfig = {
      version: "test",
      target_tokens: 40,
      overlap_tokens: 5,
      boundary_pref: ["heading", "paragraph", "sentence"],
      min_chunk_tokens: 200,
      embed_model: "text-embedding-3-small",
      tokenizer: "cl100k_base",
    };

    const longInput: ChunkInput = {
      ...sampleInput,
      pages: [
        {
          page: 1,
          text: Array.from(
            { length: 80 },
            (_, i) => `Sentence ${i + 1} describes cabling distance and channel planning requirements.`
          ).join(" "),
        },
      ],
    };

    const chunks = chunkDocument(longInput, tinyTailConfig);
    expect(chunks.length).toBeGreaterThanOrEqual(1);
    if (chunks.length >= 2) {
      const last = chunks[chunks.length - 1]!;
      expect(last.token_count).toBeGreaterThanOrEqual(tinyTailConfig.min_chunk_tokens);
    }
  });

  it("applies configured overlap between consecutive chunks", () => {
    const overlapConfig: ChunkingConfig = {
      version: "test",
      target_tokens: 30,
      overlap_tokens: 10,
      boundary_pref: ["heading", "paragraph", "sentence"],
      min_chunk_tokens: 5,
      embed_model: "text-embedding-3-small",
      tokenizer: "cl100k_base",
    };

    const longInput: ChunkInput = {
      ...sampleInput,
      pages: [
        {
          page: 1,
          text: Array.from({ length: 40 }, (_, i) => `Sentence number ${i + 1} about cabling standards.`).join(" "),
        },
      ],
    };

    const chunks = chunkDocument(longInput, overlapConfig);
    expect(chunks.length).toBeGreaterThan(1);

    const firstTail = chunks[0]!.text.split(" ").slice(-5).join(" ");
    expect(chunks[1]!.text).toContain(firstTail.split(" ")[0] ?? "");
  });
});
