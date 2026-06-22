/**
 * PDF/Text extractor sidecar integration tests.
 *
 * Satisfies: FR-IG-1 (document ingestion), FR-IG-2 (page-tagging).
 */
import { describe, it, expect } from "vitest";
import { extractFile } from "../src/pdf_extractor.js";
import { resolve } from "node:path";

const FIXTURE_DIR = resolve(process.cwd(), "fixtures", "smoke_pdfs");

describe("extractFile", () => {
  it("extracts a multi-page PDF with page boundaries", async () => {
    const path = resolve(FIXTURE_DIR, "smoke_01_guidelines.pdf");
    const result = await extractFile(path);
    expect(result.source).toBe("smoke_01_guidelines.pdf");
    expect(result.page_count).toBeGreaterThan(0);
    expect(result.pages.length).toBe(result.page_count);
    expect(result.pages[0]!.text.length).toBeGreaterThan(0);
    expect(result.pages[0]!.char_start).toBe(0);
    expect(result.pages[0]!.char_end).toBeGreaterThan(0);
  });

  it("extracts text preserving page order", async () => {
    const path = resolve(FIXTURE_DIR, "smoke_03_procedures.pdf");
    const result = await extractFile(path);
    expect(result.pages[0]!.page).toBe(1);
  });

  it("throws on non-existent file", async () => {
    await expect(extractFile("/nonexistent/file.pdf")).rejects.toThrow();
  });
});
