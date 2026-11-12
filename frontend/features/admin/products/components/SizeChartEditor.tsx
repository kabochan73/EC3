"use client";

import { useState } from "react";

import type { SizeChart } from "../types";

type Props = {
  initialValue: SizeChart | null;
  /** 編集のたびに今のSizeChart（またはnull）を親に伝える */
  onChange: (value: SizeChart | null) => void;
};

const SIZES = ["S", "M", "L", "FREE"] as const;

/** "66, 52,,46" → [66, 52, 46]（空欄と数字でないものは捨てる） */
function toNumbers(text: string): number[] {
  return text
    .split(",")
    .map((n) => n.trim())
    .filter((n) => n !== "" && !Number.isNaN(Number(n)))
    .map(Number);
}

function buildValue(
  enabled: boolean,
  unit: string,
  columnsText: string,
  rowsText: Record<string, string>,
): SizeChart | null {
  if (!enabled) return null;

  const columns = columnsText
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  // 数値が1つも無いサイズは行ごと省く（アクセサリーなど）
  const rows: Record<string, number[]> = {};
  for (const size of SIZES) {
    const numbers = toNumbers(rowsText[size] ?? "");
    if (numbers.length > 0) rows[size] = numbers;
  }

  return { unit, columns, rows };
}

/**
 * size_chart（jsonb）の簡易エディタ。列名・各サイズの数値はカンマ区切りのテキストで入れる
 * （例: 列「着丈,身幅,肩幅」、S「66,52,46」）。
 * 編集のたびにonChangeで親（ProductForm）へ今の値を伝えるcontrolledな部品。
 */
export function SizeChartEditor({ initialValue, onChange }: Props) {
  const [enabled, setEnabled] = useState(initialValue !== null);
  const [unit, setUnit] = useState(initialValue?.unit ?? "cm");
  const [columnsText, setColumnsText] = useState(initialValue?.columns.join(",") ?? "");
  const [rowsText, setRowsText] = useState<Record<string, string>>(() =>
    Object.fromEntries(SIZES.map((size) => [size, initialValue?.rows[size]?.join(",") ?? ""])),
  );

  function update(next: {
    enabled?: boolean;
    unit?: string;
    columnsText?: string;
    rowsText?: Record<string, string>;
  }) {
    const nextEnabled = next.enabled ?? enabled;
    const nextUnit = next.unit ?? unit;
    const nextColumnsText = next.columnsText ?? columnsText;
    const nextRowsText = next.rowsText ?? rowsText;

    if (next.enabled !== undefined) setEnabled(next.enabled);
    if (next.unit !== undefined) setUnit(next.unit);
    if (next.columnsText !== undefined) setColumnsText(next.columnsText);
    if (next.rowsText !== undefined) setRowsText(next.rowsText);

    onChange(buildValue(nextEnabled, nextUnit, nextColumnsText, nextRowsText));
  }

  const inputClass = "mt-2 w-full border-b border-ink bg-transparent py-2 text-sm outline-none";
  const labelClass = "block text-[11px] tracking-widest text-graphite uppercase";

  return (
    <div>
      <label className="flex items-center gap-2 text-[11px] tracking-widest text-graphite uppercase">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => update({ enabled: e.target.checked })}
        />
        Has Size Chart
      </label>

      {enabled && (
        <div className="mt-4 space-y-4 border border-mist p-4">
          <div>
            <label htmlFor="size_chart_unit" className={labelClass}>
              Unit
            </label>
            <input
              id="size_chart_unit"
              value={unit}
              onChange={(e) => update({ unit: e.target.value })}
              className={`${inputClass} w-24`}
            />
          </div>
          <div>
            <label htmlFor="size_chart_columns" className={labelClass}>
              Columns（カンマ区切り。例: 着丈,身幅,肩幅,袖丈）
            </label>
            <input
              id="size_chart_columns"
              value={columnsText}
              onChange={(e) => update({ columnsText: e.target.value })}
              className={inputClass}
            />
          </div>
          {SIZES.map((size) => (
            <div key={size}>
              <label htmlFor={`size_chart_${size}`} className={labelClass}>
                {size}（カンマ区切りの数値。列の順番に対応）
              </label>
              <input
                id={`size_chart_${size}`}
                value={rowsText[size]}
                onChange={(e) => update({ rowsText: { ...rowsText, [size]: e.target.value } })}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
