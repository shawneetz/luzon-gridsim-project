// LandingBackground.tsx
// the scenery behind the title screen, drawn only with divs, svg and tailwind classes
// (no image files), so it stays sharp at any screen size
//
// layers, from back to front (dom order decides what is in front):
//   1) sky         day gradient, with a night gradient fading in on top of it
//   2) stars       small twinkling squares, only visible at night
//   3) sun         a square sun with a soft glow, sets at night
//   4) moon        a pale square with craters, rises at night
//   5) clouds      blocky clouds drifting left to right, dimmed at night
//   6) dimmed group (darkened with a filter at night)
//        far hills   stepped silhouette, faded so it looks far away
//        near hills  stepped silhouette, solid dark grass
//        ground      grass row, grass tufts, dirt pattern, stone band
//   7) vignette    dark edges around the screen
//
// day and night:
//   the `night` prop decides the mode, the parent owns the state (see LandingPage.tsx)
//   every change fades over 1 second with css transitions, so nothing snaps
//
// layout (edit the tailwind classes below):
//   the root fills its parent with absolute inset-0 and sits behind it with -z-10,
//   so the parent must create its own stacking context (add "isolate" to it)
//   ground height is h-[28%], and the hills use bottom-[27%] so they tuck behind
//   the grass line. if you change the ground height, change both numbers
//
// clouds:
//   every cloud uses the same block size (1.5vw per grid column), so the pixels match
//   the drift animation (globals.css) moves a cloud from -30vw to 130vw, so a cloud
//   must be 30vw wide or less to start fully off screen

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

// shared fade for everything that changes between day and night
// motion-reduce:transition-none makes the switch instant for people who ask for less motion
// (the reduced motion rule in globals.css only covers animate-* classes, not transitions)
const fade = "transition-all duration-1000 motion-reduce:transition-none";

/** one star in the night sky, positions are percentages inside the star layer */
interface Star {
  /** distance from the left edge, 0 to 100 */
  left: number;
  /** distance from the top of the star layer, 0 to 100 */
  top: number;
  /** true for the few bigger stars */
  big: boolean;
  /** twinkle start delay in seconds, so the stars do not blink together */
  delay: number;
}

/**
 * makes a fixed list of stars from a seeded random number generator
 *
 * @param count - how many stars to make
 * @returns the same stars every time it is called
 *
 * @remarks
 * `Math.random()` is not used on purpose: the server and the browser would
 * draw different stars and react would report a hydration mismatch
 * the generator is a small lehmer (park-miller) one, so the layout is stable
 * change `seed` to get a different sky
 *
 * @example
 * ```ts
 * makeStars(3).length; // 3
 * ```
 */
function makeStars(count: number): Star[] {
  let seed = 7;
  const next = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  return Array.from({ length: count }, () => ({
    left: next() * 100,
    top: next() * 100,
    big: next() > 0.8,
    delay: next() * 2,
  }));
}

// computed once when the file loads, not on every render
const stars = makeStars(42);

/** one horizontal run of filled blocks in a cloud shape, in grid units */
interface CloudRun {
  /** column where the run starts */
  x: number;
  /** row of the run, 0 is the top row */
  y: number;
  /** how many blocks wide the run is */
  w: number;
}

/**
 * turns an ascii cloud shape into runs of filled blocks
 *
 * @param shape - one string per row, `X` is a block and `.` is empty
 * @returns one {@link CloudRun} per group of neighbouring `X` in a row
 *
 * @remarks
 * drawing one rect per run (not one per block) keeps the svg small
 * all rows of a shape must have the same length, or the cloud looks cut off
 *
 * @example
 * ```ts
 * cloudRuns(["..XX", "XXXX"]);
 * // [{ x: 2, y: 0, w: 2 }, { x: 0, y: 1, w: 4 }]
 * ```
 */
function cloudRuns(shape: readonly string[]): CloudRun[] {
  const runs: CloudRun[] = [];
  shape.forEach((row, y) => {
    for (const match of row.matchAll(/X+/g)) {
      runs.push({ x: match.index ?? 0, y, w: match[0].length });
    }
  });
  return runs;
}

// cloud shapes: redraw them by editing the strings (X = block, . = empty)
// the widths below (8, 12, 14 and 16 columns) are used for the w-[..vw] classes in `clouds`
const cloudSmall = [
  "..XXXX..",
  "XXXXXXXX",
];
const cloudMedium = [
  "....XXXX....",
  "..XXXXXXXX..",
  "XXXXXXXXXXXX",
];
const cloudWide = [
  "...XXX........",
  "..XXXXX..XXX..",
  ".XXXXXXXXXXXXX",
  "XXXXXXXXXXXXXX",
];
const cloudBig = [
  "....XXXX........",
  "..XXXXXXXX.XXX..",
  "XXXXXXXXXXXXXXXX",
  ".XXXXXXXXXXXXXX.",
];

