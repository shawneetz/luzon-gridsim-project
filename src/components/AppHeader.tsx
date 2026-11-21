// AppHeader.tsx
// the top strip of the simulator: grass strip, dirt block logo, title, subtitle,
// and a right aligned button group: the sound toggle and "main menu"
// it holds no state, the page passes the sound state and the button actions in through props
//
// layout (edit the tailwind classes below):
//   outer <header>  full width, so the grass reaches both screen edges
//   inner wrapper   capped at 1320px like the content below, one flex row:
//                   logo and title on the left, button group on the right
//                   on small screens the row wraps and the buttons drop under the title
//   sticky          only when the window is at least 768px wide AND 800px tall,
//                   see the remarks on the component for why
//   title size      1.25rem on phones, the full 1.9rem token from sm up (task 6.1)

/** props for the {@link AppHeader} component */
interface AppHeaderProps {
  /** called when the player presses "Main Menu" */
  onMainMenu: () => void;
  /** true while sound effects are switched on */
  soundOn: boolean;
  /** called when the player presses the sound toggle */
  onToggleSound: () => void;
}

// pixel map of the dirt block icon, one string per row, 8 x 8 cells
// G = grass, g = dark grass, D = dirt, d = dark dirt, L = light soil speck
// all rows must have the same length, or the icon looks cut off
const dirtBlock = [
  "GGGGGGGG",
  "GgGGgGGg",
  "DDdDDDdD",
  "DdDDLDDD",
  "DDDdDDdD",
  "dDDDDLDD",
  "DDdDDDDd",
  "DDDDdDDD",
] as const;

// fill class for each letter of the map
// the classes are written in full so tailwind can find them at build time
const cellFill: Record<string, string> = {
  G: "fill-grass",
  g: "fill-grass-dark",
  D: "fill-dirt",
  d: "fill-dirt-dark",
  L: "fill-soil",
};

// sticky rules: a media query variant, so the header only sticks on big windows
// underscores become spaces in tailwind arbitrary values
const stickyOnTall =
  "[@media(min-width:768px)_and_(min-height:800px)]:sticky [@media(min-width:768px)_and_(min-height:800px)]:top-0";

/**
 * small pixel art dirt block with a grass top, drawn with svg rects
 *
 * @remarks
 * no image file is needed, so it stays sharp at any size
 * `crispEdges` stops the browser from blurring the cell borders
 * it is decorative (the title next to it already names the app),
 * so it is hidden from screen readers with `aria-hidden`
 *
 * @example
 * ```tsx
 * <DirtBlockIcon />
 * ```
 */
function DirtBlockIcon() {
  return (
    <svg
      viewBox="0 0 8 8"
      aria-hidden="true"
      className="size-12 shrink-0 border-2 border-black [shape-rendering:crispEdges]"
    >
      {dirtBlock.map((row, y) =>
        // one rect per cell, 64 in total, which is small enough to not need run merging
        [...row].map((letter, x) => (
          <rect key={`${y}-${x}`} x={x} y={y} width={1} height={1} className={cellFill[letter]} />
        )),
      )}
    </svg>
  );
}

/**
 * header of the simulator screen
 *
 * @param props - see {@link AppHeaderProps}
 *
 * @remarks
 * has no state and no hooks, so it needs no "use client" of its own,
 * it is rendered by the client page and the click handler comes from there
 *
 * sticky decision (task 3.1):
 * - the header is about 110px tall, which is too much to keep on a short screen
 * - so it only sticks when the window is at least 768px wide and 800px tall
 * - on a 768px tall screen it scrolls away, so it never covers the controls
 * - when task 3.2 makes the control panel sticky, give it a top offset that
 *   clears this header (about `md:top-32`) only inside the same media query,
 *   otherwise the panel would slide under the header on tall screens
 *
 * responsive decision (task 6.1):
 * - the title uses the press start 2p font, which is very wide (about one
 *   font size per letter), "Luzon GridSim" at 1.9rem is about 395px, wider than
 *   a 390px phone, so below sm it is 1.25rem (about 260px, with the icon it fits)
 * - from sm up the normal `text-pixel-title` token is used again
 *
 * edge cases:
 * - `flex-wrap` lets the button group drop under the title on phones,
 *   `ml-auto` keeps it on the right when it wraps
 * - the group has `flex-wrap` too, so on a very narrow phone the two buttons can sit on two rows
 * - the title is an `h1`, the landing page also has an `h1` but only one of
 *   the two screens is mounted at a time
 *
 * sound toggle (task 6.3):
 * - the visible text changes between "Sound: On" and "Sound: Off", so the text itself says
 *   the state, which is why there is no `aria-pressed` (a changing label plus a pressed
 *   state would be read twice by screen readers)
 * - the speaker emoji is decorative and `aria-hidden`, the words carry the meaning
 * - the button is a normal `.btn`, so it gets the 44px touch size and the focus ring
 * - the click sound for this button is played by the page, not here
 *
 * @example
 * ```tsx
 * <AppHeader onMainMenu={() => setStarted(false)} />
 * ```
 */
export default function AppHeader({ onMainMenu, soundOn, onToggleSound }: AppHeaderProps) {
  return (
    // z-40 keeps the sticky header above the tables and the chart while scrolling
    <header className={`grass-strip z-40 mb-6 border-b-4 border-black px-4 pb-5 pt-7 ${stickyOnTall}`}>
      <div className="mx-auto flex w-full max-w-[1320px] flex-wrap items-center justify-between gap-x-4 gap-y-3">
        {/* left: logo and title block */}
        <div className="flex items-center gap-4">
          <DirtBlockIcon />
          <div>
            <h1 className="font-pixel text-[1.25rem] font-normal text-white pixel-shadow sm:text-pixel-title">
              Luzon <span className="text-gold">GridSim</span>
            </h1>
            <p className="mt-3 text-large text-white pixel-shadow-sm">
              Craft the cheapest way to power Luzon for one day. Solved with the simplex method.
            </p>
          </div>
        </div>

        {/* right: button group, add more buttons here (like the sound toggle) */}
        <div role="group" aria-label="Header actions" className="ml-auto flex flex-wrap items-center gap-2">
          <button type="button" className="btn" onClick={onToggleSound}>
            <span aria-hidden="true">{soundOn ? "🔊" : "🔇"}</span> Sound: {soundOn ? "On" : "Off"}
          </button>
          <button type="button" className="btn" onClick={onMainMenu}>
            Main Menu
          </button>
        </div>
      </div>
    </header>
  );
}

// references:
// tailwind css, arbitrary variants (media query in square brackets): https://tailwindcss.com/docs/hover-focus-and-other-states#using-arbitrary-variants
// tailwind css v4, arbitrary values (text-[1.25rem]): https://tailwindcss.com/docs/adding-custom-styles#using-arbitrary-values
// tailwind css v4, responsive design (sm: breakpoint): https://tailwindcss.com/docs/responsive-design
// tailwind css, position (sticky): https://tailwindcss.com/docs/position
// mdn, position: sticky: https://developer.mozilla.org/en-US/docs/Web/CSS/position
// mdn, height media feature: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/height
// mdn, svg shape-rendering (crispEdges): https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/shape-rendering
// wai-aria, group role: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/group_role
// tsdoc standard: https://tsdoc.org
// react, rendering lists (keys): https://react.dev/learn/rendering-lists