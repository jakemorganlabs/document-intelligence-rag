import { describe, expect, it, vi } from "vitest";
import { retrieveChunks } from "../src/retriever.js";
import * as db from "../src/db.js";
import * as embedder from "../src/embedder.js";
import type { PoolClient } from "pg";

vi.mock("../src/db.js", () => ({
  annSearch: vi.fn(),
  getClient: vi.fn(),
}));

vi.mock("../src/embedder.js", () => ({
  embedTexts: vi.fn(),
  getEmbeddingConfigFromEnv: vi.fn(() => ({
    apiKey: "test-key",
    model: "text-embedding-3-small",
    provider: "openai",
  })),
}));

const mockClient = {
  release: vi.fn(),
} as unknown as PoolClient;

describe("retriever", () => {
  it("embeds query and returns retrieved chunks with similarity scores", async () => {
    vi.mocked(embedder.embedTexts).mockResolvedValue({
      succeeded: [
        {
          text: "test question",
          embedding: [0.1, 0.2, 0.3],
          embedModel: "text-embedding-3-small",
          embedDims: 1536,
          embeddedAt: new Date().toISOString(),
        },
      ],
      failed: [],
    });

    vi.mocked(db.annSearch).mockResolvedValue([
      {
        chunk_id: "c-1",
        source: "doc.pdf",
        page: 1,
        text: "relevant text",
        similarity: 0.82,
      },
      {
        chunk_id: "c-2",
        source: "doc.pdf",
        page: 2,
        text: "less relevant text",
        similarity: 0.45,
      },
    ]);

    const result = await retrieveChunks({
      question: "test question",
      client: mockClient,
    });

    expect(result.chunks).toHaveLength(2);
    expect(result.topScore).toBe(0.82);
    expect(result.chunks[0]!.chunk_id).toBe("c-1");
    expect(result.chunks[0]!.similarity).toBe(0.82);
  });

  it("throws when embedding fails", async () => {
    vi.mocked(embedder.embedTexts).mockResolvedValue({
      succeeded: [],
      failed: ["test question"],
    });

    await expect(
      retrieveChunks({ question: "test question", client: mockClient })
    ).rejects.toThrow("Query embedding failed");
  });
});
