// RESULTS TAB
// Shows what the solver returned:
//   - a status banner ("Advancement Made!" when optimal, "You Died!" when infeasible)
//   - stat boxes (cost, iterations, unknowns, constraints)
//   - the stacked dispatch chart and the dispatch table
//   - the price slots, with the price colored from green (cheap) to red (expensive)

import DataTable from "./DataTable";
import DispatchChart from "./DispatchChart";
import { formatPeso } from "@/lib/format";
import { blockIcons } from "@/lib/plants";
import type { SolveResponse } from "@/lib/types";

// Turns a price into a color between green (cheapest) and red (most expensive)
function heatColor(price: number, min: number, max: number): string {
  const share = max === min ? 0 : (price - min) / (max - min); // 0 = cheapest, 1 = priciest
  const hue = 120 - share * 120;                                // 120 = green, 0 = red
  return `hsl(${hue}, 100%, 65%)`;
}

export default function ResultsTab({ result }: { result: SolveResponse }) {
  const { status, iterations, setup, cost, dispatch, prices } = result;

  // Bad input or a server error: just show the message, nothing to chart
  if (status === "invalid" || status === "error") {
    return <p className="banner warning">{result.message}</p>;
  }

  // Range of the prices, used to color the price slots
  const minPrice = prices ? Math.min(...prices.values) : 0;
  const maxPrice = prices ? Math.max(...prices.values) : 0;

  return (
    <div className="stack">
      {status === "optimal" ? (
        <div className="banner success">
          <span className="toast-title">Advancement Made!</span>
          <span>Optimal solution found</span>
        </div>
      ) : (
        <div className="banner death">
          <span className="death-title">You Died!</span>
          <span>The problem is infeasible.</span>
        </div>
      )}

      <div className="stats">
        {cost !== undefined && <Stat label="Total minimum cost, Z" value={formatPeso(cost)} />}
        <Stat label="Number of iterations" value={String(iterations)} />
        <Stat label="Unknowns" value={String(setup?.unknowns)} />
        <Stat label="Constraints" value={String(setup?.constraints)} />
      </div>

      {dispatch && (
        <>
          <h3>Dispatch vs demand (MW)</h3>
          <DispatchChart groups={dispatch.groups} blocks={dispatch.blocks} values={dispatch.values} />

          <h3>Output of each plant group (MW)</h3>
          <DataTable corner="Plant group" columns={dispatch.blocks} rowLabels={dispatch.groups} rows={dispatch.values} />
        </>
      )}

      {prices && (
        <>
          <h3>Price of electricity (₱ per MWh)</h3>
          <div className="price-strip">
            {prices.blocks.map((block, t) => (
              <div
                key={block}
                className="price-cell"
                style={{ "--heat": heatColor(prices.values[t], minPrice, maxPrice) } as React.CSSProperties}
              >
                <div className="price-block">
                  {blockIcons[t]} {block}
                </div>
                <div className="price-value">{prices.values[t].toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// One small stat box
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}
