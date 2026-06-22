/**
 * Generation model configuration (§15, FR-AN-5, NFR-MA-2).
 *
 * This system uses Google Gemma for grounded answer generation.
 * Anthropic models (Claude, Haiku, etc.) are explicitly excluded.
 */
import generationDefaults from "../config/generation.json" with { type: "json" };

export interface GenerationConfig {
  version: string;
  provider: "google";
  model_id: string;
  temperature: number;
  max_tokens: number;
  structured_output: "tool_use";
}

/** Pinned generation model — Google Gemma, not Anthropic. */
export const GENERATION_MODEL_ID = "google/gemma-4-26B-A4B-it" as const;

/** Providers that must NOT be used for generation in this project. */
export const FORBIDDEN_GENERATION_PROVIDERS = ["anthropic"] as const;

/** Model id substrings that must NOT appear in the generation config. */
export const FORBIDDEN_GENERATION_MODEL_MARKERS = [
  "anthropic",
  "claude",
  "haiku",
  "sonnet",
  "opus",
] as const;

export function loadGenerationConfig(
  overrides?: Partial<GenerationConfig>
): GenerationConfig {
  const config: GenerationConfig = {
    ...(generationDefaults as GenerationConfig),
    ...overrides,
  };
  assertGenerationConfig(config);
  return config;
}

export function assertGenerationConfig(config: GenerationConfig): void {
  if (config.provider !== "google") {
    throw new Error(
      `Generation provider must be "google", got "${config.provider}". Anthropic is not supported.`
    );
  }

  if (config.model_id !== GENERATION_MODEL_ID) {
    throw new Error(
      `Generation model must be "${GENERATION_MODEL_ID}", got "${config.model_id}".`
    );
  }

  const modelLower = config.model_id.toLowerCase();
  for (const marker of FORBIDDEN_GENERATION_MODEL_MARKERS) {
    if (modelLower.includes(marker)) {
      throw new Error(
        `Forbidden generation model marker "${marker}" found in model_id "${config.model_id}".`
      );
    }
  }

  if ((FORBIDDEN_GENERATION_PROVIDERS as readonly string[]).includes(config.provider)) {
    throw new Error(`Forbidden generation provider: ${config.provider}`);
  }
}

export const defaultGenerationConfig = loadGenerationConfig();
