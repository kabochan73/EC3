import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import { AccountMenu } from "../AccountMenu";

function renderMenu(isAdmin: boolean) {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <AccountMenu isAdmin={isAdmin} />
    </QueryClientProvider>,
  );
}

describe("AccountMenu", () => {
  it("Orders/Addresses/Profile/Logoutを表示する", () => {
    renderMenu(false);

    expect(screen.getByRole("link", { name: "Orders" })).toHaveAttribute("href", "/account/orders");
    expect(screen.getByRole("link", { name: "Addresses" })).toHaveAttribute(
      "href",
      "/account/addresses",
    );
    expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute("href", "/account/profile");
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
  });

  it("adminでなければAdmin Panelは出さない", () => {
    renderMenu(false);

    expect(screen.queryByRole("link", { name: "Admin Panel" })).not.toBeInTheDocument();
  });

  it("adminならAdmin Panelを出す", () => {
    renderMenu(true);

    expect(screen.getByRole("link", { name: "Admin Panel" })).toHaveAttribute("href", "/admin");
  });
});
