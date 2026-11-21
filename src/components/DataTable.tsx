// DataTable.tsx
// a small reusable table used by both the results tab and the tableau tab
// it shows a corner label, column names, row labels, and the cell values
// numbers are formatted nicely and zeros get a dim style
// the header row and the first column stay in place while scrolling (sticky)
//
// new in task 5.1: an optional `highlight` prop marks the pivot of a simplex step
//   pivot column   tinted gold (header, row label stays as is, body cells)
//   pivot row      tinted gold (row label and body cells)
//   pivot element  solid gold with dark text, where the row and column cross
//
// styling (edit the class constants below):
//   cell    = shared padding and line for every th and td
//   colHead = top header cells,  rowHead = first column cells,  corner = top-left cell
//   the *Pivot constants are added on top of the normal look of a cell

import { formatNumber } from "@/lib/format";

/** the pivot position to mark, both numbers are 0-based and index into `rows` and `columns` */
export interface PivotHighlight {
  /** index of the pivot row in `rows` */
  row: number;
  /** index of the pivot column in `columns` */
  col: number;
}

/** props for the {@link DataTable} component */
interface Props {
  corner: string;                // text in the top-left cell
  columns: string[];             // column headers
  rowLabels: string[];           // label at the start of each row
  rows: (number | string)[][];   // the cell values, one array per row
  /** pivot to mark, leave it out for a plain table (default: none) */
  highlight?: PivotHighlight;
}

// shared by every cell
const cell = "whitespace-nowrap border-b border-line px-2.5 py-1";
// column headers stick to the top
const colHead = `${cell} sticky top-0 z-20 bg-head text-right text-gold`;
// row labels stick to the left
const rowHead = `${cell} sticky left-0 z-10 border-r bg-rowhead text-left text-green`;
// top-left corner sticks both ways, so it sits above everything
const corner = `${cell} sticky left-0 top-0 z-30 bg-head text-left text-gold`;

// pivot looks
// header and row label are sticky, so their tint must be solid (a see-through
// tint would show the cells scrolling underneath), the body cells can be see-through
const colHeadPivot = "bg-[#5c4a10]";                  // solid dark gold, pivot column header
const rowHeadPivot = "bg-[#5c4a10]";                  // solid dark gold, pivot row label
const cellPivotLine = "bg-gold/15";                   // soft gold tint, rest of the pivot row and column
const cellPivotElement = "bg-gold font-bold text-ink"; // solid gold, the pivot element itself

/**
 * works out the extra classes of one body cell
 *
 * @param isPivotRow - true when the cell is in the pivot row
 * @param isPivotCol - true when the cell is in the pivot column
 * @returns the pivot classes, or an empty string for a normal cell
 *
 * @remarks
 * the element (row and column both match) wins over the tint, and the zero dimming is
 * skipped by the caller for it, because a pivot is never zero
 *
 * @example
 * ```ts
 * pivotCellClass(true, true);   // "bg-gold font-bold text-ink"
 * pivotCellClass(true, false);  // "bg-gold/15"
 * pivotCellClass(false, false); // ""
 * ```
 */
function pivotCellClass(isPivotRow: boolean, isPivotCol: boolean): string {
  if (isPivotRow && isPivotCol) return cellPivotElement;
  if (isPivotRow || isPivotCol) return cellPivotLine;
  return "";
}

/**
 * dark scrollable table with sticky headers and an optional pivot highlight
 *
 * @param props - see {@link Props}
 *
 * @remarks
 * has no state and no hooks, so it needs no "use client" of its own
 *
 * edge cases:
 * - without `highlight` nothing changes, so the results tab uses it exactly as before
 * - a `highlight` that points outside the table (row or column too big) marks nothing,
 *   because the checks compare indexes and never read the cells
 * - the "Basic solution" row of the tableau tab is the last row, a pivot never
 *   points at it, because the api only picks pivots inside the tableau rows
 * - the hover tint (`group-hover:bg-row-hover`) is declared after the pivot tint in the class list,
 *   so hovering a pivot row still shows the hover color, the pivot element stays gold
 *   because it is the strongest class and sits on the cell itself
 *
 * @example
 * ```tsx
 * <DataTable corner="" columns={cols} rowLabels={rowNames} rows={values} highlight={{ row: 2, col: 5 }} />
 * ```
 */
export default function DataTable({ corner: cornerText, columns, rowLabels, rows, highlight }: Props) {
  return (
    // scrollable box so wide tableaus do not break the page (change max-h to resize)
    <div className="screen max-h-[560px] overflow-auto">
      <table className="border-separate border-spacing-0 font-body text-table text-white tabular-nums">
        <thead>
          <tr>
            <th className={corner}>{cornerText}</th>
            {columns.map((name, j) => (
              <th key={j} className={`${colHead} ${highlight?.col === j ? colHeadPivot : ""}`}>
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            // "group" lets the cells react when the row is hovered
            <tr key={i} className="group">
              <th className={`${rowHead} ${highlight?.row === i ? rowHeadPivot : ""}`}>{rowLabels[i]}</th>
              {row.map((cellValue, j) => {
                const isPivotRow = highlight?.row === i;
                const isPivotCol = highlight?.col === j;
                const isElement = isPivotRow && isPivotCol;
                // dim the zeros (never on the pivot element); format numbers, show text as is
                const dim = cellValue === 0 && !isElement ? "text-dim" : "";
                return (
                  <td
                    key={j}
                    className={`${cell} text-right ${pivotCellClass(isPivotRow, isPivotCol)} ${
                      isElement ? "" : "group-hover:bg-row-hover"
                    } ${dim}`}
                  >
                    {typeof cellValue === "number" ? formatNumber(cellValue) : cellValue}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// references:
// react, rendering lists (keys): https://react.dev/learn/rendering-lists
// react, conditional rendering: https://react.dev/learn/conditional-rendering
// typescript, optional properties: https://www.typescriptlang.org/docs/handbook/2/objects.html#optional-properties
// mdn, optional chaining (?.): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining
// tailwind css v4, background color (opacity modifier like bg-gold/15): https://tailwindcss.com/docs/background-color
// tailwind css v4, hover, focus and other states (group-hover): https://tailwindcss.com/docs/hover-focus-and-other-states
// mdn, position: sticky: https://developer.mozilla.org/en-US/docs/Web/CSS/position
// cmsc 150 laboratory topic 5, simplex method (pivot element, pivot row and column)
// tsdoc standard: https://tsdoc.org