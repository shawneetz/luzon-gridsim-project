// the "inventory" style card that sums up one optimal solve
// top: three highlight rows (cheapest block, most expensive block, peak demand)
// middle: energy per plant group over the day, with the plant icon on each row
// bottom: total energy and total co2
// the numbers come from buildInsights (lib/insights.ts), this file only draws them
// it holds no state, everything comes in through props
//
// layout (edit the tailwind classes below):
//   everything sits on dark "screen" boxes, one under the other
//   plant icon size is the size-8 class on the <img> (32px), size-6 (24px) at 2xl
//
// fit to screen (2xl and up):
//   the card is wide and short instead of narrow and tall
//   - the three highlights are three tiles in one row, each tile has the label on top and the
//     block name on the left and the value on the right (the time of day icon is hidden)
//   - the energy list is two columns, the "total energy" row takes the last cell
//   - rows and boxes have less padding
//   this takes about 17rem of height, the one column version needs about 28rem

import { formatNumber, formatPeso } from "@/lib/format";
import { blockHours, blockIcons } from "@/lib/grid";
import { buildInsights, type BlockHighlight } from "@/lib/insights";
import { styleOf } from "@/lib/plants";
import type { SolveResponse } from "@/lib/types";

/** props for the {@link Highlight} row */
interface HighlightProps {
  /** small label on top, e.g. "Cheapest block" */
  label: string;
  /** the block that stands out, see {@link BlockHighlight} */
  block: BlockHighlight;
  /** the value already formatted with its unit, e.g. "₱3,800.00 / MWh" */
  text: string;
}

/**
 * one highlight row: time of day icon, block name with its hours, and a gold value
 *
 * @param props - see {@link HighlightProps}
 *
 * @remarks
 * the icon is decorative (the block name already says it), so it is hidden
 * from screen readers with `aria-hidden`
 * `blockIcons` and `blockHours` are indexed by the block position, a missing
 * entry shows nothing instead of crashing
 *
 * fit to screen (2xl and up):
 * - the row becomes a small grid with two columns (name and value) and the label on its own row,
 *   the text wrapper has `2xl:contents`, so the label and the block name become direct grid items
 *   without changing the markup, below 2xl the wrapper is a normal flex child like before
 * - the icon is hidden (`2xl:hidden`), the tile is too small for it
 *
 * @example
 * ```tsx
 * <Highlight label="Cheapest block" block={insights.cheapest} text="₱3,800.00 / MWh" />
 * ```
 */
function Highlight({ label, block, text }: HighlightProps) {
  return (
    <li className="screen flex items-center gap-3 px-3 py-2 2xl:grid 2xl:grid-cols-[1fr_auto] 2xl:gap-x-2 2xl:gap-y-0 2xl:px-2 2xl:py-1">
      <span aria-hidden="true" className="text-stat leading-none 2xl:hidden">
        {blockIcons[block.index]}
      </span>
      <div className="min-w-0 flex-1 2xl:contents">
        <span className="block text-small text-label 2xl:col-span-2">{label}</span>
        <span className="block text-body text-white">
          {block.block} <span className="text-label">{blockHours[block.index]}</span>
        </span>
      </div>
      <span className="text-right text-body text-gold gold-shadow">{text}</span>
    </li>
  );
}

/** props for the {@link KeyInsights} component */
interface KeyInsightsProps {
  /** the dispatch part of the response, only exists when the problem is optimal */
  dispatch: NonNullable<SolveResponse["dispatch"]>;
  /** the prices part of the response, only exists when the problem is optimal */
  prices: NonNullable<SolveResponse["prices"]>;
}

/**
 * key insights card: standout blocks, energy per plant group, and totals
 *
 * @param props - see {@link KeyInsightsProps}
 *
 * @remarks
 * has no state and no hooks, so it needs no "use client" of its own
 *
 * edge cases:
 * - when there is nothing to summarize (empty lists) nothing is drawn
 * - groups that made no energy are dimmed, like the zeros in the tables
 * - a group with an unknown emission factor is left out of the co2 total, and
 *   a small note under the total says so, instead of hiding it
 * - the plant image is a plain `<img>` like in the control panel, so the
 *   next/image lint rule is switched off for that line
 * - the peak demand comes from the fixed demand list, not from the solver, so
 *   it is the same for every solve
 *
 * fit to screen (2xl and up):
 * - the energy list is a two column grid, the lines between the cells come from borders on each
 *   cell (`2xl:border-b`, and `2xl:odd:border-r` for the left column) and not from `divide-y`,
 *   which is switched off (`2xl:divide-y-0`), so a half empty last row does not show a line color
 * - with 7 groups and the total row the grid has 8 cells, which fills 4 full rows, with fewer
 *   plant groups selected the last cell can stay empty, which only shows the dark screen color
 * - the row height is about 2rem, so four rows are about 8.3rem
 *
 * @example
 * ```tsx
 * <KeyInsights dispatch={dispatch} prices={prices} />
 * ```
 */
