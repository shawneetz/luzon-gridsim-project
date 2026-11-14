"use client";

// page.tsx
// the main (and only) page of the app.
// it first shows the landing page (title screen). after the player presses
// "Start Simulation" it shows the simulator: it loads the options from the
// r api, keeps every user choice in state, sends the choices to /solve,
// and shows either the results tab or the simplex tableau tab.
//
// page layout (edit the tailwind classes below):
//   <main>   centers everything, max width 1320px
//   <header> the grass title strip (with a "Main Menu" button on the right)
//   grid     controls on the left (320px), results on the right (rest of the width)
//            on small screens it becomes one column

import { useEffect, useState } from "react";
import ControlPanel from "@/components/ControlPanel";
import LandingPage from "@/components/LandingPage";
import ResultsTab from "@/components/ResultsTab";
import TableauTab from "@/components/TableauTab";
import { fetchOptions, solve } from "@/lib/api";
import type { Options, SolveResponse } from "@/lib/types";

type Tab = "results" | "tableau";

export default function Home() {
  // false = show the landing page, true = show the simulator
  const [started, setStarted] = useState(false);

  // options from the api (plant group names and default co2 cap)
  const [options, setOptions] = useState<Options | null>(null);
  const [loadError, setLoadError] = useState("");

  // user choices
  const [selected, setSelected] = useState<string[]>([]); // chosen plant groups
  const [co2On, setCo2On] = useState(false);              // is the co2 cap switched on
  const [co2Cap, setCo2Cap] = useState("");               // co2 limit, kept as text

  // solver output and screen state
  const [result, setResult] = useState<SolveResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("results");
  const [runId, setRunId] = useState(0); // changes on every solve so the tableau viewer resets

  // on first load, ask the api for the plant groups and the default co2 cap
  useEffect(() => {
    fetchOptions()
      .then((data) => {
        setOptions(data);
        setSelected(data.groups); // start with every group selected
        setCo2Cap(String(data.defaultCo2Cap));
      })
      // happens when the r script is not running
      .catch(() => setLoadError("Could not reach the solver API. Is the R API running on port 8000?"));
  }, []);

  // add or remove one plant group from the selection
  function toggleGroup(group: string) {
    setSelected((now) => (now.includes(group) ? now.filter((g) => g !== group) : [...now, group]));
  }

  // send the choices to the r solver and show the result
  async function handleSolve() {
    setLoading(true);
    try {
      setResult(await solve({ groups: selected, co2On, co2Cap }));
      setRunId((id) => id + 1);
      setTab("results");
    } catch {
      setResult({ status: "error", message: "Could not reach the solver API. Is the R API running?" });
    } finally {
      setLoading(false);
    }
  }

  // the tableau tab only works when the solver returned tableaus
  const hasTableaus = result?.tableaus && result.tableaus.length > 0;

  // title screen first; the choices and results above are kept when going back and forth
  if (!started) return <LandingPage onStart={() => setStarted(true)} />;

  return (
    <main className="mx-auto w-510 px-4 pb-10">
      {/* header: -mx-4 cancels the main padding so the strip reaches the screen edges */}
      <header className="grass-strip relative -mx-4 mb-6 border-b-4 border-black px-4 pb-5 pt-7">
        <h1 className="ml-10 mt-2 font-pixel text-pixel-title font-normal text-white pixel-shadow">
          Luzon <span className="text-gold">GridSim</span>
        </h1>
        <p className="ml-10 *:mt-3 text-large text-white pixel-shadow-sm">
          Craft the cheapest way to power Luzon for one day. Solved with the simplex method.
        </p>

        {/* goes back to the landing page */}
        <button type="button" className="btn absolute right-10 top-7" onClick={() => setStarted(false)}>
          Main Menu
        </button>
      </header>

      {loadError && <p className="banner border-red text-red">{loadError}</p>}

      {/* the app only shows after the options are loaded */}
      {options && (
        // one column on small screens, two columns (320px | rest) from md up
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[320px_minmax(0,1fr)]">
          {/* left side: controls */}
          <ControlPanel
            groups={options.groups}
            selected={selected}
            onToggleGroup={toggleGroup}
            onCheckAll={() => setSelected(options.groups)}
            onReset={() => setSelected([])}
            co2On={co2On}
            onCo2On={setCo2On}
            co2Cap={co2Cap}
            onCo2Cap={setCo2Cap}
            onSolve={handleSolve}
            loading={loading}
          />

          {/* right side: tabs and their content */}
          <section className="panel w-full p-4">
            {/* tab buttons share the row equally; the active one turns green */}
            <div className="mb-4 flex gap-1.5">
              <button
                className={`btn flex-1 ${tab === "results" ? "btn-grass" : ""}`}
                onClick={() => setTab("results")}
              >
                Results
              </button>
              <button
                className={`btn flex-1 ${tab === "tableau" ? "btn-grass" : ""}`}
                onClick={() => setTab("tableau")}
                disabled={!hasTableaus}
              >
                Simplex Tableau
              </button>
            </div>

            {!result && <p>Pick your plant slots and press Solve.</p>}
            {result && tab === "results" && <ResultsTab result={result} />}
            {result && tab === "tableau" && hasTableaus && <TableauTab key={runId} steps={result.tableaus!} />}
          </section>
        </div>
      )}
    </main>
  );
}