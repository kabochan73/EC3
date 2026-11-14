import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { LoginForm } from "../components/LoginForm";

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock("@/shared/lib/api-client", () => ({
  apiClientFetch: vi.fn(),
}));

import { apiClientFetch } from "@/shared/lib/api-client";

function renderWithQueryClient(ui: React.ReactElement) {
  const client = new QueryClient();
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("LoginForm", () => {
  beforeEach(() => {
    pushMock.mockClear();
    refreshMock.mockClear();
    vi.mocked(apiClientFetch).mockReset();
  });

  it("成功時はredirectTo先へ遷移する", async () => {
    vi.mocked(apiClientFetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 1, name: "Aoi", email: "aoi@example.com", role: "customer" } }),
    } as Response);

    renderWithQueryClient(<LoginForm redirectTo="/account/orders" />);

    await userEvent.type(screen.getByLabelText("Email"), "aoi@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/account/orders"));
    expect(refreshMock).toHaveBeenCalled();
  });

  it("422エラーはフィールド下に表示される", async () => {
    vi.mocked(apiClientFetch).mockResolvedValue({
      ok: false,
      json: async () => ({ message: "資格情報が一致しません。", errors: { email: ["資格情報が一致しません。"] } }),
    } as Response);

    renderWithQueryClient(<LoginForm redirectTo={null} />);

    await userEvent.type(screen.getByLabelText("Email"), "aoi@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "wrong-password");
    await userEvent.click(screen.getByRole("button", { name: /login/i }));

    expect(await screen.findByText("資格情報が一致しません。")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("未入力ではクライアント側のバリデーションエラーが出る", async () => {
    renderWithQueryClient(<LoginForm redirectTo={null} />);

    await userEvent.click(screen.getByRole("button", { name: /login/i }));

    expect(await screen.findByText("パスワードを入力してください")).toBeInTheDocument();
    expect(apiClientFetch).not.toHaveBeenCalled();
  });
});
