import { describe, it, expect } from "vitest";
import { safeRedirect } from "@/shared/lib/safe-redirect";

describe("safeRedirect", () => {
  it("サイト内の絶対パスはそのまま使う", () => {
    expect(safeRedirect("/account/orders")).toBe("/account/orders");
  });

  it("未指定なら/accountにフォールバックする", () => {
    expect(safeRedirect(null)).toBe("/account");
    expect(safeRedirect(undefined)).toBe("/account");
    expect(safeRedirect("")).toBe("/account");
  });

  it("プロトコル相対URL（オープンリダイレクト）は拒否する", () => {
    expect(safeRedirect("//evil.example")).toBe("/account");
  });

  it("外部URLは拒否する", () => {
    expect(safeRedirect("https://evil.example")).toBe("/account");
  });
});
