// the row of summary boxes under the status banner: total cost, number of
// iterations, unknowns and constraints
// each box is a dark "screen" with a small label on top and a big gold value
// it holds no state, everything comes in through props
//
// layout (edit the tailwind classes below):
//   2 columns below lg, 5 columns from lg up (lg:grid-cols-5)
//   the cost box has col-span-2 so it is twice as wide, change it to col-span-3 to widen it more
//
// why lg and not md:
//   a breakpoint looks at the window, not at the panel this grid sits in, and at md
//   (768px to 1023px) the right panel is only about 340px wide because the controls
//   take the left column, five columns there would be about 60px each and the big
//   gold numbers would overflow, from lg up the panel is wide enough

import { formatPeso } from "@/lib/format";

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
 * @param props - see {@link StatProps}
 *
 * @remarks
 * `wrap-break-word` lets a very long number wrap instead of overflowing the box
 * `min-w-0` lets the box shrink inside the grid instead of pushing the other boxes out
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

/** props for the {@link StatGrid} component */
interface StatGridProps {
  /** total minimum cost in pesos, only exists when the problem is optimal */
  cost?: number;
  /** number of simplex iterations */
  iterations?: number;
  /** total number of unknowns in the setup */
  unknowns?: number;
  /** total number of constraints in the setup */
  constraints?: number;
}

// text shown when the api did not send a number
const MISSING = "-";

/**
 * grid of summary boxes for one solve
 *
 * @param props - see {@link StatGridProps}
 *
 * @remarks
 * has no state and no hooks, so it needs no "use client" of its own
 *
 * edge cases:
 * - `cost` is left out for an infeasible problem, so the cost box is not drawn at all
 *   and the other boxes move to fill the row
 * - a count that the api did not send shows "-" instead of the word "undefined"
 * - below lg the cost box fills a whole row of 2 columns, and the other three boxes
 *   wrap under it, which keeps the long peso number on one line
 *
 * @example
 * ```tsx
 * <StatGrid cost={1149843800} iterations={34} unknowns={42} constraints={50} />
 * ```
 */
export default function StatGrid({ cost, iterations, unknowns, constraints }: StatGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
      {/* col-span-2 makes the cost box twice as wide because its number is long */}
      {cost !== undefined && <Stat label="Total minimum cost, Z" value={formatPeso(cost)} className="col-span-2" />}
      <Stat label="Number of iterations" value={iterations === undefined ? MISSING : String(iterations)} />
      <Stat label="Unknowns" value={unknowns === undefined ? MISSING : String(unknowns)} />
      <Stat label="Constraints" value={constraints === undefined ? MISSING : String(constraints)} />
    </div>
  );
}

// references:
// react, passing props to a component: https://react.dev/learn/passing-props-to-a-component
// tailwind css v4, grid template columns: https://tailwindcss.com/docs/grid-template-columns
// tailwind css v4, grid column span: https://tailwindcss.com/docs/grid-column
// tailwind css v4, responsive design (breakpoints look at the window): https://tailwindcss.com/docs/responsive-design
// tailwind css v4, overflow wrap (wrap-break-word): https://tailwindcss.com/docs/overflow-wrap
// mdn, string conversion (String()): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/String
// tsdoc standard: https://tsdoc.org