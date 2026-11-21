// PivotSummary.tsx
// one line above each tableau that says which pivot the solver used on that iteration
// example: "pivot column S3, pivot row x2, pivot element 7"
// the final iteration has no pivot, so it says that instead
// it uses the data from task 5.1 (pivotRow and pivotCol of the step), nothing new from the api
// it holds no state, the tableau tab passes the step in through props
//
// layout (edit the tailwind classes below):
//   a dark "screen" box with one line of text, the names and the number are gold
//   the line wraps on small screens instead of overflowing

import { formatNumber } from "@/lib/format";
import type { TableauStep } from "@/lib/types";

/** props for the {@link PivotSummary} component */
interface PivotSummaryProps {
  /** the iteration being shown */
  step: TableauStep;
}

/** the parts of a pivot, already turned into text the player can read */
interface PivotParts {
  /** name of the pivot column, e.g. "S3" */
  column: string;
  /** name of the pivot row, e.g. "x2" */
  row: string;
  /** the pivot element, formatted, e.g. "7" */
  element: string;
}

// look of the box and of the highlighted words
const box = "screen px-3 py-2 text-body text-white";
const term = "text-gold gold-shadow";

/**
 * reads the pivot of a step and turns it into names and a number
 *
 * @param step - the iteration being shown
 * @returns the pivot parts, or `null` when the step has no usable pivot
 *
 * @remarks
 * a pivot is only usable when both indexes are real numbers and they point inside
 * the tableau, so a half answer from the api shows the "no pivot" line instead of a
 * wrong name or the word "undefined"
 * the indexes are 0-based, the api already converted them (see `TableauStep` in `lib/types.ts`)
 *
 * @example
 * ```ts
 * pivotParts({ ...step, pivotRow: 1, pivotCol: 4 }); // { column: "S3", row: "x2", element: "7" }
 * pivotParts(lastStep);                              // null
 * ```
 */
function pivotParts(step: TableauStep): PivotParts | null {
  const { pivotRow, pivotCol } = step;
  if (typeof pivotRow !== "number" || typeof pivotCol !== "number") return null;

  const column = step.colNames[pivotCol];
  const row = step.rowNames[pivotRow];
  const element = step.values[pivotRow]?.[pivotCol];
  if (column === undefined || row === undefined || element === undefined) return null;

  return { column, row, element: formatNumber(element) };
}

/**
 * one line that explains the pivot of the shown iteration
 *
 * @param props - see {@link PivotSummaryProps}
 *
 * @remarks
 * has no state and no hooks, so it needs no "use client" of its own
 *
 * edge cases:
 * - the final iteration has no pivot, so the line says it is the final tableau,
 *   the words match the empty highlight in the table below
 * - `role="status"` is a polite live region, so screen readers read the new line
 *   when the player steps to another iteration
 * - the whole sentence stays plain text between the gold spans, so a screen reader
 *   reads it as one sentence
 *
 * @example
 * ```tsx
 * <PivotSummary step={step} />
 * ```
 */
export default function PivotSummary({ step }: PivotSummaryProps) {
  const parts = pivotParts(step);

  return (
    <p role="status" className={box}>
      {parts ? (
        <>
          pivot column <span className={term}>{parts.column}</span>, pivot row{" "}
          <span className={term}>{parts.row}</span>, pivot element <span className={term}>{parts.element}</span>
        </>
      ) : (
        <>Final tableau, no pivot is chosen</>
      )}
    </p>
  );
}

// references:
// react, conditional rendering: https://react.dev/learn/conditional-rendering
// react, passing props to a component: https://react.dev/learn/passing-props-to-a-component
// react, fragments: https://react.dev/reference/react/Fragment
// typescript, optional chaining and narrowing: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
// mdn, optional chaining (?.): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining
// mdn, status role: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role
// cmsc 150 laboratory topic 5, simplex method (pivot column, pivot row and pivot element)
// tsdoc standard: https://tsdoc.org