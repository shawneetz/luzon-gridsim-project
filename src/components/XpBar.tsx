// XpBar.tsx
// an xp bar style progress strip, like the experience bar above the hotbar in the game
// it shows a green fill for how far along the player is, with a label in the middle
// (the tableau tab uses it to show "iteration n of total")
// it is also a slider: click anywhere on it, or focus it and use the keyboard, to move
// it holds no state, the parent owns the value and gets told through `onChange`
//
// keyboard (when the strip is focused):
//   left or down arrow   one step back
//   right or up arrow    one step forward
//   home or end          first or last step
//
// layout (edit the tailwind classes below):
//   bar height: h-11 (44px), the minimum touch target size, it was h-7 (28px) before
//   the fill is the only element with a dynamic width, so its width is an inline style
//   the notches are thin black lines, one between every two steps

/** props for the {@link XpBar} component */
interface XpBarProps {
  /** current step, from 0 to `max` */
  value: number;
  /** last step, so the bar has `max + 1` steps in total (0 means there is only one step) */
  max: number;
  /** text in the middle of the bar, also read by screen readers as the value, e.g. "Iteration 3 of 12" */
  label: string;
  /** accessible name of the slider, e.g. "Simplex iteration" */
  ariaLabel: string;
  /** called with the new step when the player clicks the bar or presses a key */
  onChange: (value: number) => void;
}

// bar frame: hotbar gray with a black border and the same focus ring as the other controls
// h-11 (44px) because the bar is a click target, see wcag target size
// cursor-pointer because a click on the bar jumps to that step
const frame =
  "relative h-11 w-full cursor-pointer border-2 border-black bg-hotbar focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

// green fill with a lighter top edge, like the lit part of the in-game bar
// the width animates a little, and motion-reduce makes it instant for people who ask for less motion
const fill =
  "absolute inset-y-0 left-0 bg-xp shadow-[inset_0_3px_0_rgba(255,255,255,0.35)] transition-[width] duration-200 motion-reduce:transition-none";

// label sits on top of the fill, pointer-events-none so a click on the text still reaches the bar
const labelBox =
  "pointer-events-none absolute inset-0 flex items-center justify-center font-pixel text-pixel-label text-white pixel-shadow-sm";

/**
 * keeps a number between 0 and `max`
 *
 * @param n - the number to limit
 * @param max - the highest allowed value
 * @returns `n`, but never below 0 and never above `max`
 *
 * @example
 * ```ts
 * clamp(-1, 5); // 0
 * clamp(9, 5);  // 5
 * ```
 */
function clamp(n: number, max: number): number {
  return Math.min(max, Math.max(0, n));
}

/**
 * xp bar style slider for stepping through a list
 *
 * @param props - see {@link XpBarProps}
 *
 * @remarks
 * has no state and no hooks, so it needs no "use client" of its own,
 * the client tableau tab renders it and passes the handlers
 *
 * edge cases:
 * - `max` of 0 (a single step) fills the whole bar, instead of dividing by zero
 * - a click is turned into a step with `Math.round`, so it picks the nearest step
 * - a click on a zero width bar (hidden or not laid out yet) is ignored
 * - `value` is clamped before drawing, so a stale value can never push the fill past the frame
 * - the notches are drawn between steps only, so there are `max - 1` of them
 * - keys that are not listed are left alone, so Tab still moves the focus away
 *   and the arrow keys do not scroll the page only while the strip is focused
 * - `aria-valuetext` carries the label, so screen readers say "Iteration 3 of 12"
 *   and not just the raw number
 * - the taller bar only changes the frame, the click math uses the width, so
 *   nothing else needs to change
 *
 * @example
 * ```tsx
 * <XpBar value={index} max={steps.length - 1} label="Iteration 3 of 12" ariaLabel="Simplex iteration" onChange={setIndex} />
 * ```
 */
export default function XpBar({ value, max, label, ariaLabel, onChange }: XpBarProps) {
  const safeValue = clamp(value, max);
  const share = max === 0 ? 1 : safeValue / max; // 0 to 1, how much of the bar is filled

  /** moves one step with the arrow keys, or jumps to the ends with home and end */
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    let next: number;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = safeValue - 1;
    else if (e.key === "ArrowRight" || e.key === "ArrowUp") next = safeValue + 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = max;
    else return; // not our key, let the browser handle it

    e.preventDefault(); // stops the page from scrolling
    onChange(clamp(next, max));
  }

  /** jumps to the step under the mouse or finger */
  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    const clickShare = (e.clientX - rect.left) / rect.width;
    onChange(clamp(Math.round(clickShare * max), max));
  }

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={safeValue}
      aria-valuetext={label}
      className={frame}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
    >
      {/* green fill, its width is the only dynamic style so it stays inline */}
      <div className={fill} style={{ width: `${share * 100}%` }} />

      {/* notches between steps, so the player can count the iterations */}
      {Array.from({ length: Math.max(0, max - 1) }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 w-px bg-black/40"
          style={{ left: `${((i + 1) / max) * 100}%` }}
        />
      ))}

      <span className={labelBox}>{label}</span>
    </div>
  );
}

// references:
// wai-aria authoring practices, slider pattern: https://www.w3.org/WAI/ARIA/apg/patterns/slider/
// w3c wcag 2.2, target size (minimum), 2.5.8: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
// mdn, slider role: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/slider_role
// mdn, aria-valuetext: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-valuetext
// mdn, keyboardevent.key values: https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values
// mdn, element.getBoundingClientRect: https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
// mdn, math.round: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round
// react, responding to events: https://react.dev/learn/responding-to-events
// react, rendering lists (keys): https://react.dev/learn/rendering-lists
// react, typescript with events (KeyboardEvent, MouseEvent): https://react.dev/learn/typescript#typing-events
// tailwind css v4, height: https://tailwindcss.com/docs/height
// tailwind css v4, transition-property: https://tailwindcss.com/docs/transition-property
// tailwind css v4, outline: https://tailwindcss.com/docs/outline
// tailwind css v4, hover, focus and other states (focus-visible): https://tailwindcss.com/docs/hover-focus-and-other-states
// minecraft wiki, experience bar (ui reference only, no assets copied): https://minecraft.wiki/w/Experience
// tsdoc standard: https://tsdoc.org