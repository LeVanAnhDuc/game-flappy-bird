// types
import type { DuckerConfig, DuckerProfile } from "./types";
// others
import { redirectUri } from "./duckerAuth";

const REQUEST_TIMEOUT_MS = 15_000;

/** Đổi code lấy token. Public client — không có client_secret. */
export async function exchangeCode(
  config: DuckerConfig,
  code: string,
  verifier: string
): Promise<{ accessToken: string }> {
  const response = await fetch(new URL("/oauth/token", config.issuer), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      code_verifier: verifier,
      redirect_uri: redirectUri(),
      client_id: config.clientId
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  });
  if (!response.ok) throw new Error(`token_exchange_failed_${response.status}`);
  const data = (await response.json()) as { access_token?: unknown };
  if (typeof data.access_token !== "string" || !data.access_token) {
    throw new Error("token_exchange_no_access_token");
  }
  return { accessToken: data.access_token };
}

const optionalString = (value: unknown): boolean =>
  value === undefined || value === null || typeof value === "string";

function isProfile(data: unknown): data is DuckerProfile {
  if (typeof data !== "object" || data === null) return false;
  const p = data as Record<string, unknown>;
  return (
    typeof p.sub === "string" &&
    p.sub.length > 0 &&
    optionalString(p.name) &&
    optionalString(p.email) &&
    optionalString(p.picture) &&
    (p.email_verified === undefined || typeof p.email_verified === "boolean")
  );
}

export async function fetchProfile(
  config: DuckerConfig,
  accessToken: string
): Promise<DuckerProfile> {
  const response = await fetch(new URL("/oauth/userinfo", config.issuer), {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  });
  if (!response.ok) throw new Error(`userinfo_failed_${response.status}`);
  const data: unknown = await response.json();
  if (!isProfile(data)) throw new Error("userinfo_invalid");
  return {
    ...data,
    name: data.name ?? undefined,
    email: data.email ?? undefined,
    picture: data.picture ?? undefined
  };
}
