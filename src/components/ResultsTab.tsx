// thin layout file for the results of one solve
// it decides what to show for each status and puts the pieces into sections,
// so the results read top to bottom as summary, then picture, then numbers
//   1) summary   StatusBanner and StatGrid side by side in one row
//   1b) help     only when infeasible: why it may happen, and a respawn button
//   2) dispatch  DispatchChart at full width, with PriceRow directly under it
//   3) numbers   DataTable (output of each plant group, with totals and demand)
//                beside KeyInsights (see the 2xl note for the fit layout)
// the pieces own their own styling, this file only owns the order and the sections
//
// layout (edit the tailwind classes below):
//   summary row: stacked on small screens, one row from xl up (xl:flex-row)
//   the banner column is 15rem wide (xl:w-60, 14rem at 2xl), the stat boxes take the rest
//   numbers row: one column on small screens, two cards from xl up, the table
//   gets 3 parts and the insights get 2 (xl:grid-cols-[3fr_2fr])
//   every section is a .panel with a .heading, see the shared looks in the global stylesheet
//
// fit to screen (2xl and up):
//   everything must be visible without scrolling, so the sections are flat (no panel frame, the
//   results panel around them already has one) and arranged like a dashboard
//     summary row         on top, its title is only read by screen readers
//     chart and prices    left, 44rem wide, the chart box grows to fill the free height
//     table and insights  right, stacked, the insights are 3 tiles and a 2 column energy list
//   the wrapper around the chart section and the numbers is `display: contents` below 2xl, so the
//   sections stay in one column there exactly like before, and a flex row at 2xl

import type { ReactNode } from "react";
import DataTable, { type FooterRow } from "./DataTable";
import DispatchChart from "./DispatchChart";
import InfeasibleHelp from "./InfeasibleHelp";
import KeyInsights from "./KeyInsights";
import PriceRow from "./PriceRow";
import StatGrid from "./StatGrid";
import StatusBanner from "./StatusBanner";
import { blockTotals, fullCapacityFlags } from "@/lib/dispatchTable";
import { demand } from "@/lib/grid";
import type { SolveResponse } from "@/lib/types";

/** props for the {@link Section} component */
interface SectionProps {
  /** heading shown at the top of the section */
  title: string;
  /** what goes inside the section, spaced evenly in a column */
  children: ReactNode;
  /** extra tailwind classes for the section, e.g. "2xl:w-[44rem]" (default: none) */
  className?: string;
  /** hide the heading visually at 2xl, screen readers still read it (default: false) */
  hideTitleOnFit?: boolean;
}

/**
 * one titled section of the results, used by every section so they look the same
 *
 * @param props - see {@link SectionProps}
 *
 * @remarks
 * a local helper on purpose: it is only used here, so it does not need its own file
 * `aria-label` names the region for screen readers, so they can jump between sections
 * `min-w-0` lets the section shrink inside a grid column, so a wide table scrolls
 * inside its own box instead of pushing the page wider
 * `className` is added at the end, so a size class like `2xl:w-[44rem]` is applied last
 *
 * fit to screen (2xl and up):
 * - the section loses its panel look (`2xl:border-0 2xl:bg-transparent 2xl:p-0 2xl:shadow-none`),
 *   a frame inside a frame costs about 4rem of height per section, and the results panel around
 *   all of them already has the frame, the utility classes win over `.panel` from the components layer
 * - the section and its inner box become flex columns that can shrink (`min-h-0`), so a child
 *   with `flex-1` (the chart box) can grow into the free height
 * - the heading margin is smaller, and `hideTitleOnFit` makes it screen reader only
 *
 * @example
 * ```tsx
 * <Section title="Summary" hideTitleOnFit>...</Section>
 * <Section title="Dispatch vs demand (MW)" className="2xl:w-[44rem] 2xl:shrink-0">...</Section>
 * ```
 */
function Section({ title, children, className = "", hideTitleOnFit = false }: SectionProps) {
  return (
    <section
      aria-label={title}
      className={`panel min-w-0 p-4 2xl:flex 2xl:min-h-0 2xl:flex-col 2xl:border-0 2xl:bg-transparent 2xl:p-0 2xl:shadow-none ${className}`}
    >
      <h2 className={`heading 2xl:mb-1 ${hideTitleOnFit ? "2xl:sr-only" : ""}`}>{title}</h2>
      <div className="flex flex-col gap-3.5 2xl:min-h-0 2xl:flex-1 2xl:gap-1.5">{children}</div>
    </section>
  );
}

