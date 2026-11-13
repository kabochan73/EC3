import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { QueryProvider } from "../QueryProvider";

describe("QueryProvider", () => {
  it("子要素を描画する", () => {
    render(
      <QueryProvider>
        <p>子要素</p>
      </QueryProvider>,
    );

    expect(screen.getByText("子要素")).toBeInTheDocument();
  });
});
