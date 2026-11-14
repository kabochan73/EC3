import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { useCartStore } from "@/features/public/cart/stores/cart";
import type { Address } from "../../types";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/shared/lib/api-client", () => ({
  apiClientFetch: vi.fn(),
}));

vi.mock("@/features/public/cart/hooks/useCartValidation", () => ({
  useCartValidation: () => ({
    getValidation: (item: { variantId: number }) => ({ variant_id: item.variantId, available: true }),
    loading: false,
    error: false,
  }),
}));

vi.mock("@/features/public/cart/stores/cart", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/public/cart/stores/cart")>();
  return { ...actual, useCartHydrated: () => true };
});

import { apiClientFetch } from "@/shared/lib/api-client";
import { CheckoutClient } from "../CheckoutClient";

function makeAddress(overrides: Partial<Address> = {}): Address {
  return {
    id: 1,
    recipient_name: "田中 葵",
    postal_code: "150-0001",
    prefecture: "東京都",
    city: "渋谷区",
    address_line1: "1-2-3",
    address_line2: null,
    phone: "09012345678",
    is_default: true,
    ...overrides,
  };
}

beforeEach(() => {
  pushMock.mockClear();
  vi.mocked(apiClientFetch).mockReset();
  useCartStore.setState({ items: [] });
});

describe("CheckoutClient", () => {
  it("カートが空ならContinue Shoppingを出す", () => {
    render(<CheckoutClient addresses={[]} />);

    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
  });

  it("defaultの住所が最初から選択されている", () => {
    useCartStore.setState({
      items: [
        {
          variantId: 1,
          productSlug: "boxy-tee",
          productName: "ボクシーTシャツ",
          size: "M",
          color: null,
          unitPrice: 5000,
          quantity: 1,
          imageUrl: null,
        },
      ],
    });

    render(<CheckoutClient addresses={[makeAddress()]} />);

    expect(screen.getByText("田中 葵")).toBeInTheDocument();
    expect(screen.queryByLabelText("Recipient Name")).not.toBeInTheDocument();
  });

  it("既存の住所IDでPlace Orderすると/checkout/paymentへ遷移する", async () => {
    const user = userEvent.setup();
    useCartStore.setState({
      items: [
        {
          variantId: 1,
          productSlug: "boxy-tee",
          productName: "ボクシーTシャツ",
          size: "M",
          color: null,
          unitPrice: 5000,
          quantity: 1,
          imageUrl: null,
        },
      ],
    });
    vi.mocked(apiClientFetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { order_number: "EC-20261114-0001" } }),
    } as Response);

    render(<CheckoutClient addresses={[makeAddress()]} />);
    await user.click(screen.getByRole("button", { name: "Place Order" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/checkout/payment?order=EC-20261114-0001"));
    expect(apiClientFetch).toHaveBeenCalledWith(
      "/api/orders",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ items: [{ variant_id: 1, quantity: 1 }], address_id: 1 }),
      }),
    );
  });

  it("住所が1件も無ければ新規入力フォームから始まる", () => {
    useCartStore.setState({
      items: [
        {
          variantId: 1,
          productSlug: "boxy-tee",
          productName: "ボクシーTシャツ",
          size: "M",
          color: null,
          unitPrice: 5000,
          quantity: 1,
          imageUrl: null,
        },
      ],
    });

    render(<CheckoutClient addresses={[]} />);

    expect(screen.getByLabelText("Recipient Name")).toBeInTheDocument();
  });

  it("422エラーのaddress.xxxはフィールド下に表示される", async () => {
    const user = userEvent.setup();
    useCartStore.setState({
      items: [
        {
          variantId: 1,
          productSlug: "boxy-tee",
          productName: "ボクシーTシャツ",
          size: "M",
          color: null,
          unitPrice: 5000,
          quantity: 1,
          imageUrl: null,
        },
      ],
    });
    vi.mocked(apiClientFetch).mockResolvedValue({
      ok: false,
      json: async () => ({
        message: "The given data was invalid.",
        errors: { "address.postal_code": ["123-4567の形式で入力してください"] },
      }),
    } as Response);

    render(<CheckoutClient addresses={[]} />);
    await user.type(screen.getByLabelText("Recipient Name"), "田中 葵");
    await user.type(screen.getByLabelText("Postal Code"), "150-0001");
    await user.type(screen.getByLabelText("Prefecture"), "東京都");
    await user.type(screen.getByLabelText("City"), "渋谷区");
    await user.type(screen.getByLabelText("Address Line 1"), "1-2-3");
    await user.type(screen.getByLabelText("Phone"), "09012345678");
    await user.click(screen.getByRole("button", { name: "Place Order" }));

    expect(await screen.findByText("123-4567の形式で入力してください")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