/** settings for one cloud in the sky */
interface CloudConfig {
  /** the ascii grid of the cloud */
  shape: readonly string[];
  /**
   * position and size classes, written in full so tailwind can find them:
   * top, a static left (used when motion is reduced), and a width of columns x 1.5vw
   */
  className: string;
  /** how long one trip across the screen takes, in seconds (higher = slower) */
  seconds: number;
  /** negative start delay in seconds, so the clouds do not all begin at the same spot */
  delay: number;
}

/**
 * the clouds in the sky: different shapes, heights, speeds and start points
 *
 * @remarks
 * speeds range from 70s to 130s, so the sky never looks like it is in sync
 * the negative delays make the page load with clouds already spread across the screen
 */
const clouds: readonly CloudConfig[] = [
  { shape: cloudBig,    className: "top-[9%] left-[8%] w-[24vw]",   seconds: 110, delay: -20 },
  { shape: cloudWide,   className: "top-[20%] left-[55%] w-[21vw]", seconds: 85,  delay: -50 },
  { shape: cloudSmall,  className: "top-[6%] left-[72%] w-[12vw]",  seconds: 130, delay: -90 },
  { shape: cloudMedium, className: "top-[28%] left-[30%] w-[18vw]", seconds: 100, delay: -70 },
  { shape: cloudWide,   className: "top-[15%] left-[88%] w-[21vw]", seconds: 70,  delay: -10 },
];

/** props for the {@link Cloud} component */
interface CloudProps {
  /** the ascii grid of the cloud, see {@link cloudRuns} */
  shape: readonly string[];
  /** extra tailwind classes for position and width */
  className: string;
  /** seconds for one trip across the screen */
  seconds: number;
  /** negative start delay in seconds */
  delay: number;
}

/**
 * one blocky cloud that drifts from the left edge to the right edge
 *
 * @remarks
 * the bottom row is a little darker (a light blue gray), so the cloud has a flat shadow
 *
 * edge cases:
 * - motion allowed: `motion-safe:left-0` replaces the static left position and
 *   `motion-safe:animate-drift` moves the cloud with the `drift` keyframes
 * - motion reduced: the cloud stays still at its static `left-[..%]` position,
 *   so the sky still looks full instead of stacking every cloud at the left edge
 * - speed and delay use inline `style`, not tailwind classes, because
 *   `animate-drift` is a shorthand and could override an `animation-duration` class
 *
 * @example
 * ```tsx
 * <Cloud shape={cloudSmall} className="top-[6%] left-[72%] w-[12vw]" seconds={130} delay={-90} />
 * ```
 */
function Cloud({ shape, className, seconds, delay }: CloudProps) {
  const runs = cloudRuns(shape);
  const width = shape[0].length;
  const lastRow = shape.length - 1;

  return (
    <div
      className={`absolute motion-safe:left-0 motion-safe:animate-drift ${className}`}
      style={{ animationDuration: `${seconds}s`, animationDelay: `${delay}s` }}
    >
      <svg
        viewBox={`0 0 ${width} ${shape.length}`}
        className="block h-auto w-full opacity-90 [shape-rendering:crispEdges]"
      >
        {runs.map((run) => (
          <rect
            key={`${run.y}-${run.x}`}
            x={run.x}
            y={run.y}
            width={run.w}
            height={1}
            className={run.y === lastRow ? "fill-[#d6e6fa]" : "fill-cloud"}
          />
        ))}
      </svg>
    </div>
  );
}

/** props for the {@link LandingBackground} component */
interface LandingBackgroundProps {
  /**
   * true shows the night scene (dark sky, stars, moon, dim ground),
   * false shows the day scene (default: false)
   */
  night?: boolean;
}

/**
 * full screen pixel scenery for the landing page, in day or night mode
 *
 * @remarks
 * has no state and no hooks, so it needs no "use client" of its own: the mode
 * comes in through the `night` prop and the parent decides when it changes
 * it is decorative only, so it is hidden from screen readers with `aria-hidden`
 * and ignores the mouse with `pointer-events-none`. this is also why the
 * toggle button lives in the parent and not here
 *
 * edge cases:
 * - the parent must be `relative` and create a stacking context (`isolate`),
 *   otherwise `-z-10` can push the background behind the page body
 * - the root has `overflow-hidden`, so clouds drifting past the right edge
 *   (up to 130vw) never create a horizontal scrollbar
 * - the sky cannot animate between two gradients, so the night gradient is a
 *   second layer that fades in with `opacity`
 * - the dimmed group uses a css `filter`, so it only holds static shapes; the
 *   clouds are outside of it because a filter on moving children would be
 *   recalculated every frame
 * - `image-rendering: pixelated` and `crispEdges` keep every edge sharp,
 *   so nothing should be scaled with a blurry filter inside this component
 *
 * @example
 * ```tsx
 * <div className="relative isolate min-h-screen">
 *   <LandingBackground night={isNight} />
 *   ...page content...
 * </div>
 * ```
 */
