import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SizeChartEditor } from "../components/SizeChartEditor";
import type { SizeChart } from "../types";

describe("SizeChartEditor", () => {
  it("初期値がnullならHas Size Chartは未チェックで、onChangeは呼ばれていない", () => {
    const onChange = vi.fn();
    render(<SizeChartEditor initialValue={null} onChange={onChange} />);

    expect(screen.getByLabelText("Has Size Chart")).not.toBeChecked();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("チェックして列・サイズごとの数値を入れるとSizeChartを組み立ててonChangeする", async () => {
    const onChange = vi.fn();
    render(<SizeChartEditor initialValue={null} onChange={onChange} />);

    await userEvent.click(screen.getByLabelText("Has Size Chart"));
    await userEvent.type(screen.getByLabelText(/Columns/), "着丈,身幅");
    await userEvent.type(screen.getByLabelText(/^S（/), "65,48");
    await userEvent.type(screen.getByLabelText(/^M（/), "67,50");

    expect(onChange).toHaveBeenLastCalledWith({
      unit: "cm",
      columns: ["着丈", "身幅"],
      rows: { S: [65, 48], M: [67, 50] },
    });
  });

  it("数値が無いサイズは行ごと省く", async () => {
    const onChange = vi.fn();
    render(<SizeChartEditor initialValue={null} onChange={onChange} />);

    await userEvent.click(screen.getByLabelText("Has Size Chart"));
    await userEvent.type(screen.getByLabelText(/Columns/), "着丈");
    await userEvent.type(screen.getByLabelText(/^FREE（/), "70");

    const last = onChange.mock.calls.at(-1)?.[0] as SizeChart;
    expect(last.rows).toEqual({ FREE: [70] });
  });

  it("チェックを外すとonChangeにnullを渡す", async () => {
    const onChange = vi.fn();
    render(
      <SizeChartEditor
        initialValue={{ unit: "cm", columns: ["着丈"], rows: { S: [65] } }}
        onChange={onChange}
      />,
    );

    await userEvent.click(screen.getByLabelText("Has Size Chart"));

    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("初期値を渡すとカンマ区切りテキストに復元される", () => {
    render(
      <SizeChartEditor
        initialValue={{ unit: "cm", columns: ["着丈", "身幅"], rows: { S: [65, 48] } }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Has Size Chart")).toBeChecked();
    expect(screen.getByLabelText(/Columns/)).toHaveValue("着丈,身幅");
    expect(screen.getByLabelText(/^S（/)).toHaveValue("65,48");
  });
});
