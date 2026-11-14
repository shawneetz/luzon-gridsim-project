"use client";

// LandingPage.tsx
// the title screen, like the minecraft home menu. it shows the game logo,
// a bouncing splash text, and a column of wide buttons.
// it holds one bit of state (is the info box open); everything else
// comes in through props.
//
// background: it is ONE element, <div className="menu-bg" />. to make the
// background interactive later, replace that element (e.g. with a canvas)
// and nothing else in this file has to change.
//
// layout (edit the tailwind classes below):
//   the wrapper centers everything in the middle of the screen
//   the footer texts sit in the bottom corners, like minecraft's version text

import { useState } from "react";

interface Props {
  onStart: () => void; // called when the player presses "Start Simulation"
}

export default function LandingPage({ onStart }: Props) {
  // is the "how it works" box open
  const [showInfo, setShowInfo] = useState(false);

  return (
    // isolate keeps the background (-z-10) inside this wrapper
    <div className="relative isolate flex min-h-screen flex-col items-center justify-center gap-12 px-4">
      {/* background: swap this element for the interactive one later */}
      <div className="menu-bg absolute inset-0 -z-10" />

      {/* logo: two stacked words, the splash text is pinned to its bottom right */}
      <h1 className="relative text-center font-pixel font-normal leading-tight">
        <span className="logo-shadow block text-5xl text-panel md:text-6xl">LUZON</span>
        <span className="logo-shadow block text-5xl text-gold md:text-6xl">GRIDSIM</span>
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