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
//               (see AppHeader.tsx, it uses the same max widths as the content below)
//   grid        controls on the left (320px), results in the middle (rest of the width)
//               on small screens it becomes one column
//   right rail  from 2xl up, after an optimal solve, the key insights get their own
//               column on the far right (380px), so the screen is filled evenly
//               (left controls, middle results, right insights)
//
// width notes:
//   the content is capped at 1320px, and at 2xl (1536px) it grows to 1800px, because the
//   third column needs room, if you change one of the two numbers, change AppHeader.tsx too
//
// responsive notes (task 6.1):
//   - the right panel has min-w-0, so a wide table or chart scrolls inside its own
//     box instead of pushing the whole page wider than the screen
//   - the tab label "Simplex Tableau" is too long for two buttons on a 390px phone,
//     so below sm it reads "Tableau" (two spans, one is always display: none)
//
// accessibility notes (task 6.2):
//   - the two tab buttons follow the aria tabs pattern: a tablist, tabs with aria-selected
//     and aria-controls, and one tabpanel per tab, see the remarks on Home
//   - both panels stay in the dom, the inactive one is hidden, so aria-controls always
//     points at a real element
//
// sound notes (task 6.3):
//   - sound is off by default, the header toggle switches it, see lib/sound.ts
//   - one click listener on the document plays the button click for the whole app
//   - the level-up and hurt sounds play when a solve ends

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import AppHeader from "@/components/AppHeader";
import ControlPanel from "@/components/ControlPanel";
import EmptyGuide from "@/components/EmptyGuide";
import ErrorBanner from "@/components/ErrorBanner";
import KeyInsights from "@/components/KeyInsights";
import LandingPage from "@/components/LandingPage";
import ResultsTab from "@/components/ResultsTab";
import TableauTab from "@/components/TableauTab";
import { fetchOptions, solve } from "@/lib/api";
import { playClick, playHurt, playLevelUp, setSoundEnabled } from "@/lib/sound";
import type { Options, SolveResponse } from "@/lib/types";

/** the two tabs on the right side of the simulator */
type Tab = "results" | "tableau";
const panelLook = "focus-visible:outline-black focus-visible:-outline-offset-2";

// grid columns, written in full so tailwind can find them at build time
// without a result the grid has two columns, with an optimal result it gets a third one at 2xl
const gridTwoColumns = "md:grid-cols-[320px_minmax(0,1fr)]";
const gridThreeColumns = "md:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[320px_minmax(0,1fr)_380px]";

