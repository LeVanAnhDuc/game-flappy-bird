declare namespace NodeJS {
  interface ProcessEnv {
    /** Đường dẫn con khi host ở GitHub Pages (vd "/web-game-duck-flap"). Trống = gốc. */
    NEXT_PUBLIC_BASE_PATH?: string;
    /** Cờ tính năng đăng nhập Ducker ID — chỉ chuỗi "true" mới bật. */
    NEXT_PUBLIC_FEATURE_DUCKER_SIGN_IN?: string;
    NEXT_PUBLIC_DUCKER_ISSUER?: string;
    NEXT_PUBLIC_DUCKER_CLIENT_ID?: string;
    NEXT_PUBLIC_DUCKER_SCOPE?: string;
    NEXT_PUBLIC_DUCKER_PROFILE_PATH?: string;
  }
}
