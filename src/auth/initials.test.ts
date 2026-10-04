import { expect, it } from "vitest";
import { initialOf } from "@/auth/initials";

it.each([
  [{ sub: "1", name: "đức lê" }, "Đ"],
  [{ sub: "1", name: "  ", email: "an@x.vn" }, "A"],
  [{ sub: "1", email: "zed@x.vn" }, "Z"],
  [{ sub: "1" }, "?"]
])("initialOf(%o) = %s", (profile, expected) => {
  expect(initialOf(profile)).toBe(expected);
});
