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

import { apiServerFetch, ApiError } from "@/shared/lib/api-server";
import { getMyOrder, getMyOrders } from "../api";

describe("getMyOrders", () => {
  beforeEach(() => {
    vi.mocked(apiServerFetch).mockReset();
  });

  it("/api/ordersを呼び、dataを返す", async () => {
    const orders = [
      { order_number: "EC-20261114-0001", status: "pending", total: 1000, item_count: 1, placed_at: null },
    ];
    vi.mocked(apiServerFetch).mockResolvedValue({ data: orders });

    const result = await getMyOrders();

    expect(apiServerFetch).toHaveBeenCalledWith("/api/orders");
    expect(result).toEqual(orders);
  });
});

describe("getMyOrder", () => {
  beforeEach(() => {
    vi.mocked(apiServerFetch).mockReset();
  });

  it("/api/orders/{order_number}を呼び、dataを返す", async () => {
    const order = { order_number: "EC-20261114-0001" };
    vi.mocked(apiServerFetch).mockResolvedValue({ data: order });

    const result = await getMyOrder("EC-20261114-0001");

    expect(apiServerFetch).toHaveBeenCalledWith("/api/orders/EC-20261114-0001");
    expect(result).toEqual(order);
  });

  it("404のときはnullを返す", async () => {
    vi.mocked(apiServerFetch).mockRejectedValue(new ApiError(404, null));

    const result = await getMyOrder("EC-00000000-0001");

    expect(result).toBeNull();
  });

  it("404以外のエラーは再throwする", async () => {
    vi.mocked(apiServerFetch).mockRejectedValue(new ApiError(500, null));

    await expect(getMyOrder("EC-20261114-0001")).rejects.toThrow(ApiError);
  });
});
