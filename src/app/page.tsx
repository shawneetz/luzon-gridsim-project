"use client";

import { useEffect, useState } from "react";
import ControlPanel from "@/components/ControlPanel";
import ResultsTab from "@/components/ResultsTab";
import TableauTab from "@/components/TableauTab";
import { fetchOptions, solve } from "@/lib/api";
import type { Options, SolveResponse } from "@/lib/types";

type Tab = "results" | "tableau";

export default function Home() {
  const [options, setOptions] = useState<Options | null>(null);
  const [loadError, setLoadError] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [co2On, setCo2On] = useState(false);
  const [co2Cap, setCo2Cap] = useState("");
  const [result, setResult] = useState<SolveResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("results");
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    fetchOptions()
      .then((data) => {
        setOptions(data);
        setSelected(data.groups);
        setCo2Cap(String(data.defaultCo2Cap));
      })
      .catch(() => setLoadError("Could not reach the solver API. Is the R API running on port 8000?"));
  }, []);

  function toggleGroup(group: string) {
    setSelected((now) => (now.includes(group) ? now.filter((g) => g !== group) : [...now, group]));
  }

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

  const hasTableaus = result?.tableaus && result.tableaus.length > 0;

  return (
    <main>
      <header>
        <h1>Luzon Grid Dispatch and Price Simulator</h1>
        <p>The cheapest way to run the grid for one day, solved with the simplex method.</p>
      </header>

      {loadError && <p className="banner warning">{loadError}</p>}

      {options && (
        <div className="layout">
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
            {result && tab === "tableau" && hasTableaus && <TableauTab key={runId} steps={result.tableaus!} />}
          </section>
        </div>
      )}
    </main>
  );
}
