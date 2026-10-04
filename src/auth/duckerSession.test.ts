// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";

const requests = vi.hoisted(() => ({
  exchangeCode: vi.fn(),
  fetchProfile: vi.fn()
}));
vi.mock("@/auth/duckerRequests", () => requests);

import {
  getSnapshot,
  resetSessionForTests,
  signOut,
  startSession,
  subscribe
} from "@/auth/duckerSession";

const config = {
  issuer: "http://localhost:3000",
  clientId: "c",
  scope: "openid",
  profileUrl: "http://localhost:3000/profile"
};
const ok = { code: "c1", verifier: "v1", returnTo: "/" };

describe("duckerSession", () => {
  beforeEach(() => {
    resetSessionForTests();
    requests.exchangeCode.mockReset();
    requests.fetchProfile.mockReset();
  });

  it("stays idle when the feature is disabled", () => {
    startSession(null, ok);
    expect(getSnapshot().status).toBe("idle");
  });

  it("is signed-out when there is no callback", () => {
    startSession(config, null);
    expect(getSnapshot().status).toBe("signed-out");
  });

  it("exchanges once even if started twice, then signs in", async () => {
    requests.exchangeCode.mockResolvedValue({ accessToken: "t" });
    requests.fetchProfile.mockResolvedValue({ sub: "u1", name: "Đức" });
    const seen: string[] = [];
    subscribe(() => seen.push(getSnapshot().status));
    startSession(config, ok);
    startSession(config, ok);
    await vi.waitFor(() => expect(getSnapshot().status).toBe("signed-in"));
    expect(requests.exchangeCode).toHaveBeenCalledTimes(1);
    expect(seen).toEqual(["loading", "signed-in"]);
    expect(getSnapshot().profile?.name).toBe("Đức");
  });

  it("falls back to signed-out when the exchange fails", async () => {
    requests.exchangeCode.mockRejectedValue(
      new Error("token_exchange_failed_400")
    );
    startSession(config, ok);
    await vi.waitFor(() => expect(getSnapshot().status).toBe("signed-out"));
  });

  it("is signed-out on an IdP error without calling the network", () => {
    startSession(config, { error: "access_denied" });
    expect(getSnapshot().status).toBe("signed-out");
    expect(requests.exchangeCode).not.toHaveBeenCalled();
  });

  it("signOut forgets the profile", async () => {
    requests.exchangeCode.mockResolvedValue({ accessToken: "t" });
    requests.fetchProfile.mockResolvedValue({ sub: "u1" });
    startSession(config, ok);
    await vi.waitFor(() => expect(getSnapshot().status).toBe("signed-in"));
    signOut();
    expect(getSnapshot()).toEqual({ status: "signed-out", profile: null });
  });
});
