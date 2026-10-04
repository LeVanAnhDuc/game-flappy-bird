// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));
vi.mock("@/hooks/useDuckerAuth", () => ({ useDuckerAuth: () => auth.value }));

import AccountButton from "@/components/AccountButton";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const base = {
  enabled: true,
  profileUrl: "http://localhost:3000/profile",
  signIn: vi.fn(),
  signOut: vi.fn()
};
const person = { sub: "u1", name: "Lê Văn Anh Đức", email: "duc@ducker.id" };

let container: HTMLDivElement;
let root: Root;

const render = () => act(() => root.render(<AccountButton />));
const byName = (name: string) =>
  Array.from(container.querySelectorAll<HTMLElement>("button,a")).find(
    (el) =>
      el.textContent?.trim() === name || el.getAttribute("aria-label") === name
  );
const click = (el: HTMLElement | undefined) =>
  act(() => {
    el!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
const key = (name: string) =>
  act(() => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: name, bubbles: true })
    );
  });
const items = () =>
  Array.from(container.querySelectorAll<HTMLElement>("[role='menuitem']"));

describe("AccountButton", () => {
  beforeEach(() => {
    base.signIn.mockClear();
    base.signOut.mockClear();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("renders nothing when the feature is disabled", () => {
    auth.value = { ...base, enabled: false, status: "idle", profile: null };
    render();
    expect(container.innerHTML).toBe("");
  });

  it("shows the sign-in button when signed out and starts login on click", () => {
    auth.value = { ...base, status: "signed-out", profile: null };
    render();
    click(byName("Đăng nhập"));
    expect(base.signIn).toHaveBeenCalledOnce();
  });

  it("disables the button while signing in", () => {
    auth.value = { ...base, status: "loading", profile: null };
    render();
    expect((byName("Đang đăng nhập…") as HTMLButtonElement).disabled).toBe(
      true
    );
  });

  it("opens the menu with profile link and sign out; Esc closes and refocuses", () => {
    auth.value = { ...base, status: "signed-in", profile: person };
    render();
    const trigger = byName("Tài khoản Ducker ID")!;
    click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(container.textContent).toContain("Lê Văn Anh Đức");
    expect(container.textContent).toContain("duc@ducker.id");
    const link = byName("Mở hồ sơ Ducker ID") as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe("http://localhost:3000/profile");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    key("Escape");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
    click(trigger);
    click(byName("Đăng xuất"));
    expect(base.signOut).toHaveBeenCalledOnce();
  });

  it("moves focus with the arrow keys, wrapping around, and Home/End", () => {
    auth.value = { ...base, status: "signed-in", profile: person };
    render();
    click(byName("Tài khoản Ducker ID"));
    const [first, last] = items();
    expect(document.activeElement).toBe(first);
    key("ArrowDown");
    expect(document.activeElement).toBe(last);
    key("ArrowDown");
    expect(document.activeElement).toBe(first);
    key("ArrowUp");
    expect(document.activeElement).toBe(last);
    key("Home");
    expect(document.activeElement).toBe(first);
    key("End");
    expect(document.activeElement).toBe(last);
  });

  it("closes on Tab without stealing focus back", () => {
    auth.value = { ...base, status: "signed-in", profile: person };
    render();
    const trigger = byName("Tài khoản Ducker ID")!;
    click(trigger);
    key("Tab");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).not.toBe(trigger);
  });

  it("closes when focus leaves to an outside element, but not on a null relatedTarget", () => {
    auth.value = { ...base, status: "signed-in", profile: person };
    render();
    const trigger = byName("Tài khoản Ducker ID")!;
    click(trigger);
    const menuItem = items()[0];
    act(() => {
      menuItem.dispatchEvent(
        new FocusEvent("focusout", { bubbles: true, relatedTarget: null })
      );
    });
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    act(() => {
      menuItem.dispatchEvent(
        new FocusEvent("focusout", { bubbles: true, relatedTarget: outside })
      );
    });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    outside.remove();
  });

  it("lands focus on the sign-in button after signing out", () => {
    auth.value = { ...base, status: "signed-in", profile: person };
    render();
    click(byName("Tài khoản Ducker ID"));
    click(byName("Đăng xuất"));
    auth.value = { ...base, status: "signed-out", profile: null };
    render();
    expect(document.activeElement).toBe(byName("Đăng nhập"));
  });

  it("shows the email as the main line when there is no name, and no email line when there is none", () => {
    auth.value = {
      ...base,
      status: "signed-in",
      profile: { sub: "u1", email: "duc@ducker.id" }
    };
    render();
    click(byName("Tài khoản Ducker ID"));
    expect(container.textContent?.match(/duc@ducker\.id/g)).toHaveLength(1);
    click(byName("Tài khoản Ducker ID"));
    auth.value = {
      ...base,
      status: "signed-in",
      profile: { sub: "u1", name: "Đức" }
    };
    render();
    click(byName("Tài khoản Ducker ID"));
    expect(container.textContent).toContain("Đức");
    expect(container.textContent).not.toContain("@");
  });
});
