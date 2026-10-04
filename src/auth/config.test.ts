import { describe, expect, it } from "vitest";
import { readDuckerConfig } from "@/auth/config";

const full = {
  enabled: "true",
  issuer: "http://localhost:3000",
  clientId: "game-client",
  scope: "openid profile email",
  profilePath: "/profile"
};

describe("readDuckerConfig", () => {
  it("returns the config when the flag is on and every value is set", () => {
    expect(readDuckerConfig(full)).toEqual({
      issuer: "http://localhost:3000",
      clientId: "game-client",
      scope: "openid profile email",
      profileUrl: "http://localhost:3000/profile"
    });
  });
  it.each(["false", "1", "TRUE", "", undefined])(
    "is off when the flag is %s",
    (enabled) => {
      expect(readDuckerConfig({ ...full, enabled })).toBeNull();
    }
  );
  it.each(["issuer", "clientId", "scope", "profilePath"] as const)(
    "is off when %s is missing",
    (key) => {
      expect(readDuckerConfig({ ...full, [key]: undefined })).toBeNull();
      expect(readDuckerConfig({ ...full, [key]: "" })).toBeNull();
    }
  );
  it("is off instead of throwing when the issuer is not a URL", () => {
    expect(readDuckerConfig({ ...full, issuer: "localhost:3000" })).toBeNull();
  });
});
