// types
import type { DuckerProfile } from "./types";

/** Chữ cái đầu của tên (hoặc email) cho avatar khi không có ảnh. */
export function initialOf(profile: DuckerProfile): string {
  const source = profile.name?.trim() || profile.email?.trim() || "";
  return source ? source[0].toLocaleUpperCase("vi") : "?";
}