// right rail (the key insights column), same sticky idea as the control panel
// - it is hidden below 2xl, where the insights stay inside the results tab instead
// - the app header only sticks on windows at least 768px wide and 800px tall, so on those
//   windows the rail needs a bigger top offset to stay under it (same numbers as ControlPanel.tsx)
// - max-h plus overflow-y-auto keeps the whole card reachable when it is taller than the window
//   (underscores become spaces in tailwind arbitrary values)
const tallDesktop = "[@media(min-width:768px)_and_(min-height:800px)]";
const railLook = [
  "panel hidden min-w-0 p-4 2xl:block",
  "2xl:sticky 2xl:top-4 2xl:max-h-[calc(100vh-2rem)] 2xl:overflow-y-auto",
  `${tallDesktop}:top-36 ${tallDesktop}:max-h-[calc(100vh-10rem)]`,
].join(" ");

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
 * - the two tab label spans are both in the dom, but only one is displayed at a
 *   time, so screen readers read just one of them
 *
 * right rail (key insights column):
 * - it exists only for an optimal result, because the api sends no dispatch or prices
 *   for the other statuses, so `showRail` checks both are there
 * - it stays visible on both tabs, so the columns do not jump when the player
 *   switches between results and tableau
 * - the grid gets its third column only when the rail exists, otherwise an empty 380px
 *   track would be left on the right of the guide or the error banner
 * - `ResultsTab` hides its own insights card at 2xl, and the rail is hidden below 2xl,
 *   so the card is only visible once at any width, the hidden one is `display: none`
 *   and is skipped by screen readers
 * - the middle column shrinks by 380px when the first optimal result arrives at 2xl,
 *   so the page shifts once on the first solve, this is expected
 *
 * tabs (task 6.2):
 * - roles: `tablist` > `tab` buttons, and one `tabpanel` per tab linked with
 *   `aria-controls` (tab to panel) and `aria-labelledby` (panel to tab)
 * - roving tabindex: only the selected tab is in the tab order (`tabIndex` 0), the other
 *   is -1, and the arrow keys move between tabs, so the whole tablist is one tab stop
 * - keys: left and right arrows wrap around, home and end jump to the first and last tab
 * - both panels are always rendered and the inactive one has the `hidden` attribute
 *
 * sound (task 6.3):
 * - `soundOn` is the state the header toggle shows, the real switch lives in `lib/sound.ts`,
 *   `toggleSound` updates both in the same click
 * - the click sound comes from one listener on the document, so every button in the app
 *   gets it without any change in its own file
 * - the listener is added once and always on, because the play functions check the switch
 * - the confirmation click plays when sound is turned on
 * - turning sound off sets the real switch off before the document listener runs, so it stays silent
 * - the level-up and hurt sounds play right after the result is saved
 * - an `"error"` or `"invalid"` result plays no result sound
 * - the preference is kept in memory only, so it is off again after a page reload
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
  const [soundOn, setSoundOn] = useState(false);          // are sound effects switched on (off by default)

  // solver output and screen state
  const [result, setResult] = useState<SolveResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("results");
  const [runId, setRunId] = useState(0); // changes on every solve so the tableau viewer resets
  const baseId = useId();
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ results: null, tableau: null });
  const tabId = (tabName: Tab) => `${baseId}-tab-${tabName}`;
  const panelId = (tabName: Tab) => `${baseId}-panel-${tabName}`;

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

  // button click sound for the whole app (task 6.3)
  // one listener on the document catches every click that bubbles up from a button
  // playClick does nothing while sound is off, so the listener can stay attached
  useEffect(() => {
    function onDocumentClick(e: MouseEvent) {
      const button = (e.target as Element | null)?.closest("button");
      // a disabled button never fires click, the check is a safety net for disabled ancestors
      if (button && !button.disabled) playClick();
    }
    document.addEventListener("click", onDocumentClick);
    return () => document.removeEventListener("click", onDocumentClick);
  }, []);

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
   * switches sound effects on or off, used by the header toggle
   *
   * @remarks
   * it flips the real switch in `lib/sound.ts` first, in the same click, so the browser
   * lets the audio context start, then it updates the state the header shows
   */
  function toggleSound() {
    const next = !soundOn;
    setSoundEnabled(next);
    setSoundOn(next);
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
      const response = await solve({ groups: selected, co2On, co2Cap });
      setResult(response);
      setRunId((id) => id + 1);
      setTab("results");
      if (response.status === "optimal") playLevelUp();
      else if (response.status === "infeasible") playHurt();
    } catch {
      setResult({ status: "error", message: "Could not reach the solver API. Is the R API running?" });
    } finally {
      setLoading(false);
    }
  }

  // the tableau tab only works when the solver returned tableaus
  const hasTableaus = result?.tableaus && result.tableaus.length > 0;

  // the right rail only exists for an optimal result, the api sends no dispatch or prices otherwise
  const showRail = result?.status === "optimal" && !!result.dispatch && !!result.prices;

  function selectTab(next: Tab) {
    setTab(next);
    tabRefs.current[next]?.focus();
  }

  function handleTabKeys(event: KeyboardEvent<HTMLDivElement>) {
    const enabled: Tab[] = hasTableaus ? ["results", "tableau"] : ["results"];
    const current = enabled.indexOf(tab);
    let next: number;
    if (event.key === "ArrowRight") next = (current + 1) % enabled.length;
    else if (event.key === "ArrowLeft") next = (current - 1 + enabled.length) % enabled.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = enabled.length - 1;
    else return;
    event.preventDefault();
    selectTab(enabled[next]);
  }

  function handleRespawn() {
    if (options) setSelected(options.groups);
    if (options) setCo2Cap(String(options.defaultCo2Cap));
    setCo2On(false);
    setResult(null);
    setTab("results");
  }

  // title screen first; the choices and results above are kept when going back and forth
  if (!started) return <LandingPage onStart={() => setStarted(true)} />;

  return (
    <main className="pb-10">
      {/* header: logo, title and the button group, goes back to the landing page on "main menu" */}
      <AppHeader onMainMenu={() => setStarted(false)} soundOn={soundOn} onToggleSound={toggleSound} />

      {/* content wrapper: same max widths as the header, centered, with side padding */}
      <div className="mx-auto w-full max-w-[1320px] px-4 2xl:max-w-[1800px]">
        {/* the options request failed: banner with a retry button (the controls stay hidden) */}
        {loadError && <ErrorBanner message={loadError} onRetry={retryOptions} retrying={retryingOptions} />}

        {/* the app only shows after the options are loaded */}
        {options && (
          // one column on small screens, two columns (320px | rest) from md up,
          // and a third column (380px) from 2xl up when the key insights rail exists
          <div className={`grid grid-cols-1 items-start gap-4 ${showRail ? gridThreeColumns : gridTwoColumns}`}>
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

            {/* middle: tabs and their content
                min-w-0 lets this panel shrink inside the grid, so wide content scrolls inside itself */}
            <section className="panel w-full min-w-0 p-4">
              {/* tab buttons share the row equally; the active one turns green */}
              <div role="tablist" aria-label="Simulation output" className="mb-4 flex gap-1.5" onKeyDown={handleTabKeys}>
                <button
                  type="button"
                  role="tab"
                  id={tabId("results")}
                  ref={(element) => { tabRefs.current.results = element; }}
                  aria-selected={tab === "results"}
                  aria-controls={panelId("results")}
                  tabIndex={tab === "results" ? 0 : -1}
                  className={`btn flex-1 ${tab === "results" ? "btn-grass" : ""}`}
                  onClick={() => setTab("results")}
                >
                  Results
                </button>
                <button
                  type="button"
                  role="tab"
                  id={tabId("tableau")}
                  ref={(element) => { tabRefs.current.tableau = element; }}
                  aria-selected={tab === "tableau"}
                  aria-controls={panelId("tableau")}
                  tabIndex={tab === "tableau" ? 0 : -1}
                  className={`btn flex-1 ${tab === "tableau" ? "btn-grass" : ""}`}
                  onClick={() => setTab("tableau")}
                  disabled={!hasTableaus}
                >
                  {/* short label on phones, full label from sm up */}
                  <span className="sm:hidden">Tableau</span>
                  <span className="hidden sm:inline">Simplex Tableau</span>
                </button>
              </div>
              <div role="tabpanel" id={panelId("results")} aria-labelledby={tabId("results")} hidden={tab !== "results"} tabIndex={0} className={panelLook}>
                {!result && <EmptyGuide />}
                {result?.status === "error" && (
                  <ErrorBanner message={result.message ?? "Could not reach the solver API."} onRetry={handleSolve} retrying={loading} />
                )}
                {result && result.status !== "error" && <ResultsTab result={result} onRespawn={handleRespawn} />}
              </div>
              <div role="tabpanel" id={panelId("tableau")} aria-labelledby={tabId("tableau")} hidden={tab !== "tableau"} tabIndex={0} className={panelLook}>
                {hasTableaus && result?.tableaus && <TableauTab key={runId} steps={result.tableaus} />}
              </div>
            </section>

            {/* right rail: key insights on the far right, only from 2xl up (see railLook) */}
            {showRail && result?.dispatch && result.prices && (
              <aside aria-label="Key insights" className={railLook}>
                <h2 className="heading">Key insights</h2>
                <KeyInsights dispatch={result.dispatch} prices={result.prices} />
              </aside>
            )}
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
// react, conditional rendering: https://react.dev/learn/conditional-rendering
// mdn, promise.prototype.finally: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/finally
// mdn, nullish coalescing (??): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing
// mdn, css grid min-width auto problem (why min-w-0 is needed): https://developer.mozilla.org/en-US/docs/Web/CSS/min-width
// mdn, aside element: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/aside
// tailwind css v4, max-width: https://tailwindcss.com/docs/max-width
// tailwind css v4, min-width: https://tailwindcss.com/docs/min-width
// tailwind css v4, grid template columns: https://tailwindcss.com/docs/grid-template-columns
// tailwind css v4, position (sticky): https://tailwindcss.com/docs/position
// tailwind css v4, display (hidden, sm:inline): https://tailwindcss.com/docs/display
// tailwind css v4, responsive design (breakpoints and arbitrary variants): https://tailwindcss.com/docs/responsive-design
// tsdoc standard: https://tsdoc.org