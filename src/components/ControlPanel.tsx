// ControlPanel.tsx
// left side of the page: plant group slots, the co2 cap toggle, and the solve button
// each plant group is an inventory slot you click to select (white frame) or unselect
// the slot shows the plant's image (from lib/plants.ts) above its name, tag and capacity
// the heading shows how many groups are selected, like "3 of 7 selected"
// this component holds no state, the page passes everything in through props
//
// layout (edit the tailwind classes below):
//   plant slots are a 2 column grid, change grid-cols-2 for more or fewer columns
//   image size is the size-10 class on the <img> (40px), change it to resize all icons
//   sticky: from md up the panel sticks while the results scroll, see `stickyPanel`

import { styleOf } from "@/lib/plants";

/** props for the {@link ControlPanel} component */
interface Props {
  groups: string[];                      // all plant group names
  selected: string[];                    // names that are currently selected
  onToggleGroup: (group: string) => void;
  onCheckAll: () => void;                // select every group
  onReset: () => void;                   // unselect every group
  co2On: boolean;
  onCo2On: (on: boolean) => void;
  co2Cap: string;                        // text so blank or bad values can be rejected by the api
  onCo2Cap: (cap: string) => void;
  onSolve: () => void;
  loading: boolean;                      // true while waiting for the solver
}

// look of a plant slot. "slot" (from globals.css) gives the gray bevel
const slotBase = "slot flex flex-col items-start gap-0.5 p-2 text-left text-ink";
const slotOff = "hover:bg-slot-hover";                                         // not selected
const slotOn = "border-4 border-white bg-slot-selected pb-3.5 outline-2 outline-black"; // selected

// sticky panel (task 3.2)
// - the panel sticks from md up, because below md the layout is one column and sticking makes no sense
// - the app header (see AppHeader.tsx) only sticks on windows at least 768px wide and 800px tall,
//   so on those windows the panel needs a bigger top offset to stay under the header
// - max-h plus overflow-y-auto keeps the solve button reachable when the panel is taller than the
//   window, the panel scrolls inside itself instead of being cut off
// - the media query is written once as a constant so the three classes always use the same rule
//   (underscores become spaces in tailwind arbitrary values)
const tallDesktop = "[@media(min-width:768px)_and_(min-height:800px)]";
const stickyPanel = [
  "md:sticky md:top-4 md:max-h-[calc(100vh-2rem)] md:overflow-y-auto",
  `${tallDesktop}:top-36 ${tallDesktop}:max-h-[calc(100vh-10rem)]`,
].join(" ");

/**
 * left panel of the simulator: plant slots, co2 cap and solve button
 *
 * @param props - see {@link Props}
 *
 * @remarks
 * has no state and no hooks, so it needs no "use client" of its own,
 * everything comes in through props from the client page
 *
 * edge cases:
 * - the selection count uses `groups.length` as the total, so it stays right
 *   if the api ever sends more or fewer plant groups than 7
 * - a group the style file does not know has `capMw` of 0, so its capacity hint is hidden
 *   instead of showing "0 MW"
 * - `sticky` needs the grid parent to use `items-start` (page.tsx does), otherwise the
 *   panel stretches to the full height of the row and has nothing to stick against
 *
 * @example
 * ```tsx
 * <ControlPanel groups={options.groups} selected={selected} ... />
 * ```
 */
export default function ControlPanel(props: Props) {
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
        {props.groups.map((group) => {
          const style = styleOf(group);
          const isOn = props.selected.includes(group);
          return (
            <button
              key={group}
              type="button"
              className={`${slotBase} ${isOn ? slotOn : slotOff}`}
              // selected slots get a color bar of the plant type at the bottom
              style={isOn ? { boxShadow: `inset 0 -8px 0 ${style.color}` } : undefined}
              aria-pressed={isOn}
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
          className="field-input"
          value={props.co2Cap}
          disabled={!props.co2On}
          onChange={(e) => props.onCo2Cap(e.target.value)}
        />
      </label>

      {/* big green solve button */}
      <button
        type="button"
        className="btn btn-grass mt-5 w-full py-4 text-base"
        onClick={props.onSolve}
        disabled={props.loading}
      >
        {props.loading ? "Solving..." : "Solve"}
      </button>
    </section>
  );
}

// references:
// tailwind css v4, position (sticky): https://tailwindcss.com/docs/position
// tailwind css v4, max-height: https://tailwindcss.com/docs/max-height
// tailwind css v4, overflow: https://tailwindcss.com/docs/overflow
// tailwind css v4, arbitrary variants: https://tailwindcss.com/docs/hover-focus-and-other-states#using-arbitrary-variants
// mdn, position: sticky: https://developer.mozilla.org/en-US/docs/Web/CSS/position
// mdn, aria-live: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-live
// mdn, number.toLocaleString: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString
// react, passing props: https://react.dev/learn/passing-props-to-a-component
// tsdoc standard: https://tsdoc.org