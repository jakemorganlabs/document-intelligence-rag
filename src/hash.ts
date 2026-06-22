/**
 * Content hash utility — SHA-256 over file bytes.
 *
 * Satisfies: FR-IG-5 (idempotency via content_hash).
 * No async here; caller reads bytes and passes them in.
 */
import { createHash } from "node:crypto";

export function computeContentHash(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}
