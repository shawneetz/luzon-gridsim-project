"use client";

// LandingPage.tsx
// the title screen, like the minecraft home menu. it shows the game logo,
// a bouncing splash text, and a column of wide buttons.
// it holds one bit of state (is the info box open); everything else
// comes in through props.
//
// styling: everything is tailwind classes written in this file.
// the only things that live in globals.css are the shared looks
// (.btn, .panel) and the splash keyframes (animate-splash).
//
// background: ONE container (the first div) with a sky gradient and two
// children (ground, vignette). to make the background interactive later,
// replace that container (e.g. with a canvas) and nothing else has to change.

import { useState } from "react";

interface Props {
  onStart: () => void; // called when the player presses "Start Simulation"
}

// thick dark shadow for the big logo letters (used on both words)
const logoShadow = "[text-shadow:4px_4px_0_#1e1e1e,7px_7px_0_#000000]";

export default function LandingPage({ onStart }: Props) {
  // is the "how it works" box open
  const [showInfo, setShowInfo] = useState(false);

  return (
    // isolate keeps the background (-z-10) inside this wrapper
    <div className="relative isolate flex min-h-screen flex-col items-center justify-center gap-12 px-4">
      {/* background: sky gradient, with the ground and a dark edge on top of it */}
      <div className="absolute inset-0 -z-10 bg-linear-to-b from-[#5aa0e8] to-[#bfe0ff]">
        {/* ground: grass border on top, dirt below, and a darker grass line under the border */}
        <div className="absolute inset-x-0 bottom-0 h-[28%] border-t-16 border-grass bg-dirt shadow-[inset_0_4px_0_var(--color-grass-dark)]" />
        {/* vignette: dark edges around the screen */}
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_160px_rgba(0,0,0,0.6)]" />
      </div>

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