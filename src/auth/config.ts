// types
import type { DuckerConfig, DuckerEnv } from "./types";

export const DUCKER_PKCE_KEY = "ducker.pkce";

/**
 * Đăng nhập Ducker ID chỉ bật khi cờ = "true" VÀ đủ cả 4 giá trị.
 * Không có giá trị mặc định nào ở đây: thiếu là tắt, không đoán.
 */
export function readDuckerConfig(raw: DuckerEnv): DuckerConfig | null {
  if (raw.enabled !== "true") return null;
  const { issuer, clientId, scope, profilePath } = raw;
  if (!issuer || !clientId || !scope || !profilePath) return null;
  if (!/^https?:\/\//.test(issuer)) return null; // "localhost:3000" là URL hợp lệ với scheme "localhost:" — chặn
  try {
    return {
      issuer: new URL(issuer).origin,
      clientId,
      scope,
      profileUrl: new URL(profilePath, issuer).toString()
    };
  } catch {
    return null; // issuer sai định dạng → coi như chưa cấu hình, game vẫn chạy
  }
}

// Next đọc theo tên literal để inline lúc build — đây là nơi DUY NHẤT đọc các biến này.
export const DUCKER_CONFIG = readDuckerConfig({
  enabled: process.env.NEXT_PUBLIC_FEATURE_DUCKER_SIGN_IN,
  issuer: process.env.NEXT_PUBLIC_DUCKER_ISSUER,
  clientId: process.env.NEXT_PUBLIC_DUCKER_CLIENT_ID,
  scope: process.env.NEXT_PUBLIC_DUCKER_SCOPE,
  profilePath: process.env.NEXT_PUBLIC_DUCKER_PROFILE_PATH
});

/** Gốc app — redirect_uri phải khớp tuyệt đối với URI đã đăng ký ở Ducker ID. */
export function appRootPath(): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH;
  return base ? `${base}/` : "/";
}
