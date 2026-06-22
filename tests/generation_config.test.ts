import { describe, expect, it } from "vitest";
import {
  defaultGenerationConfig,
  FORBIDDEN_GENERATION_MODEL_MARKERS,
  GENERATION_MODEL_ID,
  loadGenerationConfig,
} from "../src/generation_config.js";

describe("generation_config", () => {
  it("pins the generation model to Google Gemma", () => {
    expect(defaultGenerationConfig.provider).toBe("google");
    expect(defaultGenerationConfig.model_id).toBe("google/gemma-4-26B-A4B-it");
    expect(GENERATION_MODEL_ID).toBe("google/gemma-4-26B-A4B-it");
  });

  it("does not use Anthropic Claude or Haiku", () => {
    const modelLower = defaultGenerationConfig.model_id.toLowerCase();
    for (const marker of FORBIDDEN_GENERATION_MODEL_MARKERS) {
      expect(modelLower).not.toContain(marker);
    }
    expect(defaultGenerationConfig.provider).not.toBe("anthropic");
  });

  it("rejects Anthropic provider overrides", () => {
    expect(() =>
      loadGenerationConfig({
        provider: "anthropic" as "google",
        model_id: "claude-3-5-haiku-20241022",
      })
    ).toThrow(/provider must be "google"/);
  });

  it("rejects Haiku or Claude model overrides", () => {
    expect(() =>
      loadGenerationConfig({ model_id: "claude-3-5-haiku-20241022" })
    ).toThrow(/must be "google\/gemma-4-26B-A4B-it"/);

    expect(() =>
      loadGenerationConfig({ model_id: "anthropic/claude-3-haiku" })
    ).toThrow(/must be "google\/gemma-4-26B-A4B-it"/);
  });
});
