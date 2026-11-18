"use client";

// the main page of the app
// it first shows the landing page (title screen). after the player presses
// "Start Simulation" it shows the simulator: it loads the options from the
// r api, keeps every user choice in state, sends the choices to /solve,
// and shows either the results tab or the simplex tableau tab
//
// states of the right panel:
//   no result yet     a short "how to read" guide (see EmptyGuide.tsx)
//   solve failed      an error banner with a retry button (see ErrorBanner.tsx)
//   result            the results tab or the tableau tab
//
// page layout (edit the tailwind classes below):
//   <main>      full width, so the grass strip can reach both screen edges
//   <AppHeader> the grass title strip with the logo and the button group
//               (see AppHeader.tsx, it is capped at 1320px like the content below)
//   grid        controls on the left (320px), results on the right (rest of the width)
//               on small screens it becomes one column

import { useCallback, useEffect, useState } from "react";
import AppHeader from "@/components/AppHeader";
import ControlPanel from "@/components/ControlPanel";
import EmptyGuide from "@/components/EmptyGuide";
import ErrorBanner from "@/components/ErrorBanner";
import LandingPage from "@/components/LandingPage";
import ResultsTab from "@/components/ResultsTab";
import TableauTab from "@/components/TableauTab";
import { fetchOptions, solve } from "@/lib/api";
import type { Options, SolveResponse } from "@/lib/types";

/** the two tabs on the right side of the simulator */
type Tab = "results" | "tableau";

/**
 * root page of the app: landing screen first, then the simulator
 *
 * @remarks
 * this is a client component ("use client") because it owns all of the
 * interactive state (selection, co2 toggle, solver result) and calls the
 * r api from the browser through `lib/api.ts`
 *
 * edge cases:
 * - the simulator stays hidden until `/options` answers; if the r api is
 *   down, an error banner with a retry button is shown instead of the controls
 * - state is kept when the player goes back to the landing page, so the
 *   previous choices and results are still there on return
 * - `runId` changes on every solve, which remounts the tableau viewer so
 *   it always starts at iteration 0
 * - a solve that fails to reach the api gives a result with `status: "error"`,
 *   the page shows it with the error banner (retry runs the same solve again)
 *   and not through `ResultsTab`, so `ResultsTab` only sees the other statuses
 *
 * @example
 * ```tsx
 * // app router renders this file at "/" automatically, no props needed
 * export default function Home() { ... }
 * ```
 */
export default function Home() {
  // false = show the landing page, true = show the simulator
  const [started, setStarted] = useState(false);

  // options from the api (plant group names and default co2 cap)
  const [options, setOptions] = useState<Options | null>(null);
  const [loadError, setLoadError] = useState("");
  const [retryingOptions, setRetryingOptions] = useState(false); // true while the retry button waits for the api

  // user choices
  const [selected, setSelected] = useState<string[]>([]); // chosen plant groups
  const [co2On, setCo2On] = useState(false);              // is the co2 cap switched on
  const [co2Cap, setCo2Cap] = useState("");               // co2 limit, kept as text

  // solver output and screen state
  const [result, setResult] = useState<SolveResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("results");
  const [runId, setRunId] = useState(0); // changes on every solve so the tableau viewer resets

  /**
   * asks the api for the plant groups and the default co2 cap
   *
   * @returns a promise that never rejects, a failure is saved in `loadError` instead
   *
   * @remarks
   * it sets state only after the request answers, never before, so calling it
   * from an effect does not set state during the effect itself
   * on success it also starts with every group selected and fills the co2 limit
   */
  const loadOptions = useCallback(
    () =>
      fetchOptions()
        .then((data) => {
          setOptions(data);
          setLoadError("");
          setSelected(data.groups); // start with every group selected
          setCo2Cap(String(data.defaultCo2Cap));
        })
        // happens when the r script is not running
        .catch(() => setLoadError("Could not reach the solver API. Is the R API running on port 8000?")),
    [],
  );

  // on first load, get the options
  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  /**
   * tries to load the options again, used by the retry button of the load error banner
   *
   * @remarks
   * `retryingOptions` keeps the button disabled while the request runs
   * the banner stays visible until the request succeeds, so the page does not flicker
   */
  function retryOptions() {
    setRetryingOptions(true);
    loadOptions().finally(() => setRetryingOptions(false));
  }

  /**
   * adds the group to the selection, or removes it if it is already selected
   *
   * @param group - plant group name exactly as the api sent it, e.g. "Natural Gas"
   */
  function toggleGroup(group: string) {
    setSelected((now) => (now.includes(group) ? now.filter((g) => g !== group) : [...now, group]));
  }

  /**
   * sends the current choices to the r solver and shows the result
   *
   * @remarks
   * never throws: a network failure is turned into a result with
   * `status: "error"` so the ui shows a message instead of crashing
   * the loading flag is always reset in `finally`
   * the error banner's retry button calls this same function
   */
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
    <main className="pb-10">
      {/* header: logo, title and the button group, goes back to the landing page on "main menu" */}
      <AppHeader onMainMenu={() => setStarted(false)} />

      {/* content wrapper: same max width as the header, centered, with side padding */}
      <div className="mx-auto w-full max-w-[1320px] px-4">
        {/* the options request failed: banner with a retry button (the controls stay hidden) */}
        {loadError && <ErrorBanner message={loadError} onRetry={retryOptions} retrying={retryingOptions} />}

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

              {/* no result yet: show the guide */}
              {!result && <EmptyGuide />}

              {/* the solve request failed: show the banner with a retry button on the results tab
                  retry runs the same solve again, and the button says "retrying..." while it waits */}
              {result?.status === "error" && tab === "results" && (
                <ErrorBanner
                  message={result.message ?? "Could not reach the solver API."}
                  onRetry={handleSolve}
                  retrying={loading}
                />
              )}

              {/* every other result: the results tab or the tableau tab */}
              {result && result.status !== "error" && tab === "results" && <ResultsTab result={result} />}
              {result && tab === "tableau" && hasTableaus && <TableauTab key={runId} steps={result.tableaus!} />}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

// references:
// next.js app router, server and client components: https://nextjs.org/docs/app/getting-started/server-and-client-components
// react, useState: https://react.dev/reference/react/useState
// react, useEffect: https://react.dev/reference/react/useEffect
// react, useCallback: https://react.dev/reference/react/useCallback
// mdn, promise.prototype.finally: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/finally
// mdn, nullish coalescing (??): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing
// tailwind css v4, max-width: https://tailwindcss.com/docs/max-width
// tsdoc standard: https://tsdoc.org