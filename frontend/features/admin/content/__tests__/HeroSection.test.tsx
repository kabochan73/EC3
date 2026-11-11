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

import { HeroSection } from "../components/HeroSection";

describe("HeroSection", () => {
  beforeEach(() => {
    saveMock.mockReset();
  });

  it("初期値をheadline/tagline入力欄と画像行に表示する", () => {
    render(
      <HeroSection
        initial={{ headline: "MINIMAL.", tagline: "Essentials.", images: [{ url: "/1.jpg", alt: null }] }}
      />,
    );

    expect(screen.getByLabelText("Headline")).toHaveValue("MINIMAL.");
    expect(screen.getByLabelText("Tagline")).toHaveValue("Essentials.");
    expect(screen.getByTestId("image-slot")).toHaveTextContent("/1.jpg");
  });

  it("編集してSaveを押すと現在の値でsaveを呼ぶ（urlが空の画像行は除外）", async () => {
    render(<HeroSection initial={{ headline: "H", tagline: "T", images: [{ url: "/1.jpg", alt: null }] }} />);

    await userEvent.clear(screen.getByLabelText("Headline"));
    await userEvent.type(screen.getByLabelText("Headline"), "新しい見出し");
    await userEvent.click(screen.getByText("+ Add Image"));
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(saveMock).toHaveBeenCalledWith({
      headline: "新しい見出し",
      tagline: "T",
      images: [{ url: "/1.jpg", alt: null }],
    });
  });
});
