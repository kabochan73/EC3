import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const saveMock = vi.fn();

vi.mock("../hooks/useContentSave", () => ({
  useContentSave: () => ({
    save: saveMock,
    isSaving: false,
    error: null,
    savedAt: null,
  }),
}));

import { ConceptSection } from "../components/ConceptSection";

describe("ConceptSection", () => {
  beforeEach(() => {
    saveMock.mockReset();
  });

  it("初期値をtextareaに表示する", () => {
    render(<ConceptSection initial={{ body: "既存の本文" }} />);

    expect(screen.getByRole("textbox")).toHaveValue("既存の本文");
  });

  it("編集してSaveを押すと現在の入力値でsaveを呼ぶ", async () => {
    render(<ConceptSection initial={{ body: "既存の本文" }} />);

    const textarea = screen.getByRole("textbox");
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "新しい本文");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(saveMock).toHaveBeenCalledWith({ body: "新しい本文" });
  });
});
