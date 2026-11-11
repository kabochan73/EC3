import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ContentImageUpload } from "../components/ContentImageUpload";

vi.mock("@/shared/lib/api-client", () => ({
  apiClientFetch: vi.fn(),
}));

import { apiClientFetch } from "@/shared/lib/api-client";

describe("ContentImageUpload", () => {
  beforeEach(() => {
    vi.mocked(apiClientFetch).mockReset();
  });

  it("画像が無ければNO IMAGEとUploadラベルを表示する", () => {
    render(<ContentImageUpload contentKey="hero" image={null} onChange={vi.fn()} />);

    expect(screen.getByText("NO IMAGE")).toBeInTheDocument();
    expect(screen.getByText("Upload")).toBeInTheDocument();
  });

  it("画像があればプレビュー・Replace・Removeを表示する", () => {
    render(
      <ContentImageUpload
        contentKey="hero"
        image={{ url: "/media/content/hero/1.jpg", alt: "既存画像" }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByAltText("既存画像")).toBeInTheDocument();
    expect(screen.getByText("Replace")).toBeInTheDocument();
    expect(screen.getByText("Remove")).toBeInTheDocument();
  });

  it("アップロード成功で返ってきたURLをonChangeに渡す", async () => {
    vi.mocked(apiClientFetch).mockResolvedValue({
      ok: true,
      json: async () => ({ url: "/media/content/hero/new.jpg" }),
    } as Response);
    const onChange = vi.fn();

    render(<ContentImageUpload contentKey="hero" image={null} onChange={onChange} />);

    const file = new File(["dummy"], "photo.jpg", { type: "image/jpeg" });
    const input = screen.getByLabelText("Upload", { selector: "input" });
    await userEvent.upload(input, file);

    expect(apiClientFetch).toHaveBeenCalledWith(
      "/api/admin/content/hero/images",
      expect.objectContaining({ method: "POST" }),
    );
    expect(onChange).toHaveBeenCalledWith({ url: "/media/content/hero/new.jpg", alt: null });
  });

  it("Removeを押すとonChange(null)を呼ぶ", async () => {
    const onChange = vi.fn();

    render(
      <ContentImageUpload
        contentKey="hero"
        image={{ url: "/1.jpg", alt: null }}
        onChange={onChange}
      />,
    );

    await userEvent.click(screen.getByText("Remove"));

    expect(onChange).toHaveBeenCalledWith(null);
  });
});
