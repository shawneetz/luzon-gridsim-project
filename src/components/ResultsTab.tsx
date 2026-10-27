import DataTable from "./DataTable";
import { formatPeso } from "@/lib/format";
import type { SolveResponse } from "@/lib/types";

export default function ResultsTab({ result }: { result: SolveResponse }) {
  const { status, iterations, setup, cost, dispatch, prices } = result;

  if (status === "invalid" || status === "error") {
    return <p className="banner warning">{result.message}</p>;
  }

  return (
    <div className="stack">
      {status === "optimal" ? (
        <p className="banner success">Optimal solution found</p>
      ) : (
        <p className="banner warning">The problem is infeasible.</p>
      )}

      <div className="stats">
        {cost !== undefined && <Stat label="Total minimum cost, Z" value={formatPeso(cost)} />}
        <Stat label="Number of iterations" value={String(iterations)} />
        <Stat label="Unknowns" value={String(setup?.unknowns)} />
        <Stat label="Constraints" value={String(setup?.constraints)} />
      </div>

      {dispatch && (
        <>
          <h3>Output of each plant group (MW)</h3>
          <DataTable corner="Plant group" columns={dispatch.blocks} rowLabels={dispatch.groups} rows={dispatch.values} />
        </>
      )}

      {prices && (
        <>
          <h3>Price of electricity (₱ per MWh)</h3>
          <DataTable corner="Block" columns={prices.blocks} rowLabels={["Price = S / 4"]} rows={[prices.values]} />
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}
