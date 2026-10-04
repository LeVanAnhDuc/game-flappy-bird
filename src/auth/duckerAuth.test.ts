// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  captureCallback,
  capturedCallback,
  consumeCallback,
  isSafeReturnTo,
  resetCaptureForTests,
  settleCallbackUrl,
  startLogin
} from "@/auth/duckerAuth";

const config = {
  issuer: "http://localhost:3000",
  clientId: "game-client",
  scope: "openid profile email",
  profileUrl: "http://localhost:3000/profile"
};

describe("consumeCallback", () => {
  beforeEach(() => sessionStorage.clear());

  it("returns null and leaves the URL alone when there is no callback", () => {
    window.history.replaceState(null, "", "/?level=3");
    expect(consumeCallback()).toBeNull();
    expect(window.location.search).toBe("?level=3");
  });

  it("returns code + verifier + returnTo when state matches, and strips only OAuth params", () => {
    sessionStorage.setItem(
      "ducker.pkce",
      JSON.stringify({ state: "s1", verifier: "v1", returnTo: "/?level=3" })
    );
    window.history.replaceState(null, "", "/?level=3&code=c1&state=s1&iss=x");
    expect(consumeCallback()).toEqual({
      code: "c1",
      verifier: "v1",
      returnTo: "/?level=3"
    });
    expect(window.location.search).toBe("?level=3");
    expect(sessionStorage.getItem("ducker.pkce")).toBeNull();
  });

  it("reports state_mismatch (without returnTo) when the state differs", () => {
    sessionStorage.setItem(
      "ducker.pkce",
      JSON.stringify({ state: "s1", verifier: "v1", returnTo: "/" })
    );
    window.history.replaceState(null, "", "/?code=c1&state=evil");
    expect(consumeCallback()).toEqual({ error: "state_mismatch" });
    expect(window.location.search).toBe("");
  });

  it("reports state_mismatch when there is no pending entry (other tab)", () => {
    window.history.replaceState(null, "", "/?code=c1&state=s1");
    expect(consumeCallback()).toEqual({ error: "state_mismatch" });
  });

  it("passes the IdP error through and cleans the URL", () => {
    window.history.replaceState(
      null,
      "",
      "/?error=access_denied&error_description=no&state=s1"
    );
    expect(consumeCallback()).toEqual({
      error: "access_denied",
      returnTo: undefined
    });
    expect(window.location.search).toBe("");
  });

  it("IdP error returns returnTo", () => {
    sessionStorage.setItem(
      "ducker.pkce",
      JSON.stringify({ state: "s1", verifier: "v1", returnTo: "/?x=1" })
    );
    window.history.replaceState(null, "", "/?error=access_denied&state=s1");
    expect(consumeCallback()).toEqual({
      error: "access_denied",
      returnTo: "/?x=1"
    });
  });

  it("drops an unsafe returnTo", () => {
    sessionStorage.setItem(
      "ducker.pkce",
      JSON.stringify({
        state: "s1",
        verifier: "v1",
        returnTo: "//evil.example/x"
      })
    );
    window.history.replaceState(null, "", "/?code=c1&state=s1");
    expect(consumeCallback()?.returnTo).toBeUndefined();
  });
});

describe("isSafeReturnTo", () => {
  it.each([
    ["/", true],
    ["/?a=1", true],
    ["//evil.com", false],
    ["/\\evil", false],
    ["https://evil.com", false],
    ["", false],
    [undefined, false],
    [42, false]
  ])("%s -> %s", (value, expected) => {
    expect(isSafeReturnTo(value)).toBe(expected);
  });
});

describe("captureCallback", () => {
  beforeEach(() => {
    sessionStorage.clear();
    resetCaptureForTests();
  });

  it("restores returnTo once and a second call is a no-op", () => {
    sessionStorage.setItem(
      "ducker.pkce",
      JSON.stringify({ state: "s1", verifier: "v1", returnTo: "/?level=2" })
    );
    window.history.replaceState(null, "", "/?code=c1&state=s1");
    captureCallback();
    expect(window.location.search).toBe("?level=2");
    expect(capturedCallback()?.code).toBe("c1");

    window.history.replaceState(null, "", "/?other=1");
    captureCallback();
    expect(window.location.search).toBe("?other=1");
    expect(capturedCallback()?.code).toBe("c1");
  });
});

