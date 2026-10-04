import type { NextConfig } from "next";

/**
 * GitHub Pages phục vụ trang ở đường dẫn con /<tên-repo>, còn khi chạy ở máy
 * thì ở gốc. Biến NEXT_PUBLIC_BASE_PATH chỉ được workflow deploy đặt; trống
 * hoặc không đặt nghĩa là gốc, nên `pnpm dev` và `pnpm build` ở máy vẫn chạy
 * ở gốc như bình thường.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  /**
   * Game chạy hoàn toàn phía client nên xuất được ra HTML tĩnh — không cần
   * máy chủ Node, host ở đâu cũng được.
   */
  output: "export",
  basePath,
  assetPrefix: basePath,
  trailingSlash: true,
  images: { unoptimized: true }
};

export default nextConfig;
