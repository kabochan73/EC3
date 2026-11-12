import type { SizeChart } from "../types";

type Props = {
  chart: SizeChart;
};

/** size_chart（jsonb）を表でレンダリング。nullのカテゴリ（アクセサリー等）は呼び出し側が出さない。 */
export function SizeChartTable({ chart }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr>
            <th className="py-1 pr-4 text-graphite uppercase">Size</th>
            {chart.columns.map((column) => (
              <th key={column} className="py-1 pr-4 text-graphite uppercase">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(chart.rows).map(([size, values]) => (
            <tr key={size} className="border-t border-mist">
              <td className="py-1 pr-4">{size}</td>
              {values.map((value, index) => (
                <td key={index} className="py-1 pr-4">
                  {value}
                  {chart.unit}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
