import { expect, test } from "@playwright/test";

import { gotoGame } from "./helpers";

test("flag off: no sign-in button and no request to any outside origin", async ({
  page,
  baseURL
}) => {
  const outside: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (
      url.protocol.startsWith("http") &&
      url.origin !== new URL(baseURL!).origin
    ) {
      outside.push(request.url());
    }
  });
  await gotoGame(page);
  await expect(page.getByRole("button", { name: "Đăng nhập" })).toHaveCount(0);
  await expect(page.getByTestId("btn-ducker-sign-in")).toHaveCount(0);
  expect(outside).toEqual([]);
});
