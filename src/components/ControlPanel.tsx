// ControlPanel.tsx
// left side of the page: plant group slots, the co2 cap toggle, and the solve button
// each plant group is an inventory slot you click to select (white frame) or unselect
// the slot shows the plant's image (from lib/plants.ts) above its name, tag and capacity
// hovering or focusing a slot shows an item tooltip with the details (see Tooltip.tsx)
// the heading shows how many groups are selected, like "3 of 7 selected"
// a bad co2 limit shows a red message under the box, and the solve button is
// disabled with a hint while nothing can be solved (see lib/validate.ts)
// this component holds no state, the page passes everything in through props
//
// layout (edit the tailwind classes below):
//   plant slots are a 2 column grid, change grid-cols-2 for more or fewer columns
//   if you change the column count, also change how `align` is picked for the tooltip
//   image size is the size-10 class on the <img> (40px), change it to resize all icons
//   sticky: from md up the panel sticks while the results scroll, see `stickyPanel`

import { useId } from "react";
import Tooltip from "./Tooltip";
import { styleOf, type PlantStyle } from "@/lib/plants";
import { co2CapError } from "@/lib/validate";

/** props for the {@link ControlPanel} component */
interface Props {
  groups: string[];                      // all plant group names
  selected: string[];                    // names that are currently selected
  onToggleGroup: (group: string) => void;
  onCheckAll: () => void;                // select every group
  onReset: () => void;                   // unselect every group
  co2On: boolean;
  onCo2On: (on: boolean) => void;
  co2Cap: string;                        // text so blank or bad values can be caught before solving
  onCo2Cap: (cap: string) => void;
  onSolve: () => void;
  loading: boolean;                      // true while waiting for the solver
}

// look of a plant slot. "slot" (from globals.css) gives the gray bevel
// h-full w-full makes the button fill the tooltip wrapper, which fills the grid cell
const slotBase = "slot flex h-full w-full flex-col items-start gap-0.5 p-2 text-left text-ink";
const slotOff = "hover:bg-slot-hover";                                         // not selected
const slotOn = "border-4 border-white bg-slot-selected pb-3.5 outline-2 outline-black"; // selected

// sticky panel (task 3.2)
// - the panel sticks from md up, because below md the layout is one column and sticking makes no sense
// - the app header (see AppHeader.tsx) only sticks on windows at least 768px wide and 800px tall,
//   so on those windows the panel needs a bigger top offset to stay under the header
// - max-h plus overflow-y-auto keeps the solve button reachable when the panel is taller than the
//   window, the panel scrolls inside itself instead of being cut off
// - the media query is written once as a constant so the classes always use the same rule
//   (underscores become spaces in tailwind arbitrary values)
const tallDesktop = "[@media(min-width:768px)_and_(min-height:800px)]";
const stickyPanel = [
  "md:sticky md:top-4 md:max-h-[calc(100vh-2rem)] md:overflow-y-auto",
  `${tallDesktop}:top-36 ${tallDesktop}:max-h-[calc(100vh-10rem)]`,
].join(" ");

// inline error under the co2 box (task 3.4)
// it sits on a black plate, because the red text token is too light to read on the gray panel
const errorPlate = "mt-1 bg-black px-2 py-1 text-small text-red";

/**
 * the text inside a plant slot tooltip, in the style of an in-game item tooltip
 *
 * @param props.group - plant group name, shown as the white title
 * @param props.style - the style of that group, see {@link PlantStyle}
 *
 * @remarks
 * a group the style file does not know has `capMw` of 0, so only its name is shown
 * the emission line also shows for 0, because "0 t CO₂/MWh" is a real fact for hydro,
 * solar and wind
 *
 * @example
 * ```tsx
 * <PlantTooltip group="Hydro" style={styleOf("Hydro")} />
 * ```
 */
function PlantTooltip({ group, style }: { group: string; style: PlantStyle }) {
  const known = style.capMw > 0;
  return (
    <>
      <span className="block text-body text-white">{group}</span>
      {known && (
        <>
          <span className="block text-label">Capacity: {style.capMw.toLocaleString("en-US")} MW</span>
          <span className="block text-label">Emission: {style.emission} t CO₂/MWh</span>
        </>
      )}
      {/* light purple like the lore text in game */}
      {style.note && <span className="mt-1 block text-[#ff55ff]">{style.note}</span>}
    </>
  );
}

/**
 * left panel of the simulator: plant slots, co2 cap and solve button
 *
 * @param props - see {@link Props}
 *
 * @remarks
 * has no state of its own (only `useId` for the aria links), everything comes in
 * through props from the client page
 *
 * validation (task 3.4):
 * - the co2 message only shows while the cap is switched on, because the box is
 *   disabled and ignored by the solver when it is off
 * - the solve button is disabled when no group is selected or the co2 limit is
 *   bad, and a hint under it says why
 * - the check is only for fast feedback, the r api still checks again, and its
 *   messages still show in the results banner as a fallback
 *
 * edge cases:
 * - the selection count uses `groups.length` as the total, so it stays right
 *   if the api ever sends more or fewer plant groups than 7
 * - a group the style file does not know has `capMw` of 0, so its capacity hint is hidden
 *   instead of showing "0 MW"
 * - `sticky` needs the grid parent to use `items-start` (page.tsx does), otherwise the
 *   panel stretches to the full height of the row and has nothing to stick against
 * - the tooltips are inside the panel, which scrolls (`overflow-y-auto`), so each one is
 *   anchored under its slot and to the left or right edge by column, to stay inside the panel
 * - while `loading` is true the button is also disabled, and the hint stays hidden
 *   so the two states do not stack
 *
 * @example
 * ```tsx
 * <ControlPanel groups={options.groups} selected={selected} ... />
 * ```
 */
