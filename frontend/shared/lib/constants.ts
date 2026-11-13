// Sanctumが発行するセッションCookie名（docs/backend/auth.md）。
export const SESSION_COOKIE_NAME = "ecp_session";

// カート（zustand persist）のlocalStorageキー。
export const CART_STORAGE_KEY = "ecp-cart";

// backend/config/shop.phpと値を合わせる（表示用の概算計算に使う）。
// 確定額はPOST /api/ordersでサーバー側が再計算するので、ここがズレても実害は無い。
export const SHIPPING_FEE = 800;
export const FREE_SHIPPING_THRESHOLD = 20_000;

// 1明細あたりの最大数量（backend/config/shop.phpのcart_max_quantity_per_line）。
export const CART_MAX_QUANTITY_PER_LINE = 10;
