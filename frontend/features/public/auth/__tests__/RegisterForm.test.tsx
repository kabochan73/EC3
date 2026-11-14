import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { RegisterForm } from "../components/RegisterForm";

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

describe("RegisterForm", () => {
  beforeEach(() => {
    pushMock.mockClear();
    refreshMock.mockClear();
    vi.mocked(apiClientFetch).mockReset();
  });

  async function fillValidForm() {
    await userEvent.type(screen.getByLabelText("Name"), "Aoi Tanaka");
    await userEvent.type(screen.getByLabelText("Email"), "aoi@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.type(screen.getByLabelText("Confirm Password"), "password123");
  }

  it("成功時はredirectTo先へ遷移する", async () => {
    vi.mocked(apiClientFetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { id: 1, name: "Aoi Tanaka", email: "aoi@example.com", role: "customer" },
      }),
    } as Response);

    renderWithQueryClient(<RegisterForm redirectTo="/account/orders" />);
    await fillValidForm();
    await userEvent.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/account/orders"));
    expect(refreshMock).toHaveBeenCalled();
  });

  it("パスワードと確認が一致しないとクライアント側でエラーになる", async () => {
    renderWithQueryClient(<RegisterForm redirectTo={null} />);

    await userEvent.type(screen.getByLabelText("Name"), "Aoi Tanaka");
    await userEvent.type(screen.getByLabelText("Email"), "aoi@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.type(screen.getByLabelText("Confirm Password"), "different123");
    await userEvent.click(screen.getByRole("button", { name: /register/i }));

    expect(await screen.findByText("パスワードが一致しません")).toBeInTheDocument();
    expect(apiClientFetch).not.toHaveBeenCalled();
  });

  it("422エラー（メール重複）はフィールド下に表示される", async () => {
    vi.mocked(apiClientFetch).mockResolvedValue({
      ok: false,
      json: async () => ({
        message: "The given data was invalid.",
        errors: { email: ["このメールアドレスは既に使われています。"] },
      }),
    } as Response);

    renderWithQueryClient(<RegisterForm redirectTo={null} />);
    await fillValidForm();
    await userEvent.click(screen.getByRole("button", { name: /register/i }));

    expect(
      await screen.findByText("このメールアドレスは既に使われています。"),
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
