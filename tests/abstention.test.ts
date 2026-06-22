import { describe, expect, it } from "vitest";
import {
  makeInsufficientEvidence,
  preGenerationGate,
  resolveAnswerWithRepair,
  validatePostGeneration,
} from "../src/abstention.js";
import { INSUFFICIENT_EVIDENCE_MESSAGE } from "../src/constants.js";
import type { GroundedAnswer, RetrievedChunk } from "../types/index.js";

const surviving: RetrievedChunk[] = [
  {
    chunk_id: "c-37",
    source: "Structured-Cabling-Standards-Handbook.pdf",
    page: 14,
    text: "The horizontal permanent link is limited to 90 m of solid-conductor cabling.",
    similarity: 0.71,
  },
];

const belowFloor: RetrievedChunk[] = [
  {
    chunk_id: "c-21",
    source: "Structured-Cabling-Standards-Handbook.pdf",
    page: 8,
    text: "General overview of cabling.",
    similarity: 0.21,
  },
];

describe("abstention", () => {
  it("abstains pre-generation when no chunk clears the floor", () => {
    const gate = preGenerationGate(belowFloor, 0.3);
    expect(gate.proceed).toBe(false);
    if (!gate.proceed) {
      expect(gate.result.status).toBe("insufficient_evidence");
      expect(gate.result.citations).toHaveLength(0);
      expect(gate.gate).toBe("relevance");
      expect(gate.topScore).toBe(0.21);
    }
  });

  it("accepts answered output with verified citations", () => {
    const answer: GroundedAnswer = {
      status: "answered",
      answer:
        "The horizontal permanent link is limited to 90 m of solid-conductor cabling.",
      citations: [
        {
          chunk_id: "c-37",
          source: "Structured-Cabling-Standards-Handbook.pdf",
          page: 14,
          snippet: "limited to 90 m of solid-conductor cabling",
        },
      ],
    };

    const result = validatePostGeneration(answer, surviving);
    expect(result.outcome).toBe("accept");
  });

  it("accepts insufficient_evidence with empty citations", () => {
    const answer = makeInsufficientEvidence();
    const result = validatePostGeneration(answer, surviving);
    expect(result.outcome).toBe("accept");
    expect(answer.answer).toBe(INSUFFICIENT_EVIDENCE_MESSAGE);
  });

  it("rejects cross-field violation: insufficient_evidence with citations", () => {
    const answer: GroundedAnswer = {
      status: "insufficient_evidence",
      answer: INSUFFICIENT_EVIDENCE_MESSAGE,
      citations: [
        {
          chunk_id: "c-37",
          source: "Structured-Cabling-Standards-Handbook.pdf",
          page: 14,
          snippet: "limited to 90 m",
        },
      ],
    };

    const result = validatePostGeneration(answer, surviving);
    expect(result.outcome).toBe("abstain");
    if (result.outcome === "abstain") {
      expect(result.gate).toBe("cross_field");
    }
  });

  it("repairs once then downgrades to abstention on persistent citation failure", () => {
    const badAnswer: GroundedAnswer = {
      status: "answered",
      answer: "Incorrect claim about warranty.",
      citations: [
        {
          chunk_id: "c-37",
          source: "Structured-Cabling-Standards-Handbook.pdf",
          page: 14,
          snippet: "warranty period",
        },
      ],
    };

    let repairCalls = 0;
    const resolved = resolveAnswerWithRepair({
      original: badAnswer,
      surviving,
      repair: () => {
        repairCalls += 1;
        return {
          status: "answered",
          answer: "Still wrong.",
          citations: [
            {
              chunk_id: "c-37",
              source: "Structured-Cabling-Standards-Handbook.pdf",
              page: 14,
              snippet: "nonexistent snippet",
            },
          ],
        };
      },
    });

    expect(repairCalls).toBe(1);
    expect(resolved.repairUsed).toBe(true);
    expect(resolved.result.status).toBe("insufficient_evidence");
    expect(resolved.result.citations).toHaveLength(0);
    expect(resolved.gate).toBe("citation");
  });
});
