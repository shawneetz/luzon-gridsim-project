// ResultsTab.tsx
// shows what the solver returned:
//   - a status banner ("advancement made!" when optimal, "you died!" when infeasible)
//   - stat boxes (cost, iterations, unknowns, constraints)
//   - the stacked dispatch chart and the dispatch table
//   - the price slots, with the price colored from green (cheap) to red (expensive)
//
// layout (edit the tailwind classes below):
//   stat boxes: a 5 column grid (md:grid-cols-5). the cost box has col-span-2,
//               so it is twice as wide. change it to col-span-3 to widen it more.
//   price slots: 3 columns on small screens, 6 columns from md up (one per block)

import DataTable from "./DataTable";
import DispatchChart from "./DispatchChart";
import { formatPeso } from "@/lib/format";
import { blockIcons } from "@/lib/plants";
import type { SolveResponse } from "@/lib/types";

// turns a price into a color between green (cheapest) and red (most expensive)
function heatColor(price: number, min: number, max: number): string {
  const share = max === min ? 0 : (price - min) / (max - min); // 0 = cheapest, 1 = priciest
  const hue = 120 - share * 120;                                // 120 = green, 0 = red
  return `hsl(${hue}, 100%, 65%)`;
}

export default function ResultsTab({ result }: { result: SolveResponse }) {
  const { status, iterations, setup, cost, dispatch, prices } = result;

  // bad input or a server error: just show the message, nothing to chart
  if (status === "invalid" || status === "error") {
    return <p className="banner border-red text-red">{result.message}</p>;
  }

  // range of the prices, used to color the price slots
  const minPrice = prices ? Math.min(...prices.values) : 0;
  const maxPrice = prices ? Math.max(...prices.values) : 0;

  return (
    // flex column with an even gap between every section
    <div className="flex flex-col gap-3.5">
      {/* success banner or infeasible banner */}
      {status === "optimal" ? (
        <div className="banner flex flex-col gap-1 border-slot">
          <span className="font-pixel text-pixel-button text-gold">Advancement Made!</span>
          <span>Optimal solution found</span>
        </div>
      ) : (
        <div className="banner animate-shake border-black bg-death py-6 text-center">
          <span className="mb-2 block font-pixel text-pixel-death [text-shadow:4px_4px_0_#3f0000]">You Died!</span>
          <span>The problem is infeasible.</span>
        </div>
      )}

      {/* summary numbers; cost only exists when the problem is optimal */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {/* col-span-2 makes the cost box twice as wide because its number is long */}
        {cost !== undefined && <Stat label="Total minimum cost, Z" value={formatPeso(cost)} className="col-span-2" />}
        <Stat label="Number of iterations" value={String(iterations)} />
        <Stat label="Unknowns" value={String(setup?.unknowns)} />
        <Stat label="Constraints" value={String(setup?.constraints)} />
      </div>

      {/* chart and table of mw per plant group per block */}
      {dispatch && (
        <>
          <h3 className="subheading">Dispatch vs demand (MW)</h3>
          <DispatchChart groups={dispatch.groups} blocks={dispatch.blocks} values={dispatch.values} />

          <h3 className="subheading">Output of each plant group (MW)</h3>
          <DataTable corner="Plant group" columns={dispatch.blocks} rowLabels={dispatch.groups} rows={dispatch.values} />
        </>
      )}

      {/* one price slot per block */}
      {prices && (
        <>
          <h3 className="subheading">Price of electricity (₱ per MWh)</h3>
          <div className="grid grid-cols-3 gap-1.5 md:grid-cols-6">
            {prices.blocks.map((block, t) => (
              <div key={block} className="slot cursor-default p-2 text-center">
                <div className="font-pixel text-pixel-label text-ink">
                  {blockIcons[t]} {block}
                </div>
                {/* the price sits on a dark plate, colored green (cheap) to red (expensive) */}
                <div
                  className="mt-1.5 bg-screen px-1 py-0.5 text-price"
                  style={{ color: heatColor(prices.values[t], minPrice, maxPrice) }}
                >
                  {prices.values[t].toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// one stat box with a label on top and a big value below.
// pass className to change its size in the grid, e.g. "col-span-2"
function Stat({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`screen flex min-w-0 flex-col px-3 py-2.5 ${className}`}>
      <span className="text-small text-label">{label}</span>
      {/* break-words lets a very long number wrap instead of overflowing the box */}
      <span className="warp-break-word text-stat leading-[1.1] text-gold gold-shadow">{value}</span>
    </div>
  );
}