export default function LandingBackground({ night = false }: LandingBackgroundProps) {
  return (
    // 1) sky: the day gradient is the base, the night gradient fades in over it
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-linear-to-b from-sky-top to-sky-bottom [image-rendering:pixelated]"
    >
      <div
        className={`absolute inset-0 bg-linear-to-b from-sky-night-top to-sky-night-bottom ${fade} ${
          night ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* 2) stars: only in the upper part of the sky, the whole layer fades with the mode
          each star twinkles on its own with animate-twinkle and a different delay */}
      <div className={`absolute inset-x-0 top-0 h-[60%] ${fade} ${night ? "opacity-100" : "opacity-0"}`}>
        {stars.map((star, i) => (
          <span
            key={i}
            className={`absolute animate-twinkle bg-white ${star.big ? "size-1.5" : "size-1"}`}
            style={{
              left: `${star.left.toFixed(2)}%`,
              top: `${star.top.toFixed(2)}%`,
              animationDelay: `${star.delay.toFixed(2)}s`,
            }}
          />
        ))}
      </div>

      {/* 3) sun: a pale square inside a gold square, with a soft glow around it
          at night it slides down and fades out, like it is setting */}
      <div
        className={`absolute right-[12%] top-[10%] size-24 bg-gold shadow-[0_0_80px_20px_rgba(255,216,61,0.45)] ${fade} ${
          night ? "translate-y-48 opacity-0" : "translate-y-0 opacity-100"
        }`}
      >
        <div className="absolute inset-3 bg-[#fff7b0]" />
      </div>

      {/* 4) moon: a pale square with three dark craters
          at day it waits below and is invisible, at night it rises into place */}
      <div
        className={`absolute left-[14%] top-[12%] size-20 bg-[#e8eefc] shadow-[0_0_60px_15px_rgba(200,215,255,0.3)] ${fade} ${
          night ? "translate-y-0 opacity-100" : "translate-y-48 opacity-0"
        }`}
      >
        <div className="absolute left-3 top-4 size-4 bg-[#c3cde6]" />
        <div className="absolute bottom-3 right-4 size-5 bg-[#c3cde6]" />
        <div className="absolute bottom-6 left-8 size-3 bg-[#c3cde6]" />
      </div>

      {/* 5) clouds: after the sun in the dom so they pass in front of it,
          before the hills so they pass behind them
          the wrapper fades them to a dim shade at night */}
      <div className={`absolute inset-0 ${fade} ${night ? "opacity-35" : "opacity-100"}`}>
        {clouds.map((cloud, i) => (
          <Cloud key={i} {...cloud} />
        ))}
      </div>

      {/* 6) dimmed group: hills and ground share one filter, so they all darken together */}
      <div
        className={`absolute inset-0 transition-[filter] duration-1000 motion-reduce:transition-none ${
          night ? "brightness-50" : "brightness-100"
        }`}
      >
        {/* far hills: faded stone gray, so they blend into the sky */}
        <svg
          viewBox={`0 0 ${farHeights.length} 100`}
          preserveAspectRatio="none"
          className="absolute inset-x-0 bottom-[27%] h-[34%] w-full fill-stone-dark opacity-50 [shape-rendering:crispEdges]"
        >
          <polygon points={farPoints} />
        </svg>

        {/* near hills: solid dark grass, in front of the far hills */}
        <svg
          viewBox={`0 0 ${nearHeights.length} 100`}
          preserveAspectRatio="none"
          className="absolute inset-x-0 bottom-[27%] h-[22%] w-full fill-grass-dark [shape-rendering:crispEdges]"
        >
          <polygon points={nearPoints} />
        </svg>

        {/* ground: grass row, dirt with hanging tufts, then a stone band at the bottom */}
        <div className="absolute inset-x-0 bottom-0 flex h-[28%] flex-col">
          <div className="h-4 shrink-0 border-b-4 border-grass-dark bg-grass" />
          <div className={`relative flex-1 ${dirtPattern}`}>
            <div className={`absolute inset-x-0 top-0 h-2 ${grassTufts}`} />
          </div>
          <div className="h-10 shrink-0 border-t-4 border-black/40 bg-stone-dark" />
        </div>
      </div>

      {/* 7) vignette: dark edges around the screen */}
      <div className="absolute inset-0 shadow-[inset_0_0_160px_rgba(0,0,0,0.6)]" />
    </div>
  );
}