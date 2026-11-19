// the help content shown under the "you died" banner when a problem is infeasible
// it lists the most common reasons, and has a respawn button that puts the
// choices back to the start (all plant groups, co2 cap off)
// it holds no state, the page owns the respawn action and passes it in through props
//
// layout (edit the tailwind classes below):
//   one dark "screen" box with the reasons on top, then the respawn button and a small hint
//   the button is full width on phones and shrinks to its text from sm up

import { formatNumber } from "@/lib/format";
import { demand } from "@/lib/grid";

/** props for the {@link InfeasibleHelp} component */
interface InfeasibleHelpProps {
  /** called when the player presses "Respawn" */
  onRespawn: () => void;
}

/** one reason why a problem can be infeasible */
interface Reason {
  /** short pixel title, shown in green */
  title: string;
  /** one or two sentences under the title */
  text: string;
}

// the highest demand of the day, read from the grid constants so it never drifts from the solver
// it is worked out once when the file loads, not on every render
const peakDemandMw = Math.max(...demand);

// the reasons, in the order they are most likely to be the problem
const reasons: readonly Reason[] = [
  {
    title: "Selected plants are too small",
    text: `Together they must be able to reach the peak demand of ${formatNumber(peakDemandMw)} MW. Try selecting more plant groups.`,
  },
  {
    title: "The CO₂ cap is too tight",
    text: "The cleaner plants may not be enough to cover every block under the limit. Raise the daily limit or switch the cap off.",
  },
];

/**
 * list of likely causes of an infeasible problem, with a respawn button
 *
 * @param props - see {@link InfeasibleHelpProps}
 *
 * @remarks
 * has no state and no hooks, so it needs no "use client" of its own
 *
 * edge cases:
 * - the reasons are general hints, not a diagnosis, the solver only says "infeasible"
 *   and not which constraint failed, so the wording stays soft ("may", "try")
 * - the list is a `ul` with decorative gold squares (`aria-hidden`), the order does not matter
 * - the respawn button does not call the solver, it only resets the choices, so it is
 *   never disabled while loading
 *
 * @example
 * ```tsx
 * <InfeasibleHelp onRespawn={handleRespawn} />
 * ```
 */
export default function InfeasibleHelp({ onRespawn }: InfeasibleHelpProps) {
  return (
    <div className="screen flex flex-col gap-3.5 p-4">
      <ul className="flex flex-col gap-3">
        {reasons.map((reason) => (
          <li key={reason.title} className="flex items-start gap-3">
            {/* small gold block like an item marker */}
            <span aria-hidden="true" className="mt-1.5 size-3 shrink-0 border-2 border-black bg-gold" />
            <div>
              <span className="block font-pixel text-pixel-label text-green">{reason.title}</span>
              <span className="block text-body text-white">{reason.text}</span>
            </div>
          </li>
        ))}
      </ul>

      {/* respawn: back to the start choices */}
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
        <button type="button" className="btn btn-grass w-full py-4 sm:w-auto" onClick={onRespawn}>
          Respawn
        </button>
        <span className="text-small text-label">Selects all plant groups and switches the CO₂ cap off</span>
      </div>
    </div>
  );
}

// references:
// react, rendering lists (keys): https://react.dev/learn/rendering-lists
// react, passing props to a component: https://react.dev/learn/passing-props-to-a-component
// mdn, math.max: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/max
// mdn, ul element: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/ul
// mdn, aria-hidden: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-hidden
// tailwind css v4, flex direction: https://tailwindcss.com/docs/flex-direction
// tailwind css v4, width: https://tailwindcss.com/docs/width
// cmsc 150 final project spec, failure cases (infeasible problems) and table 2 (demand)
// tsdoc standard: https://tsdoc.org