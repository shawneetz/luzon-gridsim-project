// ResultsTab.tsx
// shows what the solver returned:
//   - a status banner 
//   - stat boxes 
//   - the dispatch chart on the left, and on its right the dispatch table
//     and the price slots 
//
// layout:
//   stat boxes: a 5 column grid (md:grid-cols-5). the cost box has col-span-2,
//               so it is twice as wide. change it to col-span-3 to widen it more
//   chart + tables: one column on small screens, two equal columns from xl up (xl:grid-cols-2)
//   price slots: 3 columns (two rows of three blocks)

import DataTable from "./DataTable";
import DispatchChart from "./DispatchChart";
import { formatPeso } from "@/lib/format";
import { blockIcons } from "@/lib/plants";
import type { SolveResponse } from "@/lib/types";

/**
 * turns a price into a color between green (cheapest) and red (most expensive)
 *
 * @param price - the price to color, in ₱ per MWh
 * @param min - the lowest price among all blocks
 * @param max - the highest price among all blocks
 * @returns an `hsl()` string, hue 120 (green) at `min` down to hue 0 (red) at `max`
 *
 * @remarks
 * when every block has the same price (`min === max`) the share is 0,
 * so everything is green instead of dividing by zero
 */
function heatColor(price: number, min: number, max: number): string {
  const share = max === min ? 0 : (price - min) / (max - min); // 0 = cheapest, 1 = priciest
  const hue = 120 - share * 120;                                // 120 = green, 0 = red
  return `hsl(${hue}, 100%, 65%)`;
}

/** props for the {@link ResultsTab} component */
interface ResultsTabProps {
  /** the full response from `POST /solve`, whatever its status */
  result: SolveResponse;
}

/**
 * shows the outcome of one solve: banner, summary numbers, chart, table and prices
 *
 * @remarks
 * has no state and no hooks, so it could render on the server, but it is
 * imported by the client page, so it ends up in the client bundle
 *
 * edge cases:
 * - `status` of "invalid" or "error": only the message is shown
 * - `status` of "infeasible": the banner and the counts are shown, but there
 *   is no cost, chart, table or prices (the api does not send them)
 * - `status` of "optimal": everything is shown
 *
 * @example
 * ```tsx
 * <ResultsTab result={result} />
 * ```
 */
export default function ResultsTab({ result }: ResultsTabProps) {
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

      {/* only exists when the problem is optimal.
          two columns from xl up: chart on the left, table and prices on the right.
          min-w-0 lets a column shrink instead of pushing the other one out */}
      {dispatch && prices && (
        <div className="grid grid-cols-1 items-start gap-3.5 xl:grid-cols-2">
          {/* left column: chart of mw per plant group per block */}
          <div className="flex min-w-0 flex-col gap-3.5">
            <h3 className="subheading">Dispatch vs demand (MW)</h3>
            <DispatchChart groups={dispatch.groups} blocks={dispatch.blocks} values={dispatch.values} />
          </div>

          {/* right column: the table, then the price slots below it */}
          <div className="flex min-w-0 flex-col gap-3.5">
            <h3 className="subheading">Output of each plant group (MW)</h3>
            <DataTable corner="Plant group" columns={dispatch.blocks} rowLabels={dispatch.groups} rows={dispatch.values} />

            <h3 className="subheading">Price of electricity (₱ per MWh)</h3>
            {/* one price slot per block */}
            <div className="grid grid-cols-3 gap-1.5">
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
          </div>
        </div>
      )}
    </div>
  );
}

/** props for the {@link Stat} box */
interface StatProps {
  /** small label shown above the value, e.g. "Number of iterations" */
  label: string;
  /** the already formatted value, e.g. "₱1,149,843,800.00" */
  value: string;
  /** extra tailwind classes for the grid size, e.g. "col-span-2" (default: none) */
  className?: string;
}

/**
 * one stat box with a label on top and a big value below
 *
 * @remarks
 * `wrap-break-word` lets a very long number wrap instead of overflowing the box
 * (the old `warp-break-word` was a typo and did nothing)
 *
 * @example
 * ```tsx
 * <Stat label="Unknowns" value="42" />
 * ```
 */
function Stat({ label, value, className = "" }: StatProps) {
  return (
    <div className={`screen flex min-w-0 flex-col px-3 py-2.5 ${className}`}>
      <span className="text-small text-label">{label}</span>
      <span className="wrap-break-word text-stat leading-[1.1] text-gold gold-shadow">{value}</span>
    </div>
  );
}