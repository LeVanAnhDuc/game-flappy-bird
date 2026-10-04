// libs
import { useCallback, useEffect, useRef, useState } from "react";

const ITEM_SELECTOR = "[role=menuitem]";

/** Hành vi menu tài khoản (không có style): Esc, bấm ngoài, mũi tên, Tab/focus rời đi. */
export const useAccountMenu = () => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback((refocus: boolean) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const items = () =>
      Array.from(
        menuRef.current?.querySelectorAll<HTMLElement>(ITEM_SELECTOR) ?? []
      );

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close(true);
        return;
      }
      if (event.key === "Tab") {
        // Tab đi tiếp theo thứ tự tự nhiên của trang — đóng menu, không giành lại focus.
        close(false);
        return;
      }
      const list = items();
      if (list.length === 0) return;
      const index = list.indexOf(document.activeElement as HTMLElement);
      let next = -1;
      if (event.key === "ArrowDown") next = (index + 1) % list.length;
      else if (event.key === "ArrowUp")
        next = (index - 1 + list.length) % list.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = list.length - 1;
      if (next >= 0) {
        event.preventDefault();
        list[next].focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !menuRef.current?.contains(target) &&
        !triggerRef.current?.contains(target)
      ) {
        close(false);
      }
    };
    // Safari không focus nút khi bấm → relatedTarget null; chỉ đóng khi focus
    // thật sự đi tới một phần tử NẰM NGOÀI menu và nút mở.
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget as Node | null;
      if (
        next &&
        !menuRef.current?.contains(next) &&
        !triggerRef.current?.contains(next)
      ) {
        close(false);
      }
    };

    const menu = menuRef.current;
    const trigger = triggerRef.current;
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    menu?.addEventListener("focusout", onFocusOut);
    trigger?.addEventListener("focusout", onFocusOut);
    items()[0]?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      menu?.removeEventListener("focusout", onFocusOut);
      trigger?.removeEventListener("focusout", onFocusOut);
    };
  }, [open, close]);

  return {
    open,
    toggle: () => setOpen((value) => !value),
    close,
    triggerRef,
    menuRef
  };
};
