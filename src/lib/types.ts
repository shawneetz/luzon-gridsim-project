export type Status = "optimal" | "infeasible" | "invalid" | "error";

export interface Options {
  groups: string[];
  defaultCo2Cap: number;
}

export interface SolveRequest {
  groups: string[];
  co2On: boolean;
  co2Cap: string;
}

export interface TableauStep {
  iteration: number;
  rowNames: string[];
  colNames: string[];
  values: number[][];
  basic: number[];
}

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
