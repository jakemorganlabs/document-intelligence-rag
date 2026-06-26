import { describe, expect, it, vi } from "vitest";
import { sendSlackAlert } from "../src/alerts.js";

describe("Slack alert adapter", () => {
  it("dry-runs when SLACK_WEBHOOK_URL is not set", async () => {
    delete process.env.SLACK_WEBHOOK_URL;
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await sendSlackAlert({ stage: "ingest", error: "test error", itemType: "document" });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[ALERT-DRY-RUN]")
    );
    consoleSpy.mockRestore();
  });

  it("sends a POST to the webhook when URL is set", async () => {
    process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/FAKE/FAKE/FAKE";

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
    } as Response);

    await sendSlackAlert({
      stage: "query",
      error: "Generation timeout",
      itemType: "query",
      traceId: "abc-123",
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe(process.env.SLACK_WEBHOOK_URL);
    expect(init?.method).toBe("POST");
    expect(init?.headers).toEqual({ "Content-Type": "application/json" });

    const body = JSON.parse(init?.body as string);
    expect(body.text).toContain("query");
    expect(body.blocks[1].fields[2].text).toContain("abc-123");

    fetchSpy.mockRestore();
    delete process.env.SLACK_WEBHOOK_URL;
  });

  it("throws when Slack returns non-OK", async () => {
    process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/FAKE/FAKE/FAKE";

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    } as Response);

    await expect(
      sendSlackAlert({ stage: "ingest", error: "fail", itemType: "document" })
    ).rejects.toThrow("Slack alert failed: 500");

    fetchSpy.mockRestore();
    delete process.env.SLACK_WEBHOOK_URL;
  });
});
