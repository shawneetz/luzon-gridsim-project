/*
 * page.tsx
 * The main (and only) page of Luzon GridSim. It keeps all the state
 * (selected plant groups, CO2 cap, solver result) and connects the
 * control panel on the left with the Results / Simplex Tableau tabs
 * on the right. It talks to the R API through the helpers in lib/api.ts.
 */

"use client";

import { useEffect, useState } from "react";
import ControlPanel from "@/components/ControlPanel";
import ResultsTab from "@/components/ResultsTab";
import TableauTab from "@/components/TableauTab";
import { fetchOptions, solve } from "@/lib/api";
import type { Options, SolveResponse } from "@/lib/types";

type Tab = "results" | "tableau";

export default function Home() {
  const [options, setOptions] = useState<Options | null>(null); // plant groups + default CO2 cap from the API
  const [loadError, setLoadError] = useState("");              // message if the API cannot be reached
  const [selected, setSelected] = useState<string[]>([]);      // plant groups the user ticked
  const [co2On, setCo2On] = useState(false);                   // is the CO2 cap switched on?
  const [co2Cap, setCo2Cap] = useState("");                    // CO2 cap typed by the user (kept as text)
  const [result, setResult] = useState<SolveResponse | null>(null); // latest answer from the solver
  const [loading, setLoading] = useState(false);               // true while waiting for the solver
  const [tab, setTab] = useState<Tab>("results");              // which tab is open
  const [runId, setRunId] = useState(0);                       // changes on every solve, to reset the tableau viewer

  // When the page loads, ask the API for the plant groups and default CO2 cap
  useEffect(() => {
    fetchOptions()
      .then((data) => {
        setOptions(data);
        setSelected(data.groups);            // start with every group checked
        setCo2Cap(String(data.defaultCo2Cap));
      })
      .catch(() => setLoadError("Could not reach the solver API. Is the R API running on port 8000?"));
  }, []);

  // Tick or untick one plant group
  function toggleGroup(group: string) {
    setSelected((now) => (now.includes(group) ? now.filter((g) => g !== group) : [...now, group]));
  }

  // Send the user's choices to the solver and show the answer
  async function handleSolve() {
    setLoading(true);
    try {
      setResult(await solve({ groups: selected, co2On, co2Cap }));
      setRunId((id) => id + 1);
      setTab("results");
    } catch {
      // Never show raw errors, only a friendly message
      setResult({ status: "error", message: "Could not reach the solver API. Is the R API running?" });
    } finally {
      setLoading(false);
    }
  }

  // The tableau tab only works when the solver returned tableaus
  const hasTableaus = result?.tableaus && result.tableaus.length > 0;

  return (
    <main>
      <header>
        <h1>Luzon GridSim</h1>
        <p>The cheapest way to run the grid for one day, solved with the simplex method.</p>
      </header>

      {loadError && <p className="banner warning">{loadError}</p>}

      {/* Show the app only after the options are loaded */}
      {options && (
        <div className="layout">
          {/* Left side: plant group checkboxes, CO2 cap, Solve button */}
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

          <section className="card">
            {/* Right side: tabs for the results and the simplex tableaus */}
            <div className="tabs">
              <button className={tab === "results" ? "active" : ""} onClick={() => setTab("results")}>
                Results
              </button>
              <button
                className={tab === "tableau" ? "active" : ""}
                onClick={() => setTab("tableau")}
                disabled={!hasTableaus}
              >
                Simplex Tableau
              </button>
            </div>

            {!result && <p className="hint">Pick the plant groups and press Solve.</p>}
            {result && tab === "results" && <ResultsTab result={result} />}
            {/* key={runId} resets the viewer to iteration 0 on every new solve */}
            {result && tab === "tableau" && hasTableaus && <TableauTab key={runId} steps={result.tableaus!} />}
          </section>
        </div>
      )}
    </main>
  );
}
