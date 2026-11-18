// LandingBackground.tsx
// the scenery behind the title screen, drawn only with divs, svg and tailwind classes
// (no image files), so it stays sharp at any screen size
//
// layers, from back to front (dom order decides what is in front):
//   1) sky      vertical gradient, from the sky tokens in globals.css
//   2) sun      a square sun with a soft glow
//   3) far hills   stepped silhouette, faded so it looks far away
//   4) near hills  stepped silhouette, solid dark grass
//   5) ground   grass row, grass tufts, dirt pattern, stone band
//   6) vignette dark edges around the screen
//
// layout (edit the tailwind classes below):
//   the root fills its parent with absolute inset-0 and sits behind it with -z-10,
//   so the parent must create its own stacking context (add "isolate" to it)
//   ground height is h-[28%], and the hills use bottom-[27%] so they tuck behind
//   the grass line. if you change the ground height, change both numbers
//
// later tasks build on this file:
//   2.2 adds clouds between the sun and the far hills
//   2.3 adds a night mode (moon, stars, darker sky)

/**
 * turns a list of column heights into the `points` of a stepped svg polygon
 *
 * @param heights - height of each column from 0 to 100, measured from the bottom
 * @returns a `points` string for `<polygon>`, in a viewBox that is
 * `heights.length` wide and 100 tall
 *
 * @remarks
 * every column is 1 unit wide and flat on top, so the outline looks like
 * blocks. the polygon starts and ends on the bottom edge (y = 100) so the
 * shape is filled all the way down
 *
 * @example
 * ```ts
 * hillPoints([10, 30]); // "0,100 0,90 1,90 1,70 2,70 2,100"
 * ```
 */
function hillPoints(heights: readonly number[]): string {
  const points = ["0,100"];
  heights.forEach((h, i) => {
    // top-left and top-right corner of this column
    points.push(`${i},${100 - h}`, `${i + 1},${100 - h}`);
  });
  points.push(`${heights.length},100`);
  return points.join(" ");
}

// column heights for the two hill layers, 28 columns each
// change the numbers to reshape the hills (the two lists must have the same length as their viewBox)
const farHeights = [
  30, 34, 34, 40, 46, 46, 52, 52, 48, 44,
  44, 50, 56, 60, 60, 54, 48, 42, 42, 38,
  44, 50, 50, 46, 40, 36, 36, 32,
];
const nearHeights = [
  18, 18, 22, 26, 26, 30, 30, 26, 22, 22,
  18, 14, 14, 18, 22, 22, 26, 30, 34, 34,
  30, 26, 22, 18, 18, 14, 14, 18,
];

// computed once when the file loads, not on every render
const farPoints = hillPoints(farHeights);
const nearPoints = hillPoints(nearHeights);

// dirt: same checker pattern as the page body in globals.css, written here so the
// ground can be edited without touching the css file
// (underscores become spaces in tailwind arbitrary values)
const dirtPattern =
  "[background:linear-gradient(45deg,var(--color-dirt-dark)_25%,transparent_25%,transparent_75%,var(--color-dirt-dark)_75%)_0_0/32px_32px,linear-gradient(45deg,var(--color-dirt-dark)_25%,transparent_25%,transparent_75%,var(--color-dirt-dark)_75%)_16px_16px/32px_32px,var(--color-dirt)]";

// grass tufts: 16px blocks of grass every 48px, hanging under the grass row
const grassTufts =
  "[background:repeating-linear-gradient(90deg,var(--color-grass)_0_16px,transparent_16px_48px)]";

/**
 * full screen pixel scenery for the landing page
 *
 * @remarks
 * has no props and no state, so it needs no "use client" of its own. it is
 * decorative only, so it is hidden from screen readers with `aria-hidden`
 * and ignores the mouse with `pointer-events-none`
 *
 * edge cases:
 * - the parent must be `relative` and create a stacking context (`isolate`),
 *   otherwise `-z-10` can push the background behind the page body
 * - `image-rendering: pixelated` and `crispEdges` keep every edge sharp,
 *   so nothing should be scaled with a blurry filter inside this component
 *
 * @example
 * ```tsx
 * <div className="relative isolate min-h-screen">
 *   <LandingBackground />
 *   ...page content...
 * </div>
 * ```
 */
export default function LandingBackground() {
  return (
    // 1) sky: gradient from the day sky tokens
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-linear-to-b from-sky-top to-sky-bottom [image-rendering:pixelated]"
    >
      {/* 2) sun: a pale square inside a gold square, with a soft glow around it */}
      <div className="absolute right-[12%] top-[10%] size-24 bg-gold shadow-[0_0_80px_20px_rgba(255,216,61,0.45)]">
        <div className="absolute inset-3 bg-[#fff7b0]" />
      </div>

      {/* 3) far hills: faded stone gray, so they blend into the sky */}
      <svg
        viewBox={`0 0 ${farHeights.length} 100`}
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-[27%] h-[34%] w-full fill-stone-dark opacity-50 [shape-rendering:crispEdges]"
      >
        <polygon points={farPoints} />
      </svg>

      {/* 4) near hills: solid dark grass, in front of the far hills */}
      <svg
        viewBox={`0 0 ${nearHeights.length} 100`}
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-[27%] h-[22%] w-full fill-grass-dark [shape-rendering:crispEdges]"
      >
        <polygon points={nearPoints} />
      </svg>

      {/* 5) ground: grass row, dirt with hanging tufts, then a stone band at the bottom */}
      <div className="absolute inset-x-0 bottom-0 flex h-[28%] flex-col">
        <div className="h-4 shrink-0 border-b-4 border-grass-dark bg-grass" />
        <div className={`relative flex-1 ${dirtPattern}`}>
          <div className={`absolute inset-x-0 top-0 h-2 ${grassTufts}`} />
        </div>
        <div className="h-10 shrink-0 border-t-4 border-black/40 bg-stone-dark" />
      </div>

      {/* 6) vignette: dark edges around the screen */}
      <div className="absolute inset-0 shadow-[inset_0_0_160px_rgba(0,0,0,0.6)]" />
    </div>
  );
}   