# Đăng nhập Ducker ID tùy chọn — phần riêng của Duck Flap

Spec chung (hành vi, copy, env, test): `web-game/docs/superpowers/specs/2026-10-04-ducker-id-sign-in-design.md`.
Quyết định: `docs/decisions/0001-ducker-id-sign-in.md`.

Ngày: 2026-10-04 · Trạng thái: đã triển khai (ship tối)

## Vị trí và giao diện

- Header (`src/views/Home/mains/Header`), giữa pill "Kỷ lục" và nút âm thanh.
- Nút chữ "Đăng nhập" / "Đang đăng nhập…": cao 44px, nền `bg-white/[0.06]`, chữ `#EAF6FB`,
  vòng focus `#FFD866`. Chỉ dùng các mã hex đã có sẵn trong Header.
- Đăng nhập xong: avatar 32px (ảnh, hoặc chữ cái đầu trên nền `#FFD866` / chữ `#06222F`)
  trong nút 44px, mở popover `#0A2130`: tên, email (ẩn nếu không có), mục chính
  "Mở hồ sơ Ducker ID" kiểu primary `bg-[#FFD866] text-[#06222F]` hover `#FFE49A`, và
  "Đăng xuất". Chuỗi tiếng Việt viết thẳng trong component như phần còn lại của flap.
- Bàn phím: Esc đóng + trả focus nút mở; mũi tên/Home/End di chuyển giữa các mục;
  Tab hoặc focus ra ngoài đóng menu; sau "Đăng xuất" focus về nút "Đăng nhập".

## File

`src/auth/` (types, config, pkce, duckerAuth, duckerRequests, duckerSession, initials) ·
`src/hooks/{useDuckerAuth,useAccountMenu}.ts` · `src/components/AccountButton` ·
`src/env.d.ts` · `.env.example` · `playwright.auth.config.ts` · `e2e/ducker-sign-in*.spec.ts`.
Repo không dùng `src/types`, `src/libs`, `src/requests` (R-14 bác `src/types`), nên mọi
thứ của luồng auth gom vào `src/auth/` và giữ nguyên tên file.

## Redirect URI

Local: `http://localhost:<cổng>/` (vd `pnpm dev --port 3400`). Production: `https://levananhduc.github.io/web-game-duck-flap/`.
