import { expect, test } from "@playwright/test";

import { gotoGame } from "./helpers";

const ISSUER = "http://ducker.test";
const CORS = { "access-control-allow-origin": "*" };

test.beforeEach(async ({ page }) => {
  await page.route(`${ISSUER}/oauth/authorize**`, async (route) => {
    const url = new URL(route.request().url());
    const back = new URL(url.searchParams.get("redirect_uri")!);
    back.searchParams.set("code", "code-1");
    back.searchParams.set("state", url.searchParams.get("state")!);
    await route.fulfill({
      status: 302,
      headers: { location: back.toString() }
    });
  });
  await page.route(`${ISSUER}/oauth/token`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: CORS,
      body: JSON.stringify({
        access_token: "at-1",
        token_type: "Bearer",
        expires_in: 900
      })
    })
  );
  await page.route(`${ISSUER}/oauth/userinfo`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: CORS,
      body: JSON.stringify({
        sub: "u1",
        name: "Lê Văn Anh Đức",
        email: "duc@ducker.id"
      })
    })
  );
});

test("signs in, shows the account menu, keeps the URL clean, signs out", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await gotoGame(page);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  const account = page.getByRole("button", { name: "Tài khoản Ducker ID" });
  await expect(account).toBeVisible();
  expect(new URL(page.url()).search).not.toMatch(/code=|state=/);
  // Sau hydrate Next có thể ghi lại URL cũ — đợi thêm rồi kiểm lại.
  await page.waitForTimeout(500);
  expect(new URL(page.url()).search).not.toMatch(/code=|state=/);
  await account.click();
  await expect(page.getByText("Lê Văn Anh Đức")).toBeVisible();
  await expect(
    page.getByRole("menuitem", { name: "Mở hồ sơ Ducker ID" })
  ).toHaveAttribute("href", `${ISSUER}/profile`);
  await page.getByRole("menuitem", { name: "Đăng xuất" }).click();
  const signIn = page.getByRole("button", { name: "Đăng nhập" });
  await expect(signIn).toBeVisible();
  await expect(signIn).toBeFocused();
  expect(errors.filter((e) => /hydrat/i.test(e))).toEqual([]);
});

test("the game is still playable while signed in", async ({ page }) => {
  await gotoGame(page);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(
    page.getByRole("button", { name: "Tài khoản Ducker ID" })
  ).toBeVisible();
  await page.getByTestId("btn-play").click();
  await expect(page.getByTestId("ready-overlay")).toBeVisible();
});

test("a reload signs the player out (nothing persisted)", async ({ page }) => {
  await gotoGame(page);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(
    page.getByRole("button", { name: "Tài khoản Ducker ID" })
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Đăng nhập" })).toBeVisible();
});

test("a denied sign-in leaves the player signed out with a clean URL", async ({
  page
}) => {
  await page.route(`${ISSUER}/oauth/authorize**`, async (route) => {
    const url = new URL(route.request().url());
    const back = new URL(url.searchParams.get("redirect_uri")!);
    back.searchParams.set("error", "access_denied");
    back.searchParams.set("state", url.searchParams.get("state")!);
    await route.fulfill({
      status: 302,
      headers: { location: back.toString() }
    });
  });
  await gotoGame(page);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  // Mục PKCE chỉ bị xoá khi trang quay lại đã xử lý callback.
  await expect
    .poll(() => page.evaluate(() => sessionStorage.getItem("ducker.pkce")))
    .toBeNull();
  await expect(page.getByRole("button", { name: "Đăng nhập" })).toBeVisible();
  expect(new URL(page.url()).search).toBe("");
});

test("375px: the sign-in button is >=44px and overlaps nothing", async ({
  page
}) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await gotoGame(page);
  const box = await page
    .getByRole("button", { name: "Đăng nhập" })
    .boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
  const others = [
    page.getByTestId("best-score").locator("xpath=ancestor::span[1]"),
    page.getByTestId("btn-sound")
  ];
  for (const other of others) {
    const o = (await other.boundingBox())!;
    const overlap =
      box!.x < o.x + o.width &&
      o.x < box!.x + box!.width &&
      box!.y < o.y + o.height &&
      o.y < box!.y + box!.height;
    expect(overlap).toBe(false);
  }
});

test("ArrowUp inside the open account menu does not start the game", async ({
  page
}) => {
  await gotoGame(page);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.getByRole("button", { name: "Tài khoản Ducker ID" }).click();
  await expect(page.getByTestId("ducker-account-menu")).toBeVisible();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowDown");
  await expect(page.getByTestId("menu-overlay")).toBeVisible();
  await expect(page.getByTestId("ready-overlay")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("ducker-account-menu")).toHaveCount(0);
  await expect(page.getByTestId("menu-overlay")).toBeVisible();
});

for (const width of [320, 375]) {
  test(`${width}px: header does not wrap, targets stay >=44, menu stays on screen`, async ({
    page
  }) => {
    await page.setViewportSize({ width, height: 700 });
    await gotoGame(page);
    const header = page.locator("header");
    const pill = page
      .getByTestId("best-score")
      .locator("xpath=ancestor::span[1]");
    const sound = page.getByTestId("btn-sound");
    const heightBefore = (await header.boundingBox())!.height;
    expect(heightBefore).toBe(56);
    for (const box of [await pill.boundingBox(), await sound.boundingBox()]) {
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    expect((await sound.boundingBox())!.width).toBeGreaterThanOrEqual(44);
    await page.getByRole("button", { name: "Đăng nhập" }).click();
    const trigger = page.getByRole("button", { name: "Tài khoản Ducker ID" });
    await expect(trigger).toBeVisible();
    const container = trigger.locator("xpath=..");
    const before = await container.boundingBox();
    await trigger.click();
    const menu = page.getByTestId("ducker-account-menu");
    await expect(menu).toBeVisible();
    const m = (await menu.boundingBox())!;
    expect(m.x).toBeGreaterThanOrEqual(0);
    expect(m.x + m.width).toBeLessThanOrEqual(width);
    expect(await menu.evaluate((el) => getComputedStyle(el).position)).toBe(
      "absolute"
    );
    expect(await container.boundingBox()).toEqual(before);
    expect((await header.boundingBox())!.height).toBe(56);
  });
}
