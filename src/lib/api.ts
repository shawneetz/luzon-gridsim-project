import type { Options, SolveRequest, SolveResponse } from "./types";

const API = "/next-app/api";

export async function fetchOptions(): Promise<Options> {
  const res = await fetch(`${API}/options`);
  if (!res.ok) throw new Error("Could not reach the solver API.");
  return res.json();
}

export async function solve(request: SolveRequest): Promise<SolveResponse> {
  const res = await fetch(`${API}/solve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error("Could not reach the solver API.");
  return res.json();
}
