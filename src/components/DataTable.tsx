/*
 * DataTable.tsx
 * A small reusable table used by both the Results tab and the Tableau tab.
 * It shows a corner label, column names, row labels, and the cell values.
 * Numbers are formatted nicely and zeros get a dim style.
 */

import { formatNumber } from "@/lib/format";

interface Props {
  corner: string;                // text in the top-left cell
  columns: string[];             // column headers
  rowLabels: string[];           // label at the start of each row
  rows: (number | string)[][];   // the cell values, one array per row
}

export default function DataTable({ corner, columns, rowLabels, rows }: Props) {
  return (
    // Scrollable box so wide tableaus do not break the page
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>{corner}</th>
            {columns.map((name, j) => (
              <th key={j}>{name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <th>{rowLabels[i]}</th>
              {row.map((cell, j) => (
                // Dim the zeros; format numbers, show text as is
                <td key={j} className={cell === 0 ? "zero" : ""}>
                  {typeof cell === "number" ? formatNumber(cell) : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
