"use client";

import { useState } from "react";
import DataTable from "./DataTable";
import type { TableauStep } from "@/lib/types";

export default function TableauTab({ steps }: { steps: TableauStep[] }) {
  const [index, setIndex] = useState(0);
  const step = steps[Math.min(index, steps.length - 1)];
  const basicRow = [...step.basic, ""];
  const title = step.iteration === 0 ? "Initial tableau (iteration 0)" : `Iteration ${step.iteration}`;

  return (
    <div className="stack">
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