describe("settleCallbackUrl", () => {
  beforeEach(() => {
    sessionStorage.clear();
    resetCaptureForTests();
  });

  it("restores the clean URL when it was re-polluted after capture", () => {
    sessionStorage.setItem(
      "ducker.pkce",
      JSON.stringify({ state: "s1", verifier: "v1", returnTo: "/?level=2" })
    );
    window.history.replaceState(null, "", "/?code=c1&state=s1");
    captureCallback();
    window.history.replaceState(null, "", "/?level=2&code=c1&state=s1");
    settleCallbackUrl();
    expect(window.location.search).toBe("?level=2");
  });

  it("is one-shot: a second call is a no-op even if the URL changed", () => {
    sessionStorage.setItem(
      "ducker.pkce",
      JSON.stringify({ state: "s1", verifier: "v1", returnTo: "/?level=2" })
    );
    window.history.replaceState(null, "", "/?code=c1&state=s1");
    captureCallback();
    settleCallbackUrl();
    window.history.replaceState(null, "", "/?level=9");
    settleCallbackUrl();
    expect(window.location.search).toBe("?level=9");
  });

  it("is a no-op when there was no callback", () => {
    window.history.replaceState(null, "", "/?level=2");
    captureCallback();
    window.history.replaceState(null, "", "/?level=5");
    settleCallbackUrl();
    expect(window.location.search).toBe("?level=5");
  });
});

describe("startLogin", () => {
  const assign = vi.fn();
  beforeEach(() => {
    assign.mockReset();
    sessionStorage.clear();
    resetCaptureForTests();
    vi.stubGlobal("location", {
      ...window.location,
      assign,
      origin: "http://localhost:4301",
      pathname: "/",
      search: "?level=2"
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("stores the pending entry and redirects to /oauth/authorize with PKCE", async () => {
    await startLogin(config);
    const pending = JSON.parse(sessionStorage.getItem("ducker.pkce")!);
    expect(pending.returnTo).toBe("/?level=2");
    const url = new URL(assign.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe(
      "http://localhost:3000/oauth/authorize"
    );
    expect(url.searchParams.get("client_id")).toBe("game-client");
    expect(url.searchParams.get("redirect_uri")).toBe("http://localhost:4301/");
    expect(url.searchParams.get("scope")).toBe("openid profile email");
    expect(url.searchParams.get("state")).toBe(pending.state);
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("code_challenge")).toMatch(
      /^[A-Za-z0-9_-]{43}$/
    );
  });

  it("ignores a second call while the first is in flight", async () => {
    await Promise.all([startLogin(config), startLogin(config)]);
    expect(assign).toHaveBeenCalledTimes(1);
  });

  it("does nothing when sessionStorage throws, and allows a retry", async () => {
    const real = window.sessionStorage;
    vi.stubGlobal("sessionStorage", {
      getItem: () => null,
      removeItem: () => undefined,
      setItem: () => {
        throw new Error("blocked");
      }
    });
    await startLogin(config);
    expect(assign).not.toHaveBeenCalled();
    vi.stubGlobal("sessionStorage", real);
    await startLogin(config);
    expect(assign).toHaveBeenCalledTimes(1);
  });

  it("removes the pending entry when the start fails after writing it", async () => {
    const digest = vi
      .spyOn(crypto.subtle, "digest")
      .mockRejectedValueOnce(new Error("boom"));
    await expect(startLogin(config)).rejects.toThrow("boom");
    digest.mockRestore();
    expect(sessionStorage.getItem("ducker.pkce")).toBeNull();
    expect(assign).not.toHaveBeenCalled();
    await startLogin(config);
    expect(assign).toHaveBeenCalledTimes(1);
  });

  it("works again after a bfcache restore (pageshow persisted)", async () => {
    await startLogin(config);
    await startLogin(config);
    expect(assign).toHaveBeenCalledTimes(1);
    const event = new Event("pageshow");
    Object.defineProperty(event, "persisted", { value: true });
    window.dispatchEvent(event);
    await startLogin(config);
    expect(assign).toHaveBeenCalledTimes(2);
  });
});
