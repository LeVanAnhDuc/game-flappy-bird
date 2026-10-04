// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { exchangeCode, fetchProfile } from "@/auth/duckerRequests";

const config = {
  issuer: "http://localhost:3000",
  clientId: "game-client",
  scope: "openid",
  profileUrl: "http://localhost:3000/profile"
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

describe("duckerRequests", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("posts the token form without a client_secret and with a timeout signal", async () => {
    fetchMock.mockResolvedValue(json({ access_token: "at" }));
    await expect(exchangeCode(config, "c1", "v1")).resolves.toEqual({
      accessToken: "at"
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("http://localhost:3000/oauth/token");
    expect(init.method).toBe("POST");
    const body = init.body as URLSearchParams;
    expect(Object.fromEntries(body)).toEqual({
      grant_type: "authorization_code",
      code: "c1",
      code_verifier: "v1",
      redirect_uri: expect.stringMatching(/^https?:\/\/[^/]+\/$/),
      client_id: "game-client"
    });
    expect(body.has("client_secret")).toBe(false);
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("sends the bearer to userinfo with a timeout signal", async () => {
    fetchMock.mockResolvedValue(json({ sub: "u1" }));
    await expect(fetchProfile(config, "at")).resolves.toEqual({ sub: "u1" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("http://localhost:3000/oauth/userinfo");
    expect(init.headers.Authorization).toBe("Bearer at");
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("rejects a malformed userinfo body", async () => {
    fetchMock.mockResolvedValue(json(null));
    await expect(fetchProfile(config, "at")).rejects.toThrow(
      "userinfo_invalid"
    );
    fetchMock.mockResolvedValue(json({ sub: "u1", name: 5 }));
    await expect(fetchProfile(config, "at")).rejects.toThrow(
      "userinfo_invalid"
    );
    fetchMock.mockResolvedValue(json({ sub: "" }));
    await expect(fetchProfile(config, "at")).rejects.toThrow(
      "userinfo_invalid"
    );
    fetchMock.mockResolvedValue(json({ sub: "u1" }));
    await expect(fetchProfile(config, "at")).resolves.toEqual({ sub: "u1" });
  });

  it("throws on a non-ok response", async () => {
    fetchMock.mockResolvedValue(json({}, 400));
    await expect(exchangeCode(config, "c", "v")).rejects.toThrow(
      "token_exchange_failed_400"
    );
    fetchMock.mockResolvedValue(json({}, 401));
    await expect(fetchProfile(config, "at")).rejects.toThrow(
      "userinfo_failed_401"
    );
  });

  it("throws when a 200 response has no string access_token", async () => {
    fetchMock.mockResolvedValue(json({ token_type: "Bearer" }));
    await expect(exchangeCode(config, "c", "v")).rejects.toThrow();
    fetchMock.mockResolvedValue(json({ access_token: 5 }));
    await expect(exchangeCode(config, "c", "v")).rejects.toThrow();
  });
});
