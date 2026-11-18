// thin layout file for the results of one solve
// it decides what to show for each status and puts the pieces in order:
//   - StatusBanner   success or infeasible banner
//   - StatGrid       cost, iterations, unknowns, constraints
//   - DispatchChart  stacked bars of mw per plant group per block
//   - DataTable      output of each plant group
//   - PriceRow       price of electricity per block
// the pieces own their own styling, this file only owns the order and the grid
//
// layout (edit the tailwind classes below):
//   chart + tables: one column on small screens, two equal columns from xl up (xl:grid-cols-2)
//   task 4.2 will change this layout, this commit keeps it exactly as it was

import DataTable from "./DataTable";
import DispatchChart from "./DispatchChart";
import PriceRow from "./PriceRow";
import StatGrid from "./StatGrid";
import StatusBanner from "./StatusBanner";
import type { SolveResponse } from "@/lib/types";

/** props for the {@link ResultsTab} component */
interface ResultsTabProps {
  /** the full response from `POST /solve`, whatever its status */
  result: SolveResponse;
}

/**
 * shows the outcome of one solve: banner, summary numbers, chart, table and prices
 *
 * @param props - see {@link ResultsTabProps}
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
 * - `min-w-0` on the grid columns lets a column shrink instead of pushing the other one out
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

  return (
    // flex column with an even gap between every section
    <div className="flex flex-col gap-3.5">
      {/* success banner or infeasible banner, status is "optimal" or "infeasible" here */}
      <StatusBanner status={status} />

      {/* summary numbers; cost only exists when the problem is optimal */}
      <StatGrid cost={cost} iterations={iterations} unknowns={setup?.unknowns} constraints={setup?.constraints} />

      {/* only exists when the problem is optimal.
          two columns from xl up: chart on the left, table and prices on the right */}
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
            <PriceRow blocks={prices.blocks} values={prices.values} />
          </div>
        </div>
      )}
    </div>
  );
}

// references:
// react, thinking in react (splitting the ui into components): https://react.dev/learn/thinking-in-react
// react, conditional rendering: https://react.dev/learn/conditional-rendering
// typescript, narrowing: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
// tailwind css v4, grid template columns: https://tailwindcss.com/docs/grid-template-columns
// tailwind css v4, min-width: https://tailwindcss.com/docs/min-width
// next.js, server and client components: https://nextjs.org/docs/app/getting-started/server-and-client-components
// tsdoc standard: https://tsdoc.org