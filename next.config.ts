import type { NextConfig } from "next";

/**
 * GitHub Pages phục vụ trang ở đường dẫn con /<tên-repo>, còn khi chạy ở máy
 * thì ở gốc. Biến GITHUB_PAGES chỉ được workflow deploy đặt, nên `pnpm dev`
 * và `pnpm build` ở máy vẫn chạy ở gốc như bình thường.
 */
const isGithubPages = process.env.GITHUB_PAGES === "true";
const basePath = "/web-game-duck-flap";

const nextConfig: NextConfig = {
  /**
   * Game chạy hoàn toàn phía client nên xuất được ra HTML tĩnh — không cần
   * máy chủ Node, host ở đâu cũng được.
   */
  output: "export",
  basePath: isGithubPages ? basePath : undefined,
  assetPrefix: isGithubPages ? basePath : undefined,
  trailingSlash: true,
  images: { unoptimized: true }
};

export default nextConfig;
