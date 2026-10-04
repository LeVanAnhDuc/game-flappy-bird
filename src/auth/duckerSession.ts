// types
import type { AuthSnapshot, CallbackResult, DuckerConfig } from "./types";
// requests
import { exchangeCode, fetchProfile } from "./duckerRequests";
// others
import { DUCKER_CONFIG } from "./config";
import { capturedCallback, startLogin } from "./duckerAuth";

const IDLE: AuthSnapshot = { status: "idle", profile: null };
const SIGNED_OUT: AuthSnapshot = { status: "signed-out", profile: null };

let snapshot: AuthSnapshot = IDLE;
let started = false;
const listeners = new Set<() => void>();

function set(next: AuthSnapshot): void {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): AuthSnapshot {
  return snapshot;
}

/** HTML tĩnh của Next không biết gì về phiên — lần render đầu luôn là idle. */
export function getServerSnapshot(): AuthSnapshot {
  return IDLE;
}

/**
 * Đổi code → profile đúng MỘT lần mỗi lần mở trang (StrictMode, remount đều an toàn).
 * Mọi lỗi chỉ hạ về signed-out: đăng nhập là tính năng cộng thêm, không phải cổng chặn.
 */
export function startSession(
  config: DuckerConfig | null = DUCKER_CONFIG,
  callback: CallbackResult | null = capturedCallback()
): void {
  if (started || !config) return;
  started = true;
  if (!callback || callback.error || !callback.code || !callback.verifier) {
    set(SIGNED_OUT);
    return;
  }
  set({ status: "loading", profile: null });
  exchangeCode(config, callback.code, callback.verifier)
    .then((tokens) => fetchProfile(config, tokens.accessToken))
    .then(
      (profile) => set({ status: "signed-in", profile }),
      () => set(SIGNED_OUT)
    );
}

export function signIn(): void {
  if (!DUCKER_CONFIG) return;
  startLogin(DUCKER_CONFIG).catch(() => {
    // im lặng: đăng nhập là tính năng tùy chọn
  });
}

/** Quên profile trong bộ nhớ. Phiên ở Ducker ID vẫn còn — đúng nghĩa SSO. */
export function signOut(): void {
  set(SIGNED_OUT);
}

export function resetSessionForTests(): void {
  snapshot = IDLE;
  started = false;
  listeners.clear();
}

if (typeof window !== "undefined") startSession();
