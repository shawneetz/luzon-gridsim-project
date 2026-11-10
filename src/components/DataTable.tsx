// DataTable.tsx
// a small reusable table used by both the results tab and the tableau tab.
// it shows a corner label, column names, row labels, and the cell values.
// numbers are formatted nicely and zeros get a dim style.
// the header row and the first column stay in place while scrolling (sticky).
//
// styling (edit the class constants below):
//   cell    = shared padding and line for every th and td
//   colHead = top header cells,  rowHead = first column cells,  corner = top-left cell

import { formatNumber } from "@/lib/format";

interface Props {
  corner: string;                // text in the top-left cell
  columns: string[];             // column headers
  rowLabels: string[];           // label at the start of each row
  rows: (number | string)[][];   // the cell values, one array per row
}

// shared by every cell
const cell = "whitespace-nowrap border-b border-line px-2.5 py-1";
// column headers stick to the top
const colHead = `${cell} sticky top-0 z-20 bg-head text-right text-gold`;
// row labels stick to the left
const rowHead = `${cell} sticky left-0 z-10 border-r bg-rowhead text-left text-green`;
// top-left corner sticks both ways, so it sits above everything
const corner = `${cell} sticky left-0 top-0 z-30 bg-head text-left text-gold`;

export default function DataTable({ corner: cornerText, columns, rowLabels, rows }: Props) {
  return (
    // scrollable box so wide tableaus do not break the page (change max-h to resize)
    <div className="screen max-h-[560px] overflow-auto">
      <table className="border-separate border-spacing-0 font-body text-table text-white tabular-nums">
        <thead>
          <tr>
            <th className={corner}>{cornerText}</th>
            {columns.map((name, j) => (
              <th key={j} className={colHead}>
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            // "group" lets the cells react when the row is hovered
            <tr key={i} className="group">
              <th className={rowHead}>{rowLabels[i]}</th>
              {row.map((cellValue, j) => (
                // dim the zeros; format numbers, show text as is
                <td
                  key={j}
                  className={`${cell} text-right group-hover:bg-row-hover ${cellValue === 0 ? "text-dim" : ""}`}
                >
                  {typeof cellValue === "number" ? formatNumber(cellValue) : cellValue}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}