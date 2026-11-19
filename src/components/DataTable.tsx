// a small reusable table used by both the results tab and the tableau tab
// it shows a corner label, column names, row labels, and the cell values
// numbers are formatted nicely and zeros get a dim style
// the header row and the first column stay in place while scrolling (sticky)
//
// optional extras (the tableau tab uses none of them):
//   highlight   a grid of booleans, true cells turn gold (used for plants at full capacity)
//   footerRows  extra rows under the data, like a total row and a demand row
//
// styling (edit the class constants below):
//   cell    = shared padding and line for every th and td
//   colHead = top header cells,  rowHead = first column cells,  corner = top-left cell
//   goldCell = look of a highlighted cell, footerTone = colors of each footer row type

import { formatNumber } from "@/lib/format";

/** one extra row shown under the data rows */
export interface FooterRow {
  /** label in the first column, e.g. "Total supply" */
  label: string;
  /** one value per column, same order as `columns` */
  values: readonly (number | string)[];
  /** which look the row gets, see `footerTone` */
  tone: "total" | "demand";
}

/** props for the {@link DataTable} component */
interface Props {
  corner: string;                // text in the top-left cell
  columns: string[];             // column headers
  rowLabels: string[];           // label at the start of each row
  rows: (number | string)[][];   // the cell values, one array per row
  /** same shape as `rows`, true = draw the cell in gold (default: no highlight) */
  highlight?: boolean[][];
  /** extra rows under the data, kept apart from `rows` (default: none) */
  footerRows?: readonly FooterRow[];
}

// shared by every cell
const cell = "whitespace-nowrap border-b border-line px-2.5 py-1";
// column headers stick to the top
const colHead = `${cell} sticky top-0 z-20 bg-head text-right text-gold`;
// row labels stick to the left
const rowHead = `${cell} sticky left-0 z-10 border-r bg-rowhead text-left text-green`;
// top-left corner sticks both ways, so it sits above everything
const corner = `${cell} sticky left-0 top-0 z-30 bg-head text-left text-gold`;

// a cell at full capacity: gold block with dark text, like a highlighted item in game
// it has no hover color on purpose, so the row hover does not wash the gold out
const goldCell = "bg-gold text-ink";

// colors of the footer rows, written in full so tailwind can find every class
// total = gold like the other totals in the app, demand = the redstone color of the chart line
const footerTone = {
  total: { head: "text-gold", cell: "text-gold" },
  demand: { head: "text-redstone", cell: "text-redstone" },
} as const;

// a thicker line above the first footer row separates it from the data rows
const footerDivider = "border-t-2 border-t-dim";

/**
 * dark data table with sticky header and first column, optional gold cells and footer rows
 *
 * @param props - see {@link Props}
 *
 * @remarks
 * has no state and no hooks, so it needs no "use client" of its own
 *
 * edge cases:
 * - `highlight` is read by row and column position, a missing row or cell is treated as
 *   not highlighted, so a shorter grid never crashes
 * - a highlighted cell also gets a `title`, so the meaning is not only the color
 * - footer rows are not sticky at the bottom, the table is short, and the tableau tab
 *   (the tall one) does not use them
 * - a footer value of 0 is dimmed like a zero in the data rows, so an empty block is easy to see
 * - the first footer row gets the divider, the following ones do not
 *
 * @example
 * ```tsx
 * <DataTable
 *   corner="Plant group"
 *   columns={["B1", "B2"]}
 *   rowLabels={["Wind"]}
 *   rows={[[400, 120]]}
 *   highlight={[[true, false]]}
 *   footerRows={[{ label: "Total supply", values: [400, 120], tone: "total" }]}
 * />
 * ```
 */
export default function DataTable({
  corner: cornerText,
  columns,
  rowLabels,
  rows,
  highlight,
  footerRows = [],
}: Props) {
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
              {row.map((cellValue, j) => {
                const isFull = highlight?.[i]?.[j] === true;
                return (
                  // gold wins over the zero dim and the hover color
                  // format numbers, show text as is
                  <td
                    key={j}
                    title={isFull ? "At full capacity" : undefined}
                    className={`${cell} text-right ${
                      isFull ? goldCell : `group-hover:bg-row-hover ${cellValue === 0 ? "text-dim" : ""}`
                    }`}
                  >
                    {typeof cellValue === "number" ? formatNumber(cellValue) : cellValue}
                  </td>
                );
              })}
            </tr>
          ))}

          {/* footer rows: total supply, demand, ... they sit in the same tbody so the columns line up */}
          {footerRows.map((footer, i) => {
            const tone = footerTone[footer.tone];
            const divider = i === 0 ? footerDivider : "";
            return (
              <tr key={footer.label} className="group">
                <th className={`${rowHead} ${divider} ${tone.head}`}>{footer.label}</th>
                {footer.values.map((value, j) => (
                  <td
                    key={j}
                    className={`${cell} ${divider} text-right group-hover:bg-row-hover ${
                      value === 0 ? "text-dim" : tone.cell
                    }`}
                  >
                    {typeof value === "number" ? formatNumber(value) : value}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// references:
// react, rendering lists (keys): https://react.dev/learn/rendering-lists
// react, conditional rendering: https://react.dev/learn/conditional-rendering
// typescript, readonly arrays: https://www.typescriptlang.org/docs/handbook/2/objects.html#readonly-properties
// typescript, const assertions (as const): https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-inference
// mdn, optional chaining (?.): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining
// mdn, title attribute: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/title
// mdn, position: sticky: https://developer.mozilla.org/en-US/docs/Web/CSS/position#sticky_positioning
// mdn, border-collapse and border-spacing: https://developer.mozilla.org/en-US/docs/Web/CSS/border-spacing
// tailwind css v4, border-style and width: https://tailwindcss.com/docs/border-width
// tailwind css v4, hover, focus and other states (group): https://tailwindcss.com/docs/hover-focus-and-other-states
// tsdoc standard: https://tsdoc.org