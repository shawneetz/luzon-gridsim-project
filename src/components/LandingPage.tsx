"use client";

// LandingPage.tsx
// the title screen, like the minecraft home menu. it shows the game logo,
// a bouncing splash text, a narrow column of menu buttons, and a footer
// it holds two bits of state (the player's day or night choice, and which
// element is the info dialog); everything else comes in through props
//
// styling: everything is tailwind classes written in this file
// the only things that live in globals.css are the shared looks
// (.btn, .panel) and the splash keyframes (animate-splash)
//
// background: the scenery lives in LandingBackground.tsx (sky, stars, sun, moon,
// clouds, hills, ground). this file decides if it is day or night and shows the
// toggle button, because the background itself is hidden from the mouse and
// from screen readers
// the wrapper below only has to be relative and isolate, so the background
// can sit behind everything with -z-10
//
// "how it works":
//   a hover tooltip on the button, and a native <dialog> opened with showModal()
//   the browser handles the backdrop, the esc key and the focus trap for us
//
// layout (edit the tailwind classes below):
//   menu buttons: max-w-xs (320px), centered by the items-center of the wrapper
//   day and night button: pinned to the top right with absolute right-4 top-4
//   footer: one row from sm up (corner text, disclaimer, corner text), stacked on phones
//   wrapper padding (task 6.1): pt-16 keeps the logo under the day and night button on
//   phones, pb-24 keeps the three line footer from covering the buttons on short screens,
//   from sm up the footer is one line, so the bottom padding goes back to pb-12

import { useId, useRef, useState, useSyncExternalStore } from "react";
import LandingBackground from "./LandingBackground";

/** props for the {@link LandingPage} component */
interface LandingPageProps {
  /** called when the player presses "Start Simulation" */
  onStart: () => void;
}

// thick dark shadow for the big logo letters (used on both words)
const logoShadow = "[text-shadow:4px_4px_0_#1e1e1e,7px_7px_0_#000000]";

// night lasts from 6 pm up to (but not including) 6 am, in the player's local time
const NIGHT_START_HOUR = 18;
const NIGHT_END_HOUR = 6;

/**
 * tells if a clock hour counts as night
 *
 * @param hour - hour of the day from 0 to 23
 * @returns true from 18:00 to 05:59, false otherwise
 *
 * @example
 * ```ts
 * isNightHour(5);  // true
 * isNightHour(6);  // false
 * isNightHour(18); // true
 * ```
 */
function isNightHour(hour: number): boolean {
  return hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR;
}

// pieces for useSyncExternalStore, written once outside the component so they stay the same between renders
// the clock never sends change events, so subscribe does nothing and returns an empty cleanup
const subscribeToNothing = () => () => {};
// in the browser: read the local hour
const getNightNow = () => isNightHour(new Date().getHours());
// on the server: the local hour is unknown, so always start with day
const getNightOnServer = () => false;

/**
 * title screen shown before the simulator
 *
 * @remarks
 * this is a client component because it keeps state, uses a ref to open the
 * dialog, and reads the browser clock
 *
 * day or night:
 * - by default it follows the player's local clock (see {@link isNightHour})
 * - `useSyncExternalStore` returns day on the server and the real clock in the
 *   browser, so there is no hydration mismatch, and the scene fades to night
 *   after load when it is night
 * - pressing the button saves an override, which wins over the clock until the
 *   player leaves this screen (going to the simulator unmounts this component,
 *   so the choice resets when they come back)
 *
 * how it works dialog:
 * - opened with `showModal()` on a ref, closed with the done button, the esc key,
 *   or a click on the backdrop
 * - the `<dialog>` is transparent with no padding and the visible panel is an
 *   inner div, so any click that lands on the dialog element itself is a
 *   backdrop click
 * - do not add a display class (`flex`, `grid`, ...) to the `<dialog>`, it would
 *   override the browser's `display: none` and show the dialog while it is closed
 * - `m-auto` is needed because tailwind's preflight resets the margin that
 *   centers a modal dialog
 *
 * responsive edge cases (task 6.1):
 * - the splash text sticks out to the right of the logo, on a 390px phone that can push
 *   the page wider than the screen, so the wrapper has `overflow-x-clip` (clip, not
 *   hidden, so it does not turn the wrapper into a scroll container)
 * - the footer is `absolute`, so it takes no space in the layout, the bottom padding is
 *   what keeps the menu buttons clear of it
 *
 * edge cases:
 * - the wrapper must keep `relative isolate`, because the background uses
 *   `-z-10` and would go behind the page body without it
 * - the tooltip is `opacity-0`, not `hidden`, so screen readers can still read it
 *   through `aria-describedby`
 * - the tooltip shows on keyboard focus only (`:focus-visible`), so it does not
 *   pop up after a mouse click when focus returns to the button
 * - the splash text uses `animate-splash`, which is switched off for people
 *   who ask their system for reduced motion (see globals.css)
 *
 * @example
 * ```tsx
 * <LandingPage onStart={() => setStarted(true)} />
 * ```
 */
