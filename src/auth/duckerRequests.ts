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

export async function fetchProfile(
  config: DuckerConfig,
  accessToken: string
): Promise<DuckerProfile> {
  const response = await fetch(new URL("/oauth/userinfo", config.issuer), {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  });
  if (!response.ok) throw new Error(`userinfo_failed_${response.status}`);
  return (await response.json()) as DuckerProfile;
}
