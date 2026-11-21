"use client";

// TableauTab.tsx
// lets the user step through every simplex iteration
// top: an xp bar strip that shows "iteration n of total" (see XpBar.tsx), click it
// or focus it and use the arrow keys to move
// below it: first, previous, a dropdown to jump to any iteration, next and last
// then the title, a one line pivot summary (see PivotSummary.tsx), and the tableau of
// the chosen iteration with a "basic solution" row at the bottom and the pivot marked in
// gold (see DataTable.tsx)
// layout: a flex column; the button row wraps on small screens

import { useState } from "react";
import DataTable, { type PivotHighlight } from "./DataTable";
import PivotSummary from "./PivotSummary";
import XpBar from "./XpBar";
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
 * simplex tableau viewer with an xp bar, iteration buttons, pivot summary and pivot highlight
 *
 * @param props.steps - every saved iteration, iteration 0 first
 *
 * @remarks
 * the page remounts this with a new `key` on every solve, so the index starts at 0 again
 *
 * edge cases:
 * - the index is the position in `steps`, not the iteration number, the label and the
 *   dropdown use `step.iteration` so they show the number the solver gave
 * - `go` clamps every move, so the buttons, the bar and the dropdown can never push
 *   the index outside the list
 * - the bar and the buttons share one `go`, so they can never disagree about the index
 * - with a single step the bar is full and every navigation button is disabled
 * - the "basic solution" row is added at the bottom of the rows, the pivot row index
 *   still matches because that row is always last
 * - the summary gets the plain `step`, not the rows with the basic solution added, so it
 *   reads the pivot element from the real tableau values
 *
 * @example
 * ```tsx
 * <TableauTab key={runId} steps={result.tableaus!} />
 * ```
 */
export default function TableauTab({ steps }: { steps: TableauStep[] }) {
  const [index, setIndex] = useState(0); // which iteration is shown

  const last = steps.length - 1;

  /** moves to a position in the list, never outside of it */
  function go(position: number) {
    setIndex(Math.min(last, Math.max(0, position)));
  }

  // guard so the index never goes past the last step
  const step = steps[Math.min(index, last)];

  // basic solution row; the extra "" fills the solution column
  const basicRow = [...step.basic, ""];

  // iteration 0 is the starting tableau
  const title = step.iteration === 0 ? "Initial tableau (iteration 0)" : `Iteration ${step.iteration}`;

  // text on the xp bar, uses the iteration number of the last step as the total
  const barLabel =
    step.iteration === 0
      ? `Initial tableau · ${steps[last].iteration} to go`
      : `Iteration ${step.iteration} of ${steps[last].iteration}`;

  return (
    <div className="flex flex-col gap-3.5">
      {/* xp bar: where we are in the run, click it or use the arrow keys */}
      <XpBar value={index} max={last} label={barLabel} ariaLabel="Simplex iteration" onChange={go} />

      {/* navigation: first, previous, dropdown, next, last */}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn" onClick={() => go(0)} disabled={index === 0}>
          First
        </button>
        <button type="button" className="btn" onClick={() => go(index - 1)} disabled={index === 0}>
          Previous
        </button>
        <select
          className="field-input"
          aria-label="Jump to iteration"
          value={index}
          onChange={(e) => go(Number(e.target.value))}
        >
          {steps.map((s, i) => (
            <option key={i} value={i}>
              {s.iteration === 0 ? "Initial tableau" : `Iteration ${s.iteration}`}
            </option>
          ))}
        </select>
        <button type="button" className="btn" onClick={() => go(index + 1)} disabled={index === last}>
          Next
        </button>
        <button type="button" className="btn" onClick={() => go(last)} disabled={index === last}>
          Last
        </button>
      </div>

      {/* title, then one line that says which pivot this iteration used */}
      <h3 className="subheading">{title}</h3>
      <PivotSummary step={step} />

      {/* the tableau rows plus the basic solution row at the bottom, pivot marked in gold */}
      <DataTable
        corner=""
        columns={step.colNames}
        rowLabels={[...step.rowNames, "Basic solution"]}
        rows={[...step.values, basicRow]}
        highlight={pivotOf(step)}
        label="Simplex tableau"
      />
    </div>
  );
}

// references:
// react, useState: https://react.dev/reference/react/useState
// react, rendering lists (keys): https://react.dev/learn/rendering-lists
// react, you might not need an effect (resetting state with a key): https://react.dev/learn/you-might-not-need-an-effect#resetting-all-state-when-a-prop-changes
// react, sharing state between components: https://react.dev/learn/sharing-state-between-components
// typescript, importing types inline (import { type X }): https://www.typescriptlang.org/docs/handbook/modules/reference.html#type-modifiers-on-import-names
// mdn, typeof operator: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof
// mdn, math.min and math.max: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/min
// wai-aria authoring practices, slider pattern: https://www.w3.org/WAI/ARIA/apg/patterns/slider/
// tsdoc standard: https://tsdoc.org