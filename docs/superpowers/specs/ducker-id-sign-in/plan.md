# Kế hoạch — đăng nhập Ducker ID (Duck Flap)

Kế hoạch chung: `web-game/docs/superpowers/plans/2026-10-04-ducker-id-sign-in.md`.

- [x] Task 0: worktree `.worktrees/ducker-id-sign-in`, baseline
- [x] Task 1: env, base path, `readDuckerConfig` (+ test)
- [x] Task 2: PKCE, callback, request, session store, initials (+ test)
- [x] Task 3: hook, `AccountButton`, gắn vào Header (+ test, ảnh chụp 375/768/1440)
- [x] Task 4: e2e flag bật (cổng 3411) và flag tắt (cổng 3410)
- [x] Task 5: tài liệu (spec §9, ADR 0001, README, `.env.example`)
- [x] Task 6: gate, push, PR (không merge)
- [x] Sửa đổi 1–6 của kế hoạch chung (returnTo an toàn, timeout, focus, validate profile,
      settle URL một lần, dọn pending khi start lỗi)
