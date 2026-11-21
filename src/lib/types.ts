/*
 * types.ts
 * TypeScript types that describe the data going to and coming from the
 * R API, so the whole frontend uses the same shapes
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

/**
 * one saved simplex iteration (iteration 0 is the initial tableau)
 *
 * @remarks
 * `pivotRow` and `pivotCol` are the pivot chosen FROM this tableau, the one
 * that turns it into the next iteration, so the final tableau has neither
 * both are 0-based and index into `rowNames` and `colNames`, the r api
 * converts from r's 1-based indexes before sending
 * they are optional because the api leaves them out when there is no pivot
 */
export interface TableauStep {
  iteration: number;
  rowNames: string[];
  colNames: string[];
  values: number[][];
  basic: number[]; // basic solution of this iteration
  /** 0-based row of the pivot element, left out on the final iteration */
  pivotRow?: number;
  /** 0-based column of the pivot element, left out on the final iteration */
  pivotCol?: number;
}

// Data returned by POST /solve. Many fields are optional because
// they only exist for some statuses (e.g. cost only when optimal)
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

// references:
// typescript, optional properties: https://www.typescriptlang.org/docs/handbook/2/objects.html#optional-properties
// tsdoc standard: https://tsdoc.org