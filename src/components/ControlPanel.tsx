// ControlPanel.tsx
// left side of the page: plant group slots, the co2 cap toggle, and the solve button.
// each plant group is an inventory slot you click to select (white frame) or unselect.
// the slot shows the plant's image (from lib/plants.ts) above its name.
// this component holds no state; the page passes everything in through props.
//
// layout (edit the tailwind classes below):
//   plant slots are a 2 column grid. change grid-cols-2 for more or fewer columns.
//   image size is the size-10 class on the <img> (40px). change it to resize all icons.

import { styleOf } from "@/lib/plants";

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

// look of a plant slot. "slot" (from globals.css) gives the gray bevel.
const slotBase = "slot flex flex-col items-start gap-0.5 p-2 text-left text-ink";
const slotOff = "hover:bg-slot-hover";                                         // not selected
const slotOn = "border-4 border-white bg-slot-selected pb-3.5 outline-2 outline-black"; // selected

export default function ControlPanel(props: Props) {
  return (
    <section className="panel w-full p-4">
      <h2 className="heading">Plant groups</h2>

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
                  so the next/image lint rule is switched off for this line. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={style.image}
                alt=""
                className="size-10 object-contain [image-rendering:pixelated]"
              />
              <span className="font-body text-input leading-none">{group}</span>
              <span className="font-pixel text-pixel-tiny text-ink-soft">{style.tag}</span>
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