/** props for the {@link ResultsTab} component */
interface ResultsTabProps {
  /** the full response from `POST /solve`, whatever its status */
  result: SolveResponse;
  /** called when the player presses "Respawn" on an infeasible result */
  onRespawn: () => void;
}

/**
 * shows the outcome of one solve: summary, chart with prices, the dispatch table and key insights
 *
 * @param props - see {@link ResultsTabProps}
 *
 * @remarks
 * has no state and no hooks, so it could render on the server, but it is
 * imported by the client page, so it ends up in the client bundle
 *
 * dispatch table (task 4.6):
 * - the footer has a total supply row (sum of the groups per block) and a demand row,
 *   so supply against demand can be checked at a glance
 * - cells at the full capacity of their plant group turn gold, the key under the table
 *   says so, so the meaning does not depend on the color alone (each gold cell also
 *   has a hover title)
 * - the demand row reads the fixed demand list from the grid constants, not from
 *   the solver, like the dashed line in the chart
 *
 * infeasible view (task 4.7):
 * - the "you died" banner and the iteration count stay in the summary, and a second
 *   section lists why it may happen, with a respawn button (see InfeasibleHelp)
 * - the respawn action itself lives in the page, because it resets the page state
 *
 * edge cases:
 * - `status` of "invalid" or "error": only the message is shown
 * - `status` of "infeasible": the summary and the help section are shown,
 *   the api sends no cost, chart, table or prices
 * - `status` of "optimal": every section is shown
 * - the demand row is cut to the number of blocks the api sent, so a short response
 *   never prints extra columns
 * - `min-w-0` lets the stat boxes shrink inside the row instead of pushing the page wider
 * - the banner wrapper uses `*:flex-1` so the banner grows to the same height as the stat boxes
 * - `items-start` on the numbers row keeps the shorter card from stretching to the height of the taller one
 * - at xl the stat boxes are tight (about 620px for 5 columns), if the cost wraps,
 *   make the banner narrower (`xl:w-52`) or move the row breakpoint to `2xl:`
 *
 * fit to screen (2xl and up):
 * - the root is `h-full` and a column, the summary keeps its own height, and the zone under it
 *   (`flex-1 min-h-0`) takes the rest, where the chart section and the numbers sit side by side
 * - the zone wrapper is `contents` below 2xl: it has no box, so its two children are laid out by the
 *   column above exactly as if the wrapper was not there, at 2xl `flex` turns it into a row
 * - the chart section is 44rem wide because the price slots need about 6.3rem each (6 columns
 *   under the bars), a narrower chart would cut the prices, see PriceRow.tsx
 * - the numbers grid becomes one column at 2xl (`2xl:grid-cols-1`), table first, insights under it,
 *   `content-start` keeps them at the top and `min-w-0` lets the table shrink and scroll inside itself
 * - height budget in rem at the design size: summary 4.7, chart section 33.7 (the chart box grows to
 *   fill the free height), numbers about 38.8, the zone has 42.3, see layout.tsx for the full budget
 *
 * @example
 * ```tsx
 * <ResultsTab result={result} onRespawn={handleRespawn} />
 * ```
 */
