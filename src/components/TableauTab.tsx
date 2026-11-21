"use client";

// TableauTab.tsx
// lets the user step through every simplex iteration. it has previous /
// next buttons and a dropdown to jump to any iteration. for the chosen
// iteration it shows the tableau with a "basic solution" row at the bottom
// layout: a flex column; the navigation row wraps on small screens
//
// new in task 5.1: the pivot of the shown iteration is highlighted in the table
// (see DataTable.tsx), the final iteration has no pivot, so nothing is marked

import { useState } from "react";
import DataTable, { type PivotHighlight } from "./DataTable";
import type { TableauStep } from "@/lib/types";

/**
 * builds the table highlight of one step
 *
 * @param step - the iteration being shown
 * @returns the pivot position, or `undefined` when the step has no pivot
 *
 * @remarks
 * both numbers must exist, a half answer from the api marks nothing instead of a wrong cell
 * the check is `typeof`, so a `null` from the api is treated like a missing value
 *
 * @example
 * ```ts
 * pivotOf({ ...step, pivotRow: 2, pivotCol: 5 }); // { row: 2, col: 5 }
 * pivotOf(lastStep);                              // undefined
 * ```
 */
function pivotOf(step: TableauStep): PivotHighlight | undefined {
  if (typeof step.pivotRow !== "number" || typeof step.pivotCol !== "number") return undefined;
  return { row: step.pivotRow, col: step.pivotCol };
}

/**
 * simplex tableau viewer with iteration navigation and pivot highlight
 *
 * @param props.steps - every saved iteration, iteration 0 first
 *
 * @remarks
 * the page remounts this with a new `key` on every solve, so the index starts at 0 again
 *
 * edge cases:
 * - the index is clamped when reading the step, so it never goes past the last one
 * - the "basic solution" row is added at the bottom of the rows, the pivot row index
 *   still matches because that row is always last
 *
 * @example
 * ```tsx
 * <TableauTab key={runId} steps={result.tableaus!} />
 * ```
 */
export default function TableauTab({ steps }: { steps: TableauStep[] }) {
  const [index, setIndex] = useState(0); // which iteration is shown

  // guard so the index never goes past the last step
  const step = steps[Math.min(index, steps.length - 1)];

  // basic solution row; the extra "" fills the solution column
  const basicRow = [...step.basic, ""];

  // iteration 0 is the starting tableau
  const title = step.iteration === 0 ? "Initial tableau (iteration 0)" : `Iteration ${step.iteration}`;

  return (
    <div className="flex flex-col gap-3.5">
      {/* navigation: previous, dropdown, next */}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn" onClick={() => setIndex(index - 1)} disabled={index === 0}>
          Previous
        </button>
        <select className="field-input" value={index} onChange={(e) => setIndex(Number(e.target.value))}>
          {steps.map((s, i) => (
            <option key={i} value={i}>
              {s.iteration === 0 ? "Initial tableau" : `Iteration ${s.iteration}`}
            </option>
          ))}
        </select>
        <button type="button" className="btn" onClick={() => setIndex(index + 1)} disabled={index === steps.length - 1}>
          Next
        </button>
      </div>

      {/* the tableau rows plus the basic solution row at the bottom, pivot marked in gold */}
      <h3 className="subheading">{title}</h3>
      <DataTable
        corner=""
        columns={step.colNames}
        rowLabels={[...step.rowNames, "Basic solution"]}
        rows={[...step.values, basicRow]}
        highlight={pivotOf(step)}
      />
    </div>
  );
}

// references:
// react, useState: https://react.dev/reference/react/useState
// react, rendering lists (keys): https://react.dev/learn/rendering-lists
// react, you might not need an effect (resetting state with a key): https://react.dev/learn/you-might-not-need-an-effect#resetting-all-state-when-a-prop-changes
// typescript, importing types inline (import { type X }): https://www.typescriptlang.org/docs/handbook/modules/reference.html#type-modifiers-on-import-names
// mdn, typeof operator: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof
// tsdoc standard: https://tsdoc.org