export default function KeyInsights({ dispatch, prices }: KeyInsightsProps) {
  const insights = buildInsights(dispatch, prices);
  if (!insights) return null;

  return (
    <div className="flex flex-col gap-3.5 2xl:gap-2">
      {/* standout blocks, three tiles in one row at 2xl */}
      <ul className="flex flex-col gap-1.5 2xl:grid 2xl:grid-cols-3 2xl:gap-2">
        <Highlight
          label="Cheapest block"
          block={insights.cheapest}
          text={`${formatPeso(insights.cheapest.value)} / MWh`}
        />
        <Highlight
          label="Most expensive block"
          block={insights.priciest}
          text={`${formatPeso(insights.priciest.value)} / MWh`}
        />
        <Highlight label="Peak demand" block={insights.peak} text={`${formatNumber(insights.peak.value)} MW`} />
      </ul>

      {/* energy per plant group, one inventory row each, two columns at 2xl */}
      <h3 className="subheading 2xl:mt-0">Energy per plant group (MWh)</h3>
      <ul className="screen divide-y divide-line 2xl:grid 2xl:grid-cols-2 2xl:divide-y-0">
        {insights.energy.map(({ group, mwh }) => (
          <li
            key={group}
            className="flex items-center gap-3 px-3 py-1.5 2xl:gap-2 2xl:border-b 2xl:border-line 2xl:px-2 2xl:py-1 2xl:odd:border-r"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={styleOf(group).image}
              alt=""
              className="size-8 shrink-0 object-contain [image-rendering:pixelated] 2xl:size-6"
            />
            <span className="flex-1 text-body text-green">{group}</span>
            <span className={`text-body tabular-nums ${mwh === 0 ? "text-dim" : "text-white"}`}>
              {formatNumber(mwh)}
            </span>
          </li>
        ))}
        {/* total energy of the day */}
        <li className="flex items-center justify-between gap-3 px-3 py-2 2xl:gap-2 2xl:border-b 2xl:border-line 2xl:px-2 2xl:py-1 2xl:odd:border-r">
          <span className="text-body text-gold">Total energy</span>
          <span className="text-body tabular-nums text-gold gold-shadow">{formatNumber(insights.totalMwh)}</span>
        </li>
      </ul>

      {/* total co2 */}
      <div className="screen px-3 py-2 2xl:py-1">
        <div className="flex items-center justify-between gap-3">
          <span className="text-body text-gold">Total CO₂ emitted</span>
          <span className="text-body tabular-nums text-gold gold-shadow">{formatNumber(insights.totalCo2)} t</span>
        </div>
        {insights.co2Partial && (
          <p className="mt-1 text-small text-label">Groups with no known emission factor are not counted</p>
        )}
      </div>
    </div>
  );
}

// references:
// react, rendering lists (keys): https://react.dev/learn/rendering-lists
// react, passing props to a component: https://react.dev/learn/passing-props-to-a-component
// typescript, importing types inline (import { type X }): https://www.typescriptlang.org/docs/handbook/modules/reference.html#type-modifiers-on-import-names
// typescript, utility types (NonNullable): https://www.typescriptlang.org/docs/handbook/utility-types.html#nonnullabletype
// mdn, ul element: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/ul
// mdn, aria-hidden: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-hidden
// mdn, display: contents: https://developer.mozilla.org/en-US/docs/Web/CSS/display#contents
// mdn, :nth-child (odd): https://developer.mozilla.org/en-US/docs/Web/CSS/:nth-child
// tailwind css v4, grid template columns: https://tailwindcss.com/docs/grid-template-columns
// tailwind css v4, grid column span: https://tailwindcss.com/docs/grid-column
// tailwind css v4, divide width: https://tailwindcss.com/docs/border-width#between-children
// tailwind css v4, hover, focus and other states (odd:): https://tailwindcss.com/docs/hover-focus-and-other-states#first-last-odd-and-even
// tailwind css v4, font variant numeric (tabular-nums): https://tailwindcss.com/docs/font-variant-numeric
// cmsc 150 final project spec, table 1 (emission factors) and constraint (6) (co2 = h x e x x)
// tsdoc standard: https://tsdoc.org
