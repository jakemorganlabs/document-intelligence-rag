/**
 * Generation model configuration (§15, FR-AN-5, NFR-MA-2).
 *
 * This system uses Google Gemma for grounded answer generation.
 * Provider is hard-coded to "google"; the model id is pinned and validated.
 */
import generationDefaults from "../config/generation.json" with { type: "json" };

export interface GenerationConfig {
  version: string;
  provider: "google";
  model_id: string;
  temperature: number;
  max_tokens: number;
  structured_output: "json_mode";
}

/** Pinned generation model — Google Gemma. */
export const GENERATION_MODEL_ID = "google/gemma-4-26B-A4B-it" as const;

/** Valid provider ids. */
export const VALID_GENERATION_PROVIDERS = ["google"] as const;

/** Valid model id prefixes. */
export const VALID_GENERATION_MODEL_PREFIXES = ["google/gemma"] as const;

export function loadGenerationConfig(
  overrides?: Partial<GenerationConfig>
): GenerationConfig {
  const config: GenerationConfig = {
    ...(generationDefaults as unknown as GenerationConfig),
    ...overrides,
  };
  assertGenerationConfig(config);
  return config;
}

export function assertGenerationConfig(config: GenerationConfig): void {
  if (config.provider !== "google") {
    throw new Error(
      `Generation provider must be "google", got "${config.provider}".`
    );
  }

  if (config.model_id !== GENERATION_MODEL_ID) {
    throw new Error(
      `Generation model must be "${GENERATION_MODEL_ID}", got "${config.model_id}".`
    );
  }

  const modelLower = config.model_id.toLowerCase();
  let hasValidPrefix = false;
  for (const prefix of VALID_GENERATION_MODEL_PREFIXES) {
    if (modelLower.startsWith(prefix)) {
      hasValidPrefix = true;
      break;
    }
  }
  if (!hasValidPrefix) {
    throw new Error(
      `Generation model must start with one of ${JSON.stringify(VALID_GENERATION_MODEL_PREFIXES)}, got "${config.model_id}".`
    );
  }

  if (!VALID_GENERATION_PROVIDERS.includes(config.provider)) {
    throw new Error(`Invalid generation provider: ${config.provider}`);
  }
}

export const defaultGenerationConfig = loadGenerationConfig();
