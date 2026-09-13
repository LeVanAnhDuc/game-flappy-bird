# Kế hoạch — sửa 6 phát hiện UX (2026-09-11)

Nhánh: `fix/ux-persona-2026-09-11`, tách từ `origin/main`.
TDD từng task: viết test đỏ trước, rồi mới sửa code.

## Task 1 — F-04a · `Space` ở menu bắt đầu lượt

- [x] `src/game/engine/input.test.ts` (mới, `@vitest-environment happy-dom`): phím vỗ
      cánh gọi `onKeyboardFlap` khi có, `pointerdown` vẫn gọi `onFlap`
- [x] `src/game/engine/input.ts`: thêm `onKeyboardFlap?`, mặc định rơi về `onFlap`
- [x] `src/hooks/useGameEngine.ts`: `onKeyboardFlap` kiểm `phase === "menu"` → bắt đầu lượt

## Task 2 — F-04b · Tab đầu tới nút Chơi

- [x] `e2e/ux-fixes.spec.ts`: mở trang, `Tab` một lần → tiêu điểm ở `btn-play`
- [x] `src/views/Home/components/MenuOverlay/index.tsx`: `autoFocus` nút Chơi

## Task 3 — F-02 · Nhãn kỷ lục nhìn thấy được

- [x] e2e: `best-score` có chữ "Kỷ lục" nhìn thấy được, không phải `sr-only`
- [x] `src/views/Home/mains/Header/index.tsx`: bỏ `sr-only`, thêm nhãn thật, 13→15px

## Task 4 — F-03 · Nút loa nói trạng thái

- [x] e2e: ở menu, nút loa hiện chữ "Bật"; bấm xong đổi thành "Tắt"
- [x] `MenuOverlay`: thêm chữ trạng thái cạnh icon
- [x] `Header`: thêm `title` khớp `aria-label`

## Task 5 — F-06 · Đảo thứ tự ưu tiên màn hình đầu

- [x] `MenuOverlay`: h1 34→28px, tagline 14→16px và màu sáng hơn

## Task 6 — F-01 · Dạy rằng chạm là một NHỊP

- [x] e2e: ready-overlay chứa chữ "liên tục"
- [x] `GameStage`: ba nhịp nối nhau thay một bàn tay; đổi câu chữ
- [x] e2e: thua với điểm 0 → hiện gợi ý; thua có điểm > 0 → không hiện
- [x] `GameOverOverlay`: dòng gợi ý chỉ khi `score === 0`

## Task 7 — F-05 · Chạm ngoài hộp thì hộp nháy

- [x] e2e: chạm ngoài hộp → hộp nhận `data-nudge="true"`, và **vẫn ở màn thua**
- [x] `GameOverOverlay`: bắt `pointerdown` ở nền, nháy 400ms, không chơi lại

## Task 7b — Bug thứ bảy: chuyển tab ngay sau cú vỗ đầu thì mất lượt

- [x] e2e: vỗ cánh + `visibilitychange` trong CÙNG một tác vụ đồng bộ → quay lại không thấy
      màn thua. Xác minh **đỏ trên code chưa sửa, xanh sau khi sửa**
- [x] `src/game/engine/GameEngine.ts`: điều kiện tự dừng gộp cả `"ready"`, không chỉ `"playing"`
- [x] Nâng tương phản câu phụ ở màn sẵn sàng (chữ nằm trên nền trời sáng)

## Task 8 — Kiểm toàn bộ

- [x] `pnpm test` xanh
- [x] `pnpm typecheck` xanh
- [x] `pnpm lint:js` xanh
- [x] `pnpm test:e2e` xanh (desktop + Pixel 7)
- [x] Ảnh thật ở 375 / 768 / 1024 / 1440
- [x] README `## Features` nếu có thay đổi hành vi người dùng thấy được
