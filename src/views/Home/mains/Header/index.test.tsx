// @vitest-environment happy-dom
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";

import Header from "@/views/Home/mains/Header";

/** Cờ tắt (vitest không đặt biến) → header y hệt bản deploy cũ, từng class một. */
it("renders the original header classes and no account UI when the flag is off", () => {
  const html = renderToStaticMarkup(
    <Header best={3} soundEnabled onToggleSound={() => undefined} />
  );
  expect(html).toContain(
    `class="${"text-[15px] font-semibold tracking-tight text-[#EAF6FB]"}"`
  );
  expect(html).toContain(
    `class="${"flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5 text-[15px] font-semibold text-[#FFD866]"}"`
  );
  expect(html).toContain(
    `class="${"flex size-11 items-center justify-center rounded-full text-[#8FB3C4] transition-colors hover:bg-white/[0.08] hover:text-[#EAF6FB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD866] focus-visible:ring-offset-2 focus-visible:ring-offset-[#081C29] active:bg-white/[0.14]"}"`
  );
  expect(html).not.toContain("Đăng nhập");
  expect(html.match(/<button/g)).toHaveLength(1);
});
