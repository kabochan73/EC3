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

// ContentImageUploadはアップロードUIの詳細を持つため、ここでは行の識別だけできれば十分
vi.mock("../components/ContentImageUpload", () => ({
  ContentImageUpload: ({ image }: { image: { url: string } | null }) => (
    <div data-testid="image-slot">{image?.url ?? "empty"}</div>
  ),
}));

import { LookbookSection } from "../components/LookbookSection";

describe("LookbookSection", () => {
  beforeEach(() => {
    saveMock.mockReset();
  });

  it("初期画像を行として表示する", () => {
    render(
      <LookbookSection
        initial={{ images: [{ url: "/1.jpg", alt: null }, { url: "/2.jpg", alt: null }] }}
      />,
    );

    expect(screen.getAllByTestId("image-slot")).toHaveLength(2);
  });

  it("Add Imageで空の行が増える", async () => {
    render(<LookbookSection initial={{ images: [] }} />);

    await userEvent.click(screen.getByText("+ Add Image"));

    expect(screen.getAllByTestId("image-slot")).toHaveLength(1);
    expect(screen.getByTestId("image-slot")).toHaveTextContent("empty");
  });

  it("Deleteで行を削除できる", async () => {
    render(
      <LookbookSection
        initial={{ images: [{ url: "/1.jpg", alt: null }, { url: "/2.jpg", alt: null }] }}
      />,
    );

    await userEvent.click(screen.getAllByText("Delete")[0]);

    const slots = screen.getAllByTestId("image-slot");
    expect(slots).toHaveLength(1);
    expect(slots[0]).toHaveTextContent("/2.jpg");
  });

  it("▼で行を後ろに移動できる", async () => {
    render(
      <LookbookSection
        initial={{ images: [{ url: "/1.jpg", alt: null }, { url: "/2.jpg", alt: null }] }}
      />,
    );

    await userEvent.click(screen.getAllByText("▼")[0]);

    const slots = screen.getAllByTestId("image-slot");
    expect(slots[0]).toHaveTextContent("/2.jpg");
    expect(slots[1]).toHaveTextContent("/1.jpg");
  });

  it("Saveを押すとurlが空の行を除外してsaveを呼ぶ", async () => {
    render(<LookbookSection initial={{ images: [{ url: "/1.jpg", alt: null }] }} />);

    await userEvent.click(screen.getByText("+ Add Image"));
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(saveMock).toHaveBeenCalledWith({ images: [{ url: "/1.jpg", alt: null }] });
  });
});
