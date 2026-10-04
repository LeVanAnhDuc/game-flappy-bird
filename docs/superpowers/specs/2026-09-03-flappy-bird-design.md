# Flappy Bird — Thiết kế hệ thống

Ngày: 2026-09-03
Trạng thái: đã chốt, đang triển khai

## 1. Mục tiêu

Xây một bản Flappy Bird hoàn chỉnh chạy trên web: menu, chơi, lưu điểm cao,
cài đặt. Chơi được cả trên máy tính lẫn điện thoại. Hình ảnh vẽ hoàn toàn
bằng code, không dùng file asset.

Repo trước đó chỉ có bộ khung Next.js 15 + React 19 + TailwindCSS + shadcn/ui
và một component `Header` rỗng. Toàn bộ phần game là mới.

## 2. Quyết định nền tảng

| Quyết định | Lựa chọn | Lý do |
| --- | --- | --- |
| Cách chạy game | Canvas 2D + engine TypeScript thuần, React chỉ làm vỏ | React không re-render mỗi frame; logic tách rời nên test được |
| Lưu điểm | localStorage, qua interface `ScoreRepository` | Không cần hạ tầng; sau này cắm API vào không phải viết lại |
| Đồ hoạ | Vẽ procedural bằng Canvas API | Không vướng bản quyền asset, đổi tông màu chỉ sửa một file |
| Thiết bị | Desktop + mobile responsive | Game web dạng này chủ yếu chơi trên điện thoại |
| Test | Vitest cho logic thuần, Playwright cho luồng người dùng | Va chạm và đếm điểm là chỗ sai âm thầm; luồng UI cần chạy thật |

Đã cân nhắc và loại bỏ: DOM + React state (giật trên mobile, khó test),
Phaser/matter.js (thêm ~1MB bundle cho một bài toán vật lý tầm thường).

## 3. Kiến trúc

Nguyên tắc xuyên suốt: **`src/game/` không import React.** Nó là một thư
viện TypeScript độc lập, chạy được trong Node.

```
src/game/
├── core/        HÀM THUẦN: physics, pipes, collision, scoring, world, rng
├── engine/      BẨN: requestAnimationFrame, sự kiện bàn phím/chạm
├── render/      Canvas 2D: viewport, renderer, layers, palette
├── score/       ScoreRepository (interface) + bản localStorage
├── settings/    SettingsRepository + bản localStorage
└── audio/       WebAudio sinh âm bằng oscillator, không file mp3

src/hooks/useGameEngine.ts   cầu nối DUY NHẤT giữa engine và React
src/views/Home/mains/GameStage/   canvas + overlay (HUD, menu, thua, cài đặt)
```

Ranh giới `core/` ↔ `engine/` là ranh giới quan trọng nhất. `core/` nhận
`(state, dt, input)` và trả về `state` mới — không thời gian thực, không
canvas, không `Math.random()` ẩn (bộ sinh ngẫu nhiên gieo hạt nằm trong
state). Nhờ vậy mọi luật chơi đều kiểm chứng được bằng cách gọi hàm với số
cụ thể. `engine/` mới là nơi chứa thứ không test được bằng unit test.

## 4. Hệ toạ độ và scaling

Thế giới cố định **288 × 512** đơn vị logic (tỉ lệ bản gốc, cũng gần đúng
9:16 của điện thoại dựng đứng). Mọi thiết bị mô phỏng trên cùng kích thước
này rồi mới scale ra pixel thật theo kiểu *contain*, canh giữa.

Hệ quả có chủ ý: điện thoại dọc lấp gần kín khung; màn hình rộng thấy một
cột game ở giữa trên nền tối. Đổi lại, **độ khó và điểm số công bằng như
nhau ở mọi màn hình** — điều bắt buộc nếu điểm cao có ý nghĩa.

## 5. Vòng lặp và luồng dữ liệu

Vật lý chạy ở **bước cố định 1/120 giây** với accumulator, tối đa 5 bước mỗi
frame. Màn hình 60Hz hay 144Hz đều cho ra hành vi giống hệt nhau, và tab bị
treo lâu không gây "vòng xoáy tử thần".

Một cú vỗ cánh được xếp hàng đợi và tiêu thụ đúng một bước mô phỏng — không
bị nhân đôi, không bị nuốt.

Engine chỉ phát `GameSnapshot` (`phase`, `score`, `difficulty`) sang React
**khi giá trị thực sự đổi**. React không bao giờ render lại theo frame.
Đây là ràng buộc hiệu năng cốt lõi của toàn bộ thiết kế.

Vòng đời phase: `menu → ready → playing → gameover → (restart) ready`.

## 6. Xử lý lỗi và trường hợp biên

| Tình huống | Cách xử lý |
| --- | --- |
| Tab bị ẩn giữa lúc chơi | Tự dừng vòng lặp, chạy lại khi quay về — nếu không người chơi mất mạng oan |
| localStorage bị chặn (ẩn danh) | Nuốt lỗi, coi điểm cao = 0, game vẫn chơi được |
| Dữ liệu localStorage hỏng | Hợp lệ hoá từng trường, hỏng thì lấy mặc định |
| Trình duyệt chặn WebAudio | Tạo AudioContext lười ở lần phát đầu; lỗi thì im lặng bỏ qua |
| Hydration Next.js | Không đọc localStorage lúc render, chỉ trong effect |
| Chạm nhanh trên mobile | `userScalable: false` + `touch-action: none` + `preventDefault` |
| Overlay che mất vùng chạm | Overlay `pointer-events: none`, chỉ nút mới nhận sự kiện |

Chạm trần **không giết chim** (giống bản gốc) — chỉ bị chặn lại.

## 7. Độ khó và điểm cao

Ba mức Dễ / Thường / Khó khác nhau ở trọng lực, tốc độ cuộn, độ rộng khe hở
và khoảng cách giữa các ống.

**Điểm cao lưu riêng cho từng độ khó** (`flappy-bird:best:<difficulty>`).
Gộp chung sẽ khiến bảng điểm vô nghĩa vì một điểm ở mức Dễ không so được với
mức Khó.

## 8. Chiến lược test

- **Vitest** (`src/**/*.test.ts`) — logic thuần trong `core/`, `viewport`,
  và hai repository localStorage. Các bài bắt buộc: không cộng điểm hai lần
  cho cùng một ống; chạm mép không tính va chạm; `stepWorld` thuần và không
  mutate đầu vào; cùng seed cho ra cùng chuỗi ống; localStorage hỏng không
  làm sập game.
- **Playwright** (`e2e/`) — luồng menu → chơi → thua → chơi lại, chạy trên
  cả Desktop Chrome lẫn Pixel 7.
- Tầng vẽ canvas không unit test; đúng/sai về thị giác do người xem.

## 9. Phạm vi cố ý bỏ qua (YAGNI)

Không state manager (engine tự giữ state), không entity-component-system
(game có đúng hai loại vật thể), không tầng abstraction cho renderer, không
leaderboard online, không tài khoản do game sở hữu (từ 2026-10-04 có đăng nhập Ducker ID tùy chọn, chỉ
định danh, không backend, không đồng bộ — xem `docs/decisions/0001-ducker-id-sign-in.md`),
không sprite sheet.
