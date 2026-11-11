import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { SESSION_COOKIE_NAME } from "@/shared/lib/constants";

function makeRequest(path: string, withSession = false): NextRequest {
  const headers = new Headers();
  if (withSession) {
    headers.set("cookie", `${SESSION_COOKIE_NAME}=dummy-session-value`);
  }
  return new NextRequest(new URL(path, "http://localhost:3000"), { headers });
}

describe("proxy", () => {
  it("未ログインで/accountにアクセスすると/login?redirect=/accountへリダイレクトする", () => {
    const res = proxy(makeRequest("/account"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login?redirect=%2Faccount");
  });

  it("ログイン済み（Cookie有り）で/accountにアクセスするとそのまま通す", () => {
    const res = proxy(makeRequest("/account", true));

    expect(res.headers.get("location")).toBeNull();
  });

  it("保護されていないパスはCookieが無くても素通りする", () => {
    const res = proxy(makeRequest("/"));

    expect(res.headers.get("location")).toBeNull();
  });

  it("ネストしたパス（/admin/products）も保護される", () => {
    const res = proxy(makeRequest("/admin/products"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://localhost:3000/login?redirect=%2Fadmin%2Fproducts",
    );
  });

  it("/checkoutも保護される", () => {
    const res = proxy(makeRequest("/checkout"));

    expect(res.status).toBe(307);
  });
});
