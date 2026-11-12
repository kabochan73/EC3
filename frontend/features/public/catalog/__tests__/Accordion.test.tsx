import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { Accordion } from "../components/Accordion";

describe("Accordion", () => {
  it("タイトルと中身を表示する", () => {
    render(
      <Accordion title="Description">
        <p>本文です。</p>
      </Accordion>,
    );

    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("本文です。")).toBeInTheDocument();
  });

  it("detailsは初期状態で閉じている", () => {
    render(
      <Accordion title="Description">
        <p>本文です。</p>
      </Accordion>,
    );

    expect(screen.getByText("Description").closest("details")).not.toHaveAttribute("open");
  });
});
