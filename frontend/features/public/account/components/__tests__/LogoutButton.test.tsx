import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock("@/shared/lib/api-client", () => ({
  apiClientFetch: vi.fn(),
}));

import { apiClientFetch } from "@/shared/lib/api-client";
import { LogoutButton } from "../LogoutButton";

describe("LogoutButton", () => {
  beforeEach(() => {
    pushMock.mockClear();
    refreshMock.mockClear();
    vi.mocked(apiClientFetch).mockReset();
  });

  it("クリックするとPOST /api/logoutを呼び、セッションをクリアしてトップへ遷移する", async () => {
    const user = userEvent.setup();
    vi.mocked(apiClientFetch).mockResolvedValue({ ok: true } as Response);
    const client = new QueryClient();
    client.setQueryData(["session"], { data: { id: 1 } });

    render(
      <QueryClientProvider client={client}>
        <LogoutButton />
      </QueryClientProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Logout" }));

    expect(apiClientFetch).toHaveBeenCalledWith("/api/logout", { method: "POST" });
    await waitFor(() => expect(client.getQueryData(["session"])).toBeNull());
    expect(pushMock).toHaveBeenCalledWith("/");
    expect(refreshMock).toHaveBeenCalled();
  });
});
