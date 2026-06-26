import { describe, expect, it } from "vitest";
import { verifyHmac, signHmac } from "../src/auth.js";

describe("HMAC auth", () => {
  const secret = "test-secret-123";

  it("accepts a valid signature", () => {
    const body = JSON.stringify({ question: "What is the max link length?" });
    const now = Math.floor(Date.now() / 1000);
    const signature = signHmac(secret, now, body);

    const result = verifyHmac({ timestamp: String(now), signature, body, secret });
    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it("rejects a tampered body", () => {
    const body = JSON.stringify({ question: "What is the max link length?" });
    const now = Math.floor(Date.now() / 1000);
    const signature = signHmac(secret, now, body);

    const result = verifyHmac({
      timestamp: String(now),
      signature,
      body: JSON.stringify({ question: "tampered" }),
      secret,
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("signature_mismatch");
  });

  it("rejects an expired timestamp", () => {
    const body = JSON.stringify({ question: "test" });
    const old = Math.floor(Date.now() / 1000) - 400; // > 5 minutes ago
    const signature = signHmac(secret, old, body);

    const result = verifyHmac({ timestamp: String(old), signature, body, secret });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("timestamp_expired");
  });

  it("rejects a missing secret:", () => {
    const body = JSON.stringify({ question: "test" });
    const now = Math.floor(Date.now() / 1000);

    const result = verifyHmac({ timestamp: String(now), signature: "abc", body, secret: "" });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("missing_auth_header");
  });

  it("rejects signature with wrong secret", () => {
    const body = JSON.stringify({ question: "test" });
    const now = Math.floor(Date.now() / 1000);
    const signature = signHmac(secret, now, body);

    const result = verifyHmac({ timestamp: String(now), signature, body, secret: "wrong" });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("signature_mismatch");
  });
});
