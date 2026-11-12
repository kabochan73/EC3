import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { SizeChartTable } from "../components/SizeChartTable";

describe("SizeChartTable", () => {
  it("columnsを見出しに、各サイズの行を数値+unitで表示する", () => {
    render(
      <SizeChartTable
        chart={{
          unit: "cm",
          columns: ["着丈", "身幅"],
          rows: { S: [65, 48], M: [67, 50] },
        }}
      />,
    );

    expect(screen.getByText("着丈")).toBeInTheDocument();
    expect(screen.getByText("身幅")).toBeInTheDocument();
    expect(screen.getByText("S")).toBeInTheDocument();
    expect(screen.getByText("65cm")).toBeInTheDocument();
    expect(screen.getByText("50cm")).toBeInTheDocument();
  });
});
