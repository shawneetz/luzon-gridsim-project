/*
 * TableauTab.tsx
 * Lets the user step through every simplex iteration. It has Previous /
 * Next buttons and a dropdown to jump to any iteration. For the chosen
 * iteration it shows the tableau with a "Basic solution" row at the bottom.
 */

"use client";

import { useState } from "react";
import DataTable from "./DataTable";
import type { TableauStep } from "@/lib/types";

export default function TableauTab({ steps }: { steps: TableauStep[] }) {
  const [index, setIndex] = useState(0); // which iteration is shown

  // Guard so the index never goes past the last step
  const step = steps[Math.min(index, steps.length - 1)];

  // Basic solution row; the extra "" fills the Solution column
  const basicRow = [...step.basic, ""];
  const title = step.iteration === 0 ? "Initial tableau (iteration 0)" : `Iteration ${step.iteration}`;

  return (
    <div className="stack">
      {/* Navigation: Previous, dropdown, Next */}
      <div className="button-row">
        <button type="button" className="secondary" onClick={() => setIndex(index - 1)} disabled={index === 0}>
          Previous
        </button>
        <select value={index} onChange={(e) => setIndex(Number(e.target.value))}>
          {steps.map((s, i) => (
            <option key={i} value={i}>
              {s.iteration === 0 ? "Initial tableau" : `Iteration ${s.iteration}`}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="secondary"
          onClick={() => setIndex(index + 1)}
          disabled={index === steps.length - 1}
        >
          Next
        </button>
      </div>

      {/* The tableau rows plus the basic solution row at the bottom */}
      <h3>{title}</h3>
      <DataTable
        corner=""
        columns={step.colNames}
        rowLabels={[...step.rowNames, "Basic solution"]}
        rows={[...step.values, basicRow]}
      />
    </div>
  );
}
