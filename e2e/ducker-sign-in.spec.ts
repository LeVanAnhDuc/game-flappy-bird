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

type Page = import("@playwright/test").Page;

/** Đo header: không tràn ngang, wordmark một dòng, nút >=44x44, không chồng nhau. */
const assertHeaderFits = async (page: Page, width: number, label: string) => {
  const m = await page.evaluate(() => {
    const rect = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    };
    const header = document.querySelector("header")!;
    return {
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      wordmark: rect(header.querySelector("span")!),
      buttons: Array.from(header.querySelectorAll("button")).map(rect),
      pill: rect(
        document.querySelector("[data-testid=best-score]")!.parentElement!
      )
    };
  });
  test.info().annotations.push({
    type: `${label}@${width}`,
    description: JSON.stringify({
      scrollWidth: m.scrollWidth,
      wordmarkH: Math.round(m.wordmark.h),
      buttons: m.buttons.map((b) => `${Math.round(b.w)}x${Math.round(b.h)}`),
      pill: `${Math.round(m.pill.w)}x${Math.round(m.pill.h)}`
    })
  });
  expect(m.scrollWidth).toBeLessThanOrEqual(m.innerWidth);
  expect(m.wordmark.h).toBeLessThan(28);
  const boxes = [...m.buttons, m.pill, m.wordmark];
  for (const b of m.buttons) {
    expect(b.w).toBeGreaterThanOrEqual(44);
    expect(b.h).toBeGreaterThanOrEqual(44);
  }
  for (let a = 0; a < boxes.length; a++) {
    for (let c = a + 1; c < boxes.length; c++) {
      const p = boxes[a];
      const q = boxes[c];
      const overlap =
        p.x < q.x + q.w - 0.5 &&
        q.x < p.x + p.w - 0.5 &&
        p.y < q.y + q.h - 0.5 &&
        q.y < p.y + p.h - 0.5;
      expect(overlap, `boxes ${a} and ${c} overlap`).toBe(false);
    }
  }
};

for (const width of [320, 375]) {
  test(`${width}px: header fits in idle, signed-out and signed-in; menu stays on screen`, async ({
    page,
    browser,
    baseURL
  }) => {
    // idle = HTML của server, chưa chạy JS: nút tồn tại nhưng bị khóa.
    const noJs = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width, height: 700 }
    });
    const idlePage = await noJs.newPage();
    await idlePage.goto(`${baseURL}/`);
    await expect(idlePage.getByTestId("btn-ducker-sign-in")).toBeDisabled();
    await assertHeaderFits(idlePage, width, "idle");
    await noJs.close();

    await page.setViewportSize({ width, height: 700 });
    await gotoGame(page);
    await expect(page.getByRole("button", { name: "Đăng nhập" })).toBeEnabled();
    await assertHeaderFits(page, width, "signed-out");

    await page.getByRole("button", { name: "Đăng nhập" }).click();
    const trigger = page.getByRole("button", { name: "Tài khoản Ducker ID" });
    await expect(trigger).toBeVisible();
    await assertHeaderFits(page, width, "signed-in");
    const container = trigger.locator("xpath=..");
    const before = await container.boundingBox();
    await trigger.click();
    const menu = page.getByTestId("ducker-account-menu");
    await expect(menu).toBeVisible();
    const box = (await menu.boundingBox())!;
    test.info().annotations.push({
      type: `menu@${width}`,
      description: JSON.stringify(box)
    });
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(700);
    expect(await menu.evaluate((el) => getComputedStyle(el).position)).toBe(
      "absolute"
    );
    expect(await container.boundingBox()).toEqual(before);
  });
}
