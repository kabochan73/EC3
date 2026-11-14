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
import { getAddresses } from "../api";

describe("getAddresses", () => {
  beforeEach(() => {
    vi.mocked(apiServerFetch).mockReset();
  });

  it("/api/addressesを呼び、dataを返す", async () => {
    const addresses = [
      {
        id: 1,
        recipient_name: "田中 葵",
        postal_code: "150-0001",
        prefecture: "東京都",
        city: "渋谷区",
        address_line1: "1-2-3",
        address_line2: null,
        phone: "09012345678",
        is_default: true,
      },
    ];
    vi.mocked(apiServerFetch).mockResolvedValue({ data: addresses });

    const result = await getAddresses();

    expect(apiServerFetch).toHaveBeenCalledWith("/api/addresses");
    expect(result).toEqual(addresses);
  });
});
