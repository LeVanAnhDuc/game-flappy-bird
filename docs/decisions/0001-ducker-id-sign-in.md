# 0001 — Đăng nhập Ducker ID tùy chọn, ship "tối"

Ngày: 2026-10-04 · Trạng thái: đã chấp nhận

Repo này chưa có thư mục ADR; đây là ADR đầu tiên nên tạo `docs/decisions/`.

## Bối cảnh

Yêu cầu của chủ dự án (2026-10-04): mọi game web có code được thêm "Đăng nhập bằng
Ducker ID" giống `web-app-calculate-badminton` (OIDC Authorization Code + PKCE,
public client). Phạm vi **chỉ định danh**: nút, avatar + tên, menu tài khoản
(tên, email, mở hồ sơ Ducker ID, đăng xuất). Điểm cao và cài đặt không đổi.
Spec chung: `web-game/docs/superpowers/specs/2026-10-04-ducker-id-sign-in-design.md`.

## Quyết định

- Cờ `NEXT_PUBLIC_FEATURE_DUCKER_SIGN_IN` (chỉ chuỗi `true`) **và** đủ bốn biến
  `NEXT_PUBLIC_DUCKER_{ISSUER,CLIENT_ID,SCOPE,PROFILE_PATH}` mới bật; thiếu là
  không render gì. Không có giá trị mặc định trong code.
- `deploy.yml` không truyền cờ lẫn `DUCKER_*` → GitHub Pages không bao giờ hiện nút
  ("ship tối"). Chỉ chạy được ở local.
- `GITHUB_PAGES` + basePath viết cứng được thay bằng `NEXT_PUBLIC_BASE_PATH`
  (deploy.yml đặt `/${{ github.event.repository.name }}`; trống = gốc).
- Hồ sơ chỉ giữ trong bộ nhớ: tải lại trang = đăng xuất. Lỗi xác thực lặng lẽ về
  trạng thái chưa đăng nhập. Một client_id cho mỗi game.
- Không thêm dependency nào. Test component dùng `react-dom/client` + `act` (repo
  không có Testing Library); `vitest.config.ts` mở rộng include sang `*.test.tsx`
  và bật JSX runtime tự động.

## Ngoại lệ có giới hạn so với "không tài khoản / không mạng"

Repo không có tài liệu NFR riêng; ràng buộc liên quan là spec gốc §9 (không tài khoản)
và việc game chạy hoàn toàn offline. Ngoại lệ, đúng một câu:

> sessionStorage khóa `ducker.pkce` duy nhất, xóa khi quay lại; mạng chỉ tới issuer đã
> cấu hình, và tới URL ảnh đại diện mà nó trả về, chỉ sau khi đăng nhập; không gì cả
> khi cờ tắt.

Ảnh đại diện (`<img src={profile.picture}>`) có thể ở host khác và không bị giới hạn.
Cờ tắt thì không đọc `location.search`, không chạm storage, không gọi mạng — e2e
`ducker-sign-in-off.spec.ts` kiểm điều đó.

## Nợ `[skip release]`

Commit của PR này mang `[skip release]` theo lựa chọn của chủ dự án. `release.yml`
quét cả dải commit từ tag cuối, nên mọi push sau đó lên `main` cũng bị bỏ qua cho
đến khi có tag mới. Lần release thật kế tiếp phải cắt tay một lần:

```
pnpm release:next
git tag vX.Y.Z && git push origin vX.Y.Z
gh release create vX.Y.Z --notes "$(pnpm -s release:notes)"
```

Sau đó dải sạch và tự động hóa chạy lại.

## Hệ quả

- Đưa lên production sau này cần: đăng ký client cho game ở Ducker ID admin (redirect
  URI `https://levananhduc.github.io/web-game-duck-flap/`), thêm origin vào
  `CORS_ORIGINS` của server, rồi đặt cờ + `DUCKER_*` làm repository variables và truyền
  trong `deploy.yml`.
- e2e dev server chuyển sang cổng cố định 3410 (flag tắt) / 3411 (flag bật, issuer giả
  `http://ducker.test`) để không đụng Ducker ID (3000) và game khác (3100).
