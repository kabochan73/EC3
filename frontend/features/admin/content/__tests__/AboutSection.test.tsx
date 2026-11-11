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

vi.mock("../components/ContentImageUpload", () => ({
  ContentImageUpload: ({ image }: { image: { url: string } | null }) => (
    <div data-testid="image-slot">{image?.url ?? "empty"}</div>
  ),
}));

import { AboutSection } from "../components/AboutSection";

describe("AboutSection", () => {
  beforeEach(() => {
    saveMock.mockReset();
  });

  it("初期ブロックの内容を表示する", () => {
    render(
      <AboutSection
        initial={{
          blocks: [{ label: "Since 2026", heading: "Our Story", body: "本文", image_url: null }],
        }}
      />,
    );

    expect(screen.getByDisplayValue("Since 2026")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Our Story")).toBeInTheDocument();
    expect(screen.getByDisplayValue("本文")).toBeInTheDocument();
  });

  it("Add Blockで空ブロックが増える", async () => {
    render(<AboutSection initial={{ blocks: [] }} />);

    await userEvent.click(screen.getByText("+ Add Block"));

    expect(screen.getByPlaceholderText("Label (e.g. Since 2026)")).toBeInTheDocument();
  });

  it("Deleteでブロックを削除できる", async () => {
    render(
      <AboutSection
        initial={{
          blocks: [
            { label: "A", heading: "HA", body: "BA", image_url: null },
            { label: "B", heading: "HB", body: "BB", image_url: null },
          ],
        }}
      />,
    );

    await userEvent.click(screen.getAllByText("Delete")[0]);

    expect(screen.queryByDisplayValue("A")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("B")).toBeInTheDocument();
  });

  it("編集してSaveを押すとblocks全体でsaveを呼ぶ", async () => {
    render(
      <AboutSection
        initial={{ blocks: [{ label: "A", heading: "H", body: "B", image_url: null }] }}
      />,
    );

    await userEvent.clear(screen.getByDisplayValue("A"));
    await userEvent.type(screen.getByPlaceholderText("Label (e.g. Since 2026)"), "新ラベル");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(saveMock).toHaveBeenCalledWith({
      blocks: [{ label: "新ラベル", heading: "H", body: "B", image_url: null }],
    });
  });
});
