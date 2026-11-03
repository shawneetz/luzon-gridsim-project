/*
 * ResultsTab.tsx
 * Shows the answer from the solver: a status banner, summary numbers
 * (cost, iterations, unknowns, constraints), the plant output table (MW),
 * and the electricity price table (₱ per MWh). For invalid input or
 * errors it only shows the message.
 */

import DataTable from "./DataTable";
import { formatPeso } from "@/lib/format";
import type { SolveResponse } from "@/lib/types";

export default function ResultsTab({ result }: { result: SolveResponse }) {
  const { status, iterations, setup, cost, dispatch, prices } = result;

  // Bad input or a failed request: show only the message
  if (status === "invalid" || status === "error") {
    return <p className="banner warning">{result.message}</p>;
  }

  return (
    <div className="stack">
      {/* Green banner when solved, red banner when infeasible */}
      {status === "optimal" ? (
        <p className="banner success">Optimal solution found</p>
      ) : (
        <p className="banner warning">The problem is infeasible.</p>
      )}

      {/* Summary numbers. The cost exists only for an optimal solution. */}
      <div className="stats">
        {cost !== undefined && <Stat label="Total minimum cost, Z" value={formatPeso(cost)} />}
        <Stat label="Number of iterations" value={String(iterations)} />
        <Stat label="Unknowns" value={String(setup?.unknowns)} />
        <Stat label="Constraints" value={String(setup?.constraints)} />
      </div>

      {/* Output of each plant group in each block (only when optimal) */}
      {dispatch && (
        <>
          <h3>Output of each plant group (MW)</h3>
          <DataTable corner="Plant group" columns={dispatch.blocks} rowLabels={dispatch.groups} rows={dispatch.values} />
        </>
      )}

      {/* Electricity price per block (only when optimal) */}
      {prices && (
        <>
          <h3>Price of electricity (₱ per MWh)</h3>
          <DataTable corner="Block" columns={prices.blocks} rowLabels={["Price = S / 4"]} rows={[prices.values]} />
        </>
      )}
    </div>
  );
}

// One small summary box with a label and a value
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}
