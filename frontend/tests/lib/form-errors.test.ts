import { describe, it, expect, vi } from "vitest";
import { applyLaravelErrors } from "@/shared/lib/form-errors";

describe("applyLaravelErrors", () => {
  it("errorsがあれば各フィールドにsetErrorを呼び、nullを返す", () => {
    const setError = vi.fn();

    const result = applyLaravelErrors(
      { message: "The given data was invalid.", errors: { email: ["既に使われています"] } },
      setError,
      "失敗しました",
    );

    expect(setError).toHaveBeenCalledWith("email", { message: "既に使われています" });
    expect(result).toBeNull();
  });

  it("errorsが無ければmessageを返す", () => {
    const setError = vi.fn();

    const result = applyLaravelErrors({ message: "資格情報が一致しません" }, setError, "失敗しました");

    expect(setError).not.toHaveBeenCalled();
    expect(result).toBe("資格情報が一致しません");
  });

  it("bodyがnullならfallbackを返す", () => {
    const setError = vi.fn();

    const result = applyLaravelErrors(null, setError, "失敗しました");

    expect(result).toBe("失敗しました");
  });
});
