import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ toString: (): string => "" })),
}));

vi.mock("@/shared/lib/api-server", async () => {
  const actual = await vi.importActual<typeof import("@/shared/lib/api-server")>(
    "@/shared/lib/api-server",
  );
  return { ...actual, apiServerFetch: vi.fn() };
});

import { apiServerFetch } from "@/shared/lib/api-server";
import { getAdminCustomer, getAdminCustomers } from "../api";

describe("getAdminCustomers", () => {
  beforeEach(() => {
    vi.mocked(apiServerFetch).mockReset();
  });

  it("オプション無しでは/api/admin/customersをクエリ無しで呼ぶ", async () => {
    vi.mocked(apiServerFetch).mockResolvedValue({ data: [], meta: { current_page: 1, last_page: 1 } });

    await getAdminCustomers();

    expect(apiServerFetch).toHaveBeenCalledWith("/api/admin/customers");
  });

  it("q/pageを指定すると対応するクエリ文字列を付ける", async () => {
    vi.mocked(apiServerFetch).mockResolvedValue({ data: [], meta: { current_page: 2, last_page: 3 } });

    await getAdminCustomers({ q: "あおい", page: 2 });

    expect(apiServerFetch).toHaveBeenCalledWith(
      `/api/admin/customers?q=${encodeURIComponent("あおい")}&page=2`,
    );
  });

  it("page=1は省略する", async () => {
    vi.mocked(apiServerFetch).mockResolvedValue({ data: [], meta: { current_page: 1, last_page: 1 } });

    await getAdminCustomers({ page: 1 });

    expect(apiServerFetch).toHaveBeenCalledWith("/api/admin/customers");
  });
});

describe("getAdminCustomer", () => {
  beforeEach(() => {
    vi.mocked(apiServerFetch).mockReset();
  });

  it("/api/admin/customers/{id}を呼び、dataを返す", async () => {
    const customer = { id: 1, name: "あおい", email: "aoi@example.com", orders_count: 0, joined_at: null };
    vi.mocked(apiServerFetch).mockResolvedValue({ data: customer });

    const result = await getAdminCustomer(1);

    expect(apiServerFetch).toHaveBeenCalledWith("/api/admin/customers/1");
    expect(result).toEqual(customer);
  });
});
