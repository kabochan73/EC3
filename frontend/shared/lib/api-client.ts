// Client Component専用。ブラウザが直接Laravelに書き込みリクエストを送る
// （credentials: 'include' + CSRF。docs/api/public.md「ブラウザからの呼び出し」）。
//
// GET/HEAD以外は、先にXSRF-TOKEN Cookieが無ければGET /sanctum/csrf-cookieで
// プライムし、X-XSRF-TOKENヘッダに載せる。レスポンスは中継せずそのまま返す
// （422の{ message, errors }をフォームがそのまま使えるように）。

const API = process.env.NEXT_PUBLIC_API_URL!;

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function ensureCsrfCookie(): Promise<void> {
  if (readCookie("XSRF-TOKEN")) return;
  await fetch(`${API}/sanctum/csrf-cookie`, { credentials: "include" });
}

export async function apiClientFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  if (method !== "GET" && method !== "HEAD") {
    await ensureCsrfCookie();
    headers.set("X-XSRF-TOKEN", readCookie("XSRF-TOKEN") ?? "");
  }

  return fetch(`${API}${path}`, { ...init, headers, credentials: "include" });
}
