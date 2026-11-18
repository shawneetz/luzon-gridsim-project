"use client";

// LandingPage.tsx
// the title screen, like the minecraft home menu. it shows the game logo,
// a bouncing splash text, and a column of wide buttons
// it holds one bit of state (is the info box open); everything else
// comes in through props
//
// styling: everything is tailwind classes written in this file
// the only things that live in globals.css are the shared looks
// (.btn, .panel) and the splash keyframes (animate-splash)
//
// background: the scenery now lives in LandingBackground.tsx (sky, sun, hills, ground).
// the wrapper below only has to be relative and isolate, so the background
// can sit behind everything with -z-10

import { useState } from "react";
import LandingBackground from "./LandingBackground";

/** props for the {@link LandingPage} component */
interface LandingPageProps {
  /** called when the player presses "Start Simulation" */
  onStart: () => void;
}

// thick dark shadow for the big logo letters (used on both words)
const logoShadow = "[text-shadow:4px_4px_0_#1e1e1e,7px_7px_0_#000000]";

/**
 * title screen shown before the simulator
 *
 * @remarks
 * this is a client component because it keeps the "how it works" box open
 * or closed with `useState`
 *
 * edge cases:
 * - the wrapper must keep `relative isolate`, because the background uses
 *   `-z-10` and would go behind the page body without it
 * - the splash text uses `animate-splash`, which is switched off for people
 *   who ask their system for reduced motion (see globals.css)
 *
 * @example
 * ```tsx
 * <LandingPage onStart={() => setStarted(true)} />
 * ```
 */
export default function LandingPage({ onStart }: LandingPageProps) {
  // is the "how it works" box open
  const [showInfo, setShowInfo] = useState(false);

  return (
    // isolate keeps the background (-z-10) inside this wrapper
    <div className="relative isolate flex min-h-screen flex-col items-center justify-center gap-12 px-4">
      {/* background scenery: sky, sun, hills and ground */}
      <LandingBackground />

      {/* logo: two stacked words, the splash text is pinned to its bottom right */}
      <h1 className="relative text-center font-pixel font-normal leading-tight">
        <span className={`block text-5xl text-panel md:text-6xl ${logoShadow}`}>LUZON</span>
        <span className={`block text-5xl text-gold md:text-6xl ${logoShadow}`}>GRIDSIM</span>
        <span className="gold-shadow absolute -bottom-6 -right-4 w-max animate-splash font-body text-large text-gold md:-right-20">
          Cheapest power in Luzon!
        </span>
      </h1>

      {/* menu buttons: .btn comes from globals.css, btn-grass makes it green */}
      <div className="flex w-full max-w-md flex-col gap-3">
        <button type="button" className="btn btn-grass w-full py-5 text-pixel-sub" onClick={onStart}>
          Start Simulation
        </button>
        <button type="button" className="btn w-full py-5 text-pixel-sub" onClick={() => setShowInfo(!showInfo)}>
          How It Works
        </button>

        {/* info box, only shown after pressing "How It Works" */}
        {showInfo && (
          <div className="panel p-4 text-body">
            Pick your power plants, press Solve, and the simplex method finds the cheapest way to meet Luzon's
            demand for one day. The price of electricity in each block comes from the shadow prices.
          </div>
        )}
      </div>

      {/* bottom corner texts */}
      <span className="pixel-shadow-sm absolute bottom-3 left-4 text-small text-white">CMSC 150 · UPLB</span>
      <span className="pixel-shadow-sm absolute bottom-3 right-4 text-small text-white">Simplex Method v1.0</span>
    </div>
  );
}