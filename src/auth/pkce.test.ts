import { describe, expect, it } from "vitest";
import { challengeOf, randomUrlSafeToken } from "@/auth/pkce";

describe("pkce", () => {
  it("matches the RFC 7636 appendix B vector", async () => {
    expect(
      await challengeOf("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")
    ).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  });

  it("makes base64url verifiers that are at least 43 chars and unique", () => {
    const tokens = new Set(Array.from({ length: 20 }, randomUrlSafeToken));
    expect(tokens.size).toBe(20);
    for (const token of tokens) {
      expect(token).toMatch(/^[A-Za-z0-9_-]{43,}$/);
    }
  });
});
