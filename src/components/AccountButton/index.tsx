"use client";

// libs
import { useEffect, useRef } from "react";

// types
import type { ReactElement } from "react";

// hooks
import { useAccountMenu, useDuckerAuth } from "@/hooks";

// others
import { initialOf } from "@/auth/initials";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD866] focus-visible:ring-offset-2 focus-visible:ring-offset-[#081C29]";

/**
 * Nút "Đăng nhập Ducker ID" ở header. Tính năng tắt (cờ/biến thiếu) thì không
 * render gì cả — game y hệt bản cũ.
 */
const AccountButton = (): ReactElement | null => {
  const auth = useDuckerAuth();
  const menu = useAccountMenu();
  const signInRef = useRef<HTMLButtonElement>(null);
  const focusSignInNext = useRef(false);

  const signedIn = auth.status === "signed-in" && auth.profile !== null;

  // Sau "Đăng xuất" nút mở menu biến mất — đưa focus sang nút Đăng nhập cùng chỗ,
  // không để rơi về <body>.
  useEffect(() => {
    if (!signedIn && focusSignInNext.current) {
      focusSignInNext.current = false;
      signInRef.current?.focus();
    }
  }, [signedIn]);

  if (!auth.enabled) return null;

  if (!signedIn || !auth.profile) {
    const loading = auth.status === "loading";
    return (
      <button
        ref={signInRef}
        type="button"
        data-testid="btn-ducker-sign-in"
        onClick={auth.signIn}
        disabled={loading}
        aria-busy={loading}
        className={`flex h-11 items-center justify-center rounded-full bg-white/[0.06] px-3 text-[15px] font-semibold text-[#EAF6FB] transition-colors hover:bg-white/[0.12] active:bg-white/[0.18] disabled:cursor-wait disabled:opacity-70 ${FOCUS_RING}`}
      >
        {loading ? "Đang đăng nhập…" : "Đăng nhập"}
      </button>
    );
  }

  const { profile } = auth;
  const title = profile.name?.trim() || profile.email?.trim() || "";
  const showEmail = Boolean(profile.email?.trim()) && title !== profile.email;

  return (
    <div className="relative">
      <button
        ref={menu.triggerRef}
        type="button"
        data-testid="btn-ducker-account"
        onClick={menu.toggle}
        aria-haspopup="menu"
        aria-expanded={menu.open}
        aria-label="Tài khoản Ducker ID"
        className={`flex size-11 items-center justify-center rounded-full transition-colors hover:bg-white/[0.08] active:bg-white/[0.14] ${FOCUS_RING}`}
      >
        {profile.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.picture}
            alt=""
            width={32}
            height={32}
            className="size-8 rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center rounded-full bg-[#FFD866] text-[15px] font-semibold text-[#06222F]"
          >
            {initialOf(profile)}
          </span>
        )}
      </button>

      {menu.open && (
        <div
          ref={menu.menuRef}
          role="menu"
          aria-label="Tài khoản Ducker ID"
          data-testid="ducker-account-menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 max-w-[calc(100vw-1rem)] rounded-xl border border-white/10 bg-[#0A2130] p-3 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)]"
        >
          {title && (
            <p className="truncate text-[15px] font-semibold text-[#EAF6FB]">
              {title}
            </p>
          )}
          {showEmail && (
            <p className="truncate text-[13px] text-[#C6DAE4]">
              {profile.email}
            </p>
          )}
          <div className="mt-3 flex flex-col gap-2">
            <a
              role="menuitem"
              href={auth.profileUrl ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => menu.close(false)}
              className={`flex h-11 items-center justify-center rounded-lg bg-[#FFD866] px-3 text-[15px] font-semibold text-[#06222F] transition-colors hover:bg-[#FFE49A] ${FOCUS_RING}`}
            >
              Mở hồ sơ Ducker ID
            </a>
            <button
              role="menuitem"
              type="button"
              onClick={() => {
                focusSignInNext.current = true;
                menu.close(false);
                auth.signOut();
              }}
              className={`flex h-11 items-center justify-center rounded-lg px-3 text-[15px] font-medium text-[#C6DAE4] transition-colors hover:bg-white/[0.08] hover:text-[#EAF6FB] ${FOCUS_RING}`}
            >
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountButton;