export default function ResultsTab({ result, onRespawn }: ResultsTabProps) {
  const { status, iterations, setup, cost, dispatch, prices } = result;

  // bad input or a server error: just show the message, nothing to chart
  if (status === "invalid" || status === "error") {
    return <p className="banner border-red text-red">{result.message}</p>;
  }

  // extra table pieces, only worked out when there is a dispatch to show
  const fullCapacity = dispatch ? fullCapacityFlags(dispatch.groups, dispatch.values) : undefined;
  const footerRows: FooterRow[] = dispatch
    ? [
        { label: "Total supply", values: blockTotals(dispatch.values), tone: "total" },
        { label: "Demand", values: demand.slice(0, dispatch.blocks.length), tone: "demand" },
      ]
    : [];

  return (
    // flex column with an even gap between the sections, as tall as the tab panel at 2xl
    <div className="flex flex-col gap-3.5 2xl:h-full 2xl:min-h-0 2xl:gap-2">
      {/* section 1: banner and stat boxes in one row from xl up */}
      <Section title="Summary" hideTitleOnFit>
        <div className="flex flex-col gap-3.5 xl:flex-row xl:items-stretch 2xl:gap-2">
          {/* status is "optimal" or "infeasible" here, typescript narrowed it above */}
          <div className="flex flex-col *:flex-1 xl:w-60 xl:shrink-0 2xl:w-56">
            <StatusBanner status={status} />
          </div>
          <div className="min-w-0 xl:flex-1">
            {/* cost only exists when the problem is optimal */}
            <StatGrid cost={cost} iterations={iterations} unknowns={setup?.unknowns} constraints={setup?.constraints} />
          </div>
        </div>
      </Section>

      {/* section 1b: only for an infeasible problem, likely causes and the respawn button */}
      {status === "infeasible" && (
        <Section title="Why this may happen">
          <InfeasibleHelp onRespawn={onRespawn} />
        </Section>
      )}

      {/* sections 2 and 3 only exist when the problem is optimal */}
      {dispatch && prices && (
        // zone wrapper: no box below 2xl (children join the column above), a row at 2xl
        <div className="contents 2xl:flex 2xl:min-h-0 2xl:flex-1 2xl:gap-2">
          {/* section 2: chart at full width, prices directly under it
              at 2xl it is the left column, 44rem wide, and it does not shrink */}
          <Section title="Dispatch vs demand (MW)" className="2xl:w-[44rem] 2xl:shrink-0">
            <DispatchChart groups={dispatch.groups} blocks={dispatch.blocks} values={dispatch.values} />
            <h3 className="subheading 2xl:mt-0">Price of electricity (₱ per MWh)</h3>
            <PriceRow blocks={prices.blocks} values={prices.values} />
          </Section>

          {/* section 3: two cards side by side from xl up, the table and the key insights
              at 2xl they are stacked in the right column, table first */}
          <div className="grid grid-cols-1 items-start gap-3.5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] 2xl:min-w-0 2xl:flex-1 2xl:grid-cols-1 2xl:content-start 2xl:gap-2">
            <Section title="Output of each plant group (MW)">
              <DataTable
                corner="Plant group"
                columns={dispatch.blocks}
                rowLabels={dispatch.groups}
                rows={dispatch.values}
                highlight={fullCapacity}
                footerRows={footerRows}
                label="Output of each plant group"
              />
              {/* key for the gold cells, a small gold swatch like the ones in the chart legend */}
              <p className="flex items-center gap-2 text-small text-ink-soft">
                <span aria-hidden="true" className="inline-block size-3 border-2 border-black bg-gold" />
                Gold cell = plant group at full capacity
              </p>
            </Section>
            <Section title="Key insights">
              <KeyInsights dispatch={dispatch} prices={prices} />
            </Section>
          </div>
        </div>
      )}
    </div>
  );
}

// references:
// react, thinking in react (splitting the ui into components): https://react.dev/learn/thinking-in-react
// react, conditional rendering: https://react.dev/learn/conditional-rendering
// react, children prop and ReactNode: https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children
// typescript, narrowing: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
// typescript, importing types inline (import { type X }): https://www.typescriptlang.org/docs/handbook/modules/reference.html#type-modifiers-on-import-names
// mdn, array.prototype.slice: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
// mdn, aria-label: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-label
// mdn, display: contents: https://developer.mozilla.org/en-US/docs/Web/CSS/display#contents
// mdn, flexbox (min-height auto and shrinking): https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout/Controlling_ratios_of_flex_items_along_the_main_axis
// tailwind css v4, display (contents, hidden): https://tailwindcss.com/docs/display
// tailwind css v4, grid template columns: https://tailwindcss.com/docs/grid-template-columns
// tailwind css v4, align content: https://tailwindcss.com/docs/align-content
// tailwind css v4, align items: https://tailwindcss.com/docs/align-items
// tailwind css v4, min-width: https://tailwindcss.com/docs/min-width
// tailwind css v4, screen readers (sr-only): https://tailwindcss.com/docs/display#screen-reader-only
// tailwind css v4, responsive design (2xl breakpoint): https://tailwindcss.com/docs/responsive-design
// tailwind css v4, styling direct children (*: variant): https://tailwindcss.com/docs/hover-focus-and-other-states#styling-direct-children
// cmsc 150 final project spec, failure cases (infeasible problems), table 1 (plant capacities) and table 2 (demand)
// tsdoc standard: https://tsdoc.org
