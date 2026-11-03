/*
 * api.ts
 * Helper functions that call the R API. Requests go to /next-app/api,
 * which next.config.ts forwards to the R server (port 8000 by default).
 */

import type { Options, SolveRequest, SolveResponse } from "./types";

const API = "/next-app/api";

// Get the plant group names and the default CO2 cap
export async function fetchOptions(): Promise<Options> {
  const res = await fetch(`${API}/options`);
  if (!res.ok) throw new Error("Could not reach the solver API.");
  return res.json();
}

// Send the user's choices and get back the solver result
export async function solve(request: SolveRequest): Promise<SolveResponse> {
  const res = await fetch(`${API}/solve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error("Could not reach the solver API.");
  return res.json();
}