export default function LandingPage({ onStart }: LandingPageProps) {
  // the info dialog, opened and closed through this ref
  const infoRef = useRef<HTMLDialogElement>(null);

  // ids that connect the button to its tooltip and the dialog to its title
  const tooltipId = useId();
  const titleId = useId();

  // what the clock says, and what the player picked (null = they have not touched the button)
  const clockSaysNight = useSyncExternalStore(subscribeToNothing, getNightNow, getNightOnServer);
  const [override, setOverride] = useState<boolean | null>(null);
  const night = override ?? clockSaysNight;

  return (
    // isolate keeps the background (-z-10) inside this wrapper
    <div className="relative isolate flex min-h-screen flex-col items-center justify-center gap-12 overflow-x-clip px-4 pb-24 pt-16 sm:pb-12">
      {/* background scenery: sky, stars, sun, moon, clouds, hills and ground */}
      <LandingBackground night={night} />

      {/* day and night button: the label says what pressing it will do */}
      <button type="button" className="btn absolute right-4 top-4" onClick={() => setOverride(!night)}>
        {night ? "☀️ Switch to day" : "🌙 Switch to night"}
      </button>

      {/* logo: two stacked words, the splash text is pinned to its bottom right */}
      <h1 className="relative text-center font-pixel font-normal leading-tight">
        <span className={`block text-5xl text-panel md:text-6xl ${logoShadow}`}>LUZON</span>
        <span className={`block text-5xl text-gold md:text-6xl ${logoShadow}`}>GRIDSIM</span>
        <span className="gold-shadow absolute -bottom-6 -right-4 w-max animate-splash font-body text-large text-gold md:-right-20">
          Cheapest power in Luzon!
        </span>
      </h1>

      {/* menu buttons: narrow and centered like the real title screen
          .btn comes from globals.css, btn-grass makes it green */}
      <div className="flex w-full max-w-xs flex-col gap-3">
        <button type="button" className="btn btn-grass w-full py-5 text-pixel-sub" onClick={onStart}>
          Start Simulation
        </button>

        {/* group lets the tooltip react to the hover and focus of the button */}
        <div className="group relative">
          <button
            type="button"
            className="btn w-full py-5 text-pixel-sub"
            aria-haspopup="dialog"
            aria-describedby={tooltipId}
            onClick={() => infoRef.current?.showModal()}
          >
            How It Works
          </button>

          {/* item tooltip: dark purple frame like the in-game one, shown above the button
              pointer-events-none so it never blocks the click on the button */}
          <span
            id={tooltipId}
            role="tooltip"
            className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max max-w-64 -translate-x-1/2 border-2 border-tooltip-border bg-tooltip-bg px-3 py-1.5 text-center text-body text-white opacity-0 outline-2 outline-black transition-opacity group-hover:opacity-100 group-has-[:focus-visible]:opacity-100 motion-reduce:transition-none"
          >
            See how the cheapest dispatch is found
          </span>
        </div>
      </div>

      {/* info dialog: native modal, see the remarks above for why it is built this way */}
      <dialog
        ref={infoRef}
        aria-labelledby={titleId}
        className="m-auto w-[min(32rem,calc(100%-2rem))] bg-transparent p-0 text-ink backdrop:bg-black/60"
        // a click on the dialog element itself (not on the panel inside) is a backdrop click
        onClick={(e) => {
          if (e.target === e.currentTarget) infoRef.current?.close();
        }}
      >
        <div className="panel p-5">
          <h2 id={titleId} className="heading">
            How it works
          </h2>
          <p className="mb-3 text-body">
            The simplex method finds the cheapest way to run the Luzon grid for one day while meeting demand in
            every block.
          </p>
          <ol className="list-decimal space-y-1 pl-6 text-body">
            <li>Pick your plant groups, and switch on the CO₂ cap if you want one.</li>
            <li>Press Solve.</li>
            <li>Read the output of each plant and the price of electricity in each block.</li>
            <li>Open the Simplex Tableau tab to step through every iteration.</li>
          </ol>
          <p className="mt-3 text-body">The price in each block comes from the shadow prices of the final tableau.</p>

          <button
            type="button"
            className="btn btn-grass mt-4 w-full py-4"
            onClick={() => infoRef.current?.close()}
          >
            Done
          </button>
        </div>
      </dialog>

      {/* footer: one row from sm up, stacked and centered on phones */}
      <div className="absolute inset-x-4 bottom-3 flex flex-col items-center gap-0.5 text-center text-small text-white sm:flex-row sm:justify-between sm:gap-4">
        <span className="pixel-shadow-sm">CMSC 150 · UPLB</span>
        <span className="pixel-shadow-sm text-white/80">Not affiliated with Mojang or Microsoft</span>
        <span className="pixel-shadow-sm">Simplex Method v1.0</span>
      </div>
    </div>
  );
}

// references:
// mdn, dialog element: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog
// mdn, htmldialogelement.showmodal(): https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal
// mdn, overflow (clip value): https://developer.mozilla.org/en-US/docs/Web/CSS/overflow#clip
// mdn, :focus-visible: https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible
// react, useSyncExternalStore: https://react.dev/reference/react/useSyncExternalStore
// react, useRef: https://react.dev/reference/react/useRef
// react, useId: https://react.dev/reference/react/useId
// tailwind css v4, overflow: https://tailwindcss.com/docs/overflow
// tailwind css v4, padding: https://tailwindcss.com/docs/padding
// tailwind css v4, responsive design: https://tailwindcss.com/docs/responsive-design
// tailwind css v4, hover, focus and other states (group, has): https://tailwindcss.com/docs/hover-focus-and-other-states
// next.js, server and client components: https://nextjs.org/docs/app/getting-started/server-and-client-components
// tsdoc standard: https://tsdoc.org