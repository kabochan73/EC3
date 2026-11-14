import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/shared/lib/api-client", () => ({
  apiClientFetch: vi.fn(),
}));

import { apiClientFetch } from "@/shared/lib/api-client";
import { AccountLink } from "../AccountLink";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("AccountLink", () => {
  beforeEach(() => {
    vi.mocked(apiClientFetch).mockReset();
  });

  it("未ログインならLoginを/loginへのリンクとして表示する", async () => {
    vi.mocked(apiClientFetch).mockResolvedValue({ ok: false } as Response);

    render(<AccountLink />, { wrapper });

    await waitFor(() => expect(screen.getByText("Login")).toBeInTheDocument());
    expect(screen.getByRole("link")).toHaveAttribute("href", "/login");
  });

  it("ログイン中ならAccountを/accountへのリンクとして表示する", async () => {
    vi.mocked(apiClientFetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 1, name: "あおい", email: "aoi@example.com", role: "customer" } }),
    } as Response);

    render(<AccountLink />, { wrapper });

    await waitFor(() => expect(screen.getByText("Account")).toBeInTheDocument());
    expect(screen.getByRole("link")).toHaveAttribute("href", "/account");
  });
});
