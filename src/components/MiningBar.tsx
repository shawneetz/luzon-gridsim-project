// the loading look of the solve button: a row of small dirt blocks that
// pulse one after another, like blocks being mined, with a "mining..." label
// it replaces the plain "solving..." text while the r api is working
//
// how it works:
//   every block uses the animate-twinkle class that already lives in globals.css
//   (a fade in and out), with a different delay per block, so the fade runs along
//   the row like a wave
//   no new keyframes are needed, so globals.css stays as it is
//
// layout (edit the tailwind classes below):
//   block size: size-3 (12px), block count: BLOCK_COUNT below
//   speed: PULSE_SECONDS is one fade, STAGGER_SECONDS is the gap between blocks

/** props for the {@link MiningBar} component */
interface MiningBarProps {
  /** text next to the blocks (default: "Mining...") */
  label?: string;
}

// how many blocks are in the bar
const BLOCK_COUNT = 8;
// seconds for one block to fade in and out
const PULSE_SECONDS = 0.8;
// seconds between the start of two neighbouring blocks
const STAGGER_SECONDS = 0.1;

// one list for the whole app run, so the blocks are not rebuilt on every render
const blocks = Array.from({ length: BLOCK_COUNT }, (_, i) => i);

/**
 * a row of pulsing blocks with a label, shown inside the solve button while loading
 *
 * @param props - see {@link MiningBarProps}
 *
 * @remarks
 * has no state and no hooks, so it needs no "use client" of its own
 *
 * edge cases:
 * - the blocks are decorative, so they are hidden from screen readers with
 *   `aria-hidden`, the label is what gets read
 * - duration and delay use inline `style`, not tailwind classes, because
 *   `animate-twinkle` is a shorthand and could override an `animation-duration` class
 *   (same reason as the clouds in LandingBackground.tsx)
 * - with reduced motion, globals.css turns `animate-twinkle` off, so the blocks stay
 *   still and fully visible, the label still says the app is working
 *
 * @example
 * ```tsx
 * <button disabled>{loading ? <MiningBar /> : "Solve"}</button>
 * ```
 */
export default function MiningBar({ label = "Mining..." }: MiningBarProps) {
  return (
    <span className="flex items-center justify-center gap-3">
      <span aria-hidden="true" className="flex gap-1">
        {blocks.map((i) => (
          <span
            key={i}
            className="size-3 animate-twinkle border-2 border-black bg-dirt"
            style={{
              animationDuration: `${PULSE_SECONDS}s`,
              animationDelay: `${(i * STAGGER_SECONDS).toFixed(2)}s`,
            }}
          />
        ))}
      </span>
      <span>{label}</span>
    </span>
  );
}

// references:
// tailwind css v4, animation: https://tailwindcss.com/docs/animation
// mdn, animation-delay: https://developer.mozilla.org/en-US/docs/Web/CSS/animation-delay
// mdn, aria-hidden: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-hidden
// mdn, prefers-reduced-motion: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
// react, rendering lists (keys): https://react.dev/learn/rendering-lists
// tsdoc standard: https://tsdoc.org