export default function ControlPanel(props: Props) {
  // ids that link the co2 box and the solve button to their messages
  const co2ErrorId = useId();
  const solveHintId = useId();

  // validation state, worked out on every render (cheap, so no useMemo needed)
  const co2Error = props.co2On ? co2CapError(props.co2Cap) : "";
  const noGroups = props.selected.length === 0;

  // the first problem wins, so the hint shows one message at a time
  const solveHint = noGroups ? "Select at least one plant" : co2Error ? "Fix the CO₂ limit first" : "";
  const solveBlocked = solveHint !== "";

  return (
    <section className={`panel w-full p-4 ${stickyPanel}`}>
      {/* heading row: title on the left, selection count on the right */}
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="heading">Plant groups</h2>
        {/* aria-live so screen readers hear the new count after every click */}
        <span className="font-body text-small text-ink-soft" aria-live="polite">
          {props.selected.length} of {props.groups.length} selected
        </span>
      </div>

      {/* quick select buttons */}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn" onClick={props.onCheckAll}>
          Check All
        </button>
        <button type="button" className="btn" onClick={props.onReset}>
          Reset
        </button>
      </div>

      {/* one slot per plant group; clicking a slot selects or unselects it */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {props.groups.map((group, i) => {
          const style = styleOf(group);
          const isOn = props.selected.includes(group);
          return (
            // even index = left column, odd index = right column (2 column grid)
            <Tooltip
              key={group}
              className="h-full"
              align={i % 2 === 0 ? "left" : "right"}
              content={<PlantTooltip group={group} style={style} />}
            >
              {(describedBy) => (
                <button
                  type="button"
                  className={`${slotBase} ${isOn ? slotOn : slotOff}`}
                  // selected slots get a color bar of the plant type at the bottom
                  style={isOn ? { boxShadow: `inset 0 -8px 0 ${style.color}` } : undefined}
                  aria-pressed={isOn}
                  aria-describedby={describedBy}
                  onClick={() => props.onToggleGroup(group)}
                >
                  {/* fixed 40px box: object-contain fits any image size without stretching,
                      pixelated keeps pixel art sharp. plain <img> keeps this simple,
                      so the next/image lint rule is switched off for this line */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={style.image}
                    alt=""
                    className="size-10 object-contain [image-rendering:pixelated]"
                  />
                  <span className="font-body text-input leading-none">{group}</span>
                  <span className="font-pixel text-pixel-tiny text-ink-soft">{style.tag}</span>

                  {/* capacity hint, only for groups that have a known capacity */}
                  {style.capMw > 0 && (
                    <span className="font-body text-small leading-none text-ink-soft">
                      {style.capMw.toLocaleString("en-US")} MW
                    </span>
                  )}
                </button>
              )}
            </Tooltip>
          );
        })}
      </div>

      {/* co2 cap: the limit box is disabled until the toggle is on */}
      <h2 className="heading">CO₂ cap</h2>
      <label className="flex cursor-pointer items-center gap-2.5">
        <input
          type="checkbox"
          className="size-5 accent-grass-dark"
          checked={props.co2On}
          onChange={(e) => props.onCo2On(e.target.checked)}
        />
        Limit daily CO₂
      </label>
      <label className="mt-2.5 flex flex-col gap-1">
        Limit (t/day)
        <input
          type="text"
          inputMode="numeric"
          // red frame while the value is bad, it wins over the default gray frame
          className={`field-input ${co2Error ? "border-red" : ""}`}
          value={props.co2Cap}
          disabled={!props.co2On}
          aria-invalid={co2Error !== ""}
          aria-describedby={co2Error ? co2ErrorId : undefined}
          onChange={(e) => props.onCo2Cap(e.target.value)}
        />
      </label>

      {/* inline co2 error: role="alert" makes screen readers read it as soon as it appears */}
      {co2Error && (
        <p id={co2ErrorId} role="alert" className={errorPlate}>
          {co2Error}
        </p>
      )}

      {/* big green solve button: disabled while loading or while an input is bad */}
      <button
        type="button"
        className="btn btn-grass mt-5 w-full py-4 text-base"
        onClick={props.onSolve}
        disabled={props.loading || solveBlocked}
        aria-describedby={solveBlocked ? solveHintId : undefined}
      >
        {props.loading ? "Solving..." : "Solve"}
      </button>

      {/* hint under the button, says why solve is disabled (hidden while solving) */}
      {solveBlocked && !props.loading && (
        <p id={solveHintId} className="mt-2 text-center text-small text-ink-soft">
          {solveHint}
        </p>
      )}
    </section>
  );
}

// references:
// wai-aria authoring practices, tooltip pattern: https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
// react, useId: https://react.dev/reference/react/useId
// react, render props pattern (children as a function): https://react.dev/reference/react/Children
// react, rendering lists (keys): https://react.dev/learn/rendering-lists
// tailwind css v4, position (sticky): https://tailwindcss.com/docs/position
// tailwind css v4, max-height: https://tailwindcss.com/docs/max-height
// tailwind css v4, overflow: https://tailwindcss.com/docs/overflow
// tailwind css v4, border-color: https://tailwindcss.com/docs/border-color
// tailwind css v4, arbitrary variants: https://tailwindcss.com/docs/hover-focus-and-other-states#using-arbitrary-variants
// mdn, aria-invalid: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-invalid
// mdn, aria-describedby: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-describedby
// mdn, alert role: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/alert_role
// mdn, aria-live: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-live
// mdn, number.toLocaleString: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString
// tsdoc standard: https://tsdoc.org