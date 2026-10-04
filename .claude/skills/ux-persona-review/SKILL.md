---
name: ux-persona-review
description: Use when you want to know how a real stranger experiences Duck Flap — dispatches blind persona subagents that actually drive the running app in a browser, captures their first five seconds and their gut reaction, then returns UX/UI findings mapped to ISO 9241-11, LATCH, trigger words, interaction design, visual hierarchy, form design, visual craft and trust/desirability, every finding backed by a quote or a screenshot from a session log. Trigger on "chay persona", "test UX", "nguoi dung that thay sao", "UI co dep khong", "an tuong dau", "UX review", "red route", or before opening a PR that changes user-facing behaviour.
---

# Duck Flap — UX persona review

## Sản phẩm này

- Thư mục: `D:/DeleteByDuc/web-game/web-game-duck-flap`
- **Đích của mọi phiên: bản đã deploy** — <https://levananhduc.github.io/web-game-duck-flap/>
  Đây là bản GitHub Actions dựng từ `main` với `NEXT_PUBLIC_BASE_PATH=/<tên-repo>`, tức **đúng thứ người
  chơi thật mở**. Persona không bao giờ chạm tới máy của bạn.
- Bản chạy ở máy — **chỉ dùng khi cần soi một thay đổi chưa deploy**, và khi đó phải ghi
  rõ trong báo cáo là đã soi bản nào: `pnpm dev --port 3100` → <http://127.0.0.1:3100/>
- Dấu hiệu nhận biết đúng app: tiêu đề trang là **Duck Flap**; một khung chơi dọc tỉ lệ 288×512 nằm giữa nền tối, có các **cặp ống** cuộn từ phải sang trái và một con chim rơi theo trọng lực
- Email dùng-một-lần cho persona: không dùng — game này không có đăng ký, không có email
- Tài khoản thử (nếu Red Route cần đăng nhập): không có — không Red Route nào cần đăng nhập; mọi dữ liệu nằm trong trình duyệt của chính người chơi

## Đích của lượt chạy là bản deploy — ghi đè `lib/orchestration.md`

`lib/orchestration.md` §Trước khi chạy bước 2–3 nói: kiểm app có chạy ở port không, và
**không tự bật app**. Ở project này hai bước đó đổi nghĩa:

| Bước gốc | Ở project này |
| --- | --- |
| 2 · kiểm app đang chạy ở port | `curl -s -o /dev/null -w "%{http_code}" -L https://levananhduc.github.io/web-game-duck-flap/` phải trả `200`. Không phải `200` thì **dừng** và báo là bản deploy đang hỏng — đó tự nó đã là một phát hiện |
| 3 · đối chiếu dấu hiệu nhận biết | vẫn bắt buộc, không bỏ. Xem mục Dấu hiệu nhận biết ở trên |
| "không tự bật app" | không còn áp dụng — **không có app nào để bật** |

**Ba hệ quả bắt buộc nhớ khi đọc báo cáo:**

1. **Lượt chạy đo bản trên `main`, không đo code trong thư mục làm việc.** Đang ở nhánh
   feature mà chạy persona thì kết quả **không nói gì** về nhánh đó. Muốn soi thay đổi
   chưa merge thì phải dùng bản chạy ở máy, và phải nói rõ điều đó trong báo cáo.
2. **Bản deploy là bản production đã tối ưu** — không có overlay dev của Next, không có
   `window.__debug`. Đây là điểm mạnh: nó đúng là thứ người dùng gặp.
3. **Mạng thật, độ trễ thật.** Một persona "mạng chậm" giờ đo được điều gì đó có nghĩa,
   chứ không phải đo `localhost`. Nhưng nếu GitHub Pages chậm bất thường thì đó là nhiễu,
   không phải phát hiện — đo lại trước khi ghi.

## Chạy

Toàn bộ quy trình nằm ở `lib/orchestration.md`. Đọc nó trước, rồi làm theo.

Dữ liệu riêng của sản phẩm này:

| Cần gì | Ở đâu |
| --- | --- |
| Red Route đã chốt | `references/red-routes.md` |
| Dàn persona | `references/personas/` |
| Rule đã dùng để sinh persona | `references/persona-rules.md` |
| Khung đánh giá, luật xếp hạng | `lib/frameworks.md` |
| Thứ tự công cụ trình duyệt | `lib/browser-capability.md` |

## Hai agent

`ux-persona` (Sonnet, chỉ có trình duyệt) đóng vai người dùng.
`ux-expert` (Opus, chỉ có Read) dịch log sang khung đánh giá.

Cả hai định nghĩa ở `D:/DeleteByDuc/web-game/web-game-duck-flap/.claude/agents/`. Nếu Claude Code báo không tìm thấy
agent type, phiên hiện tại được mở trước khi hai file đó tồn tại — khởi động lại phiên.

## Bảo trì

Nâng cấp phần logic: `bash <workspace>/.claude/skills/ux-persona-lab/scripts/install.sh D:/DeleteByDuc/web-game/web-game-duck-flap --update`
Lấy lại rule persona mới: cùng lệnh với `--refresh-rules`.
Cả hai đều **không** đụng tới `red-routes.md` và `personas/`.
