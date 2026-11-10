"use client";

// TableauTab.tsx
// lets the user step through every simplex iteration. it has previous /
// next buttons and a dropdown to jump to any iteration. for the chosen
// iteration it shows the tableau with a "basic solution" row at the bottom.
// layout: a flex column; the navigation row wraps on small screens.

import { useState } from "react";
import DataTable from "./DataTable";
import type { TableauStep } from "@/lib/types";

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

      {/* the tableau rows plus the basic solution row at the bottom */}
      <h3 className="subheading">{title}</h3>
      <DataTable
        corner=""
        columns={step.colNames}
        rowLabels={[...step.rowNames, "Basic solution"]}
        rows={[...step.values, basicRow]}
      />
    </div>
  );
}