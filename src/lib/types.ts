/*
 * types.ts
 * TypeScript types that describe the data going to and coming from the
 * R API, so the whole frontend uses the same shapes.
 */

// Possible outcomes of a solve
export type Status = "optimal" | "infeasible" | "invalid" | "error";

// Data from GET /options
export interface Options {
  groups: string[];
  defaultCo2Cap: number;
}

// Data sent to POST /solve
export interface SolveRequest {
  groups: string[];
  co2On: boolean;
  co2Cap: string; // text, so the API can reject blank or invalid values
}

// One saved simplex iteration (iteration 0 is the initial tableau)
export interface TableauStep {
  iteration: number;
  rowNames: string[];
  colNames: string[];
  values: number[][];
  basic: number[]; // basic solution of this iteration
}

// Data returned by POST /solve. Many fields are optional because
// they only exist for some statuses (e.g. cost only when optimal).
export interface SolveResponse {
  status: Status;
  message?: string;
  iterations?: number;
  setup?: { unknowns: number; constraints: number };
  tableaus?: TableauStep[];
  cost?: number;
  dispatch?: { groups: string[]; blocks: string[]; values: number[][] };
  prices?: { blocks: string[]; values: number[] };
}
