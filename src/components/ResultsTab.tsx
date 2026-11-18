// thin layout file for the results of one solve
// it decides what to show for each status and puts the pieces into three panels,
// so the results read top to bottom as summary, then picture, then numbers
//   1) summary   StatusBanner and StatGrid side by side in one row
//   2) dispatch  DispatchChart at full width, with PriceRow directly under it
//   3) table     DataTable of the output of each plant group
// the pieces own their own styling, this file only owns the order and the panels
//
// layout (edit the tailwind classes below):
//   summary row: stacked on small screens, one row from xl up (xl:flex-row)
//   the banner column is 15rem wide (xl:w-60), the stat boxes take the rest
//   every section is a .panel with a .heading, see the shared looks in the global stylesheet
//   task 4.3 will put a key insights card beside the table in section 3

import type { ReactNode } from "react";
import DataTable from "./DataTable";
import DispatchChart from "./DispatchChart";
import PriceRow from "./PriceRow";
import StatGrid from "./StatGrid";
import StatusBanner from "./StatusBanner";
import type { SolveResponse } from "@/lib/types";

/** props for the {@link Section} component */
interface SectionProps {
  /** heading shown at the top of the panel */
  title: string;
  /** what goes inside the panel, spaced evenly in a column */
  children: ReactNode;
}

/**
 * one titled panel of the results, used by all three sections so they look the same
 *
 * @param props - see {@link SectionProps}
 *
 * @remarks
 * a local helper on purpose: it is only used here, so it does not need its own file
 * `aria-label` names the region for screen readers, so they can jump between sections
 * this panel sits inside the big panel of the right side, the black border keeps the
 * two levels apart
 *
 * @example
 * ```tsx
 * <Section title="Summary">...</Section>
 * ```
 */
function Section({ title, children }: SectionProps) {
  return (
    <section aria-label={title} className="panel p-4">
      <h2 className="heading">{title}</h2>
      <div className="flex flex-col gap-3.5">{children}</div>
    </section>
  );
}

/** props for the {@link ResultsTab} component */
interface ResultsTabProps {
  /** the full response from `POST /solve`, whatever its status */
  result: SolveResponse;
}

/**
 * shows the outcome of one solve: summary, chart with prices, and the dispatch table
 *
 * @param props - see {@link ResultsTabProps}
 *
 * @remarks
 * has no state and no hooks, so it could render on the server, but it is
 * imported by the client page, so it ends up in the client bundle
 *
 * edge cases:
 * - `status` of "invalid" or "error": only the message is shown
 * - `status` of "infeasible": only the summary panel is shown (banner and counts),
 *   the api sends no cost, chart, table or prices
 * - `status` of "optimal": all three panels are shown
 * - `min-w-0` lets the stat boxes shrink inside the row instead of pushing the page wider
 * - the banner wrapper uses `*:flex-1` so the banner grows to the same height as the stat boxes
 * - at xl the stat boxes are tight (about 620px for 5 columns), if the cost wraps,
 *   make the banner narrower (`xl:w-52`) or move the row breakpoint to `2xl:`
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
    // flex column with an even gap between the sections
    <div className="flex flex-col gap-3.5">
      {/* section 1: banner and stat boxes in one row from xl up */}
      <Section title="Summary">
        <div className="flex flex-col gap-3.5 xl:flex-row xl:items-stretch">
          {/* status is "optimal" or "infeasible" here, typescript narrowed it above */}
          <div className="flex flex-col *:flex-1 xl:w-60 xl:shrink-0">
            <StatusBanner status={status} />
          </div>
          <div className="min-w-0 xl:flex-1">
            {/* cost only exists when the problem is optimal */}
            <StatGrid cost={cost} iterations={iterations} unknowns={setup?.unknowns} constraints={setup?.constraints} />
          </div>
        </div>
      </Section>

      {/* sections 2 and 3 only exist when the problem is optimal */}
      {dispatch && prices && (
        <>
          {/* section 2: chart at full width, prices directly under it */}
          <Section title="Dispatch vs demand (MW)">
            <DispatchChart groups={dispatch.groups} blocks={dispatch.blocks} values={dispatch.values} />
            <h3 className="subheading">Price of electricity (₱ per MWh)</h3>
            <PriceRow blocks={prices.blocks} values={prices.values} />
          </Section>

          {/* section 3: the table, task 4.3 will add the key insights card beside it */}
          <Section title="Output of each plant group (MW)">
            <DataTable corner="Plant group" columns={dispatch.blocks} rowLabels={dispatch.groups} rows={dispatch.values} />
          </Section>
        </>
      )}
    </div>
  );
}

// references:
// react, thinking in react (splitting the ui into components): https://react.dev/learn/thinking-in-react
// react, conditional rendering: https://react.dev/learn/conditional-rendering
// react, fragments: https://react.dev/reference/react/Fragment
// react, children prop and ReactNode: https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children
// typescript, narrowing: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
// tailwind css v4, flex direction: https://tailwindcss.com/docs/flex-direction
// tailwind css v4, flex (flex-1): https://tailwindcss.com/docs/flex
// tailwind css v4, align items (stretch): https://tailwindcss.com/docs/align-items
// tailwind css v4, styling direct children (*: variant): https://tailwindcss.com/docs/hover-focus-and-other-states#styling-direct-children
// mdn, aria-label: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-label
// tsdoc standard: https://tsdoc.org