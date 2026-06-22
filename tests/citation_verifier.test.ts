import { describe, expect, it } from "vitest";
import {
  normalizeText,
  verifyAllCitations,
  verifyCitation,
} from "../src/citation_verifier.js";
import type { Citation, RetrievedChunk } from "../types/index.js";

const retrieved: RetrievedChunk[] = [
  {
    chunk_id: "c-37",
    source: "Structured-Cabling-Standards-Handbook.pdf",
    page: 14,
    text: "The horizontal permanent link is limited to 90 m of solid-conductor cabling.",
    similarity: 0.71,
  },
];

describe("citation_verifier", () => {
  it("verifies a valid citation", () => {
    const citation: Citation = {
      chunk_id: "c-37",
      source: "Structured-Cabling-Standards-Handbook.pdf",
      page: 14,
      snippet: "limited to 90 m of solid-conductor cabling",
    };

    const result = verifyCitation(citation, retrieved);
    expect(result.verified).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it("rejects snippet not present in chunk text", () => {
    const citation: Citation = {
      chunk_id: "c-37",
      source: "Structured-Cabling-Standards-Handbook.pdf",
      page: 14,
      snippet: "warranty period of five years",
    };

    const result = verifyCitation(citation, retrieved);
    expect(result.verified).toBe(false);
    expect(result.reasons[0]).toContain("snippet not present");
  });

  it("rejects chunk_id not in retrieved set", () => {
    const citation: Citation = {
      chunk_id: "c-99",
      source: "Structured-Cabling-Standards-Handbook.pdf",
      page: 14,
      snippet: "limited to 90 m",
    };

    const result = verifyCitation(citation, retrieved);
    expect(result.verified).toBe(false);
    expect(result.reasons[0]).toContain("not in retrieved set");
  });

  it("matches whitespace variants after normalization", () => {
    const dirtyChunk: RetrievedChunk[] = [
      {
        chunk_id: "c-dirty",
        source: "doc.pdf",
        page: 1,
        text: "limited\u00A0to\u200990\u200Bm\u200Bof\u200Bsolid-conductor\tcabling",
        similarity: 0.8,
      },
    ];

    const citation: Citation = {
      chunk_id: "c-dirty",
      source: "doc.pdf",
      page: 1,
      snippet: "limited to 90 m of solid-conductor cabling",
    };

    expect(verifyCitation(citation, dirtyChunk).verified).toBe(true);
  });

  it("folds smart quotes to straight quotes", () => {
    const quotedChunk: RetrievedChunk[] = [
      {
        chunk_id: "c-quote",
        source: "doc.pdf",
        page: 2,
        text: "The spec says \u201Cmaximum 100 m\u201D for channels.",
        similarity: 0.66,
      },
    ];

    const citation: Citation = {
      chunk_id: "c-quote",
      source: "doc.pdf",
      page: 2,
      snippet: '"maximum 100 m" for channels',
    };

    expect(verifyCitation(citation, quotedChunk).verified).toBe(true);
  });

  it("handles Unicode NFC normalization edge cases", () => {
    const composed = "caf\u00E9"; // é as single codepoint
    const decomposed = "caf\u0065\u0301"; // e + combining acute

    expect(normalizeText(composed)).toBe(normalizeText(decomposed));

    const chunk: RetrievedChunk[] = [
      {
        chunk_id: "c-unicode",
        source: "doc.pdf",
        page: 3,
        text: `Serving ${composed} standards internationally.`,
        similarity: 0.55,
      },
    ];

    const citation: Citation = {
      chunk_id: "c-unicode",
      source: "doc.pdf",
      page: 3,
      snippet: `Serving ${decomposed} standards internationally.`,
    };

    expect(verifyAllCitations([citation], chunk).verified).toBe(true);
  });
});
