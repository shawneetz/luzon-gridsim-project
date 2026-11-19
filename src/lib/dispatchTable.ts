// small pure helpers for the dispatch table: column totals and the full capacity flags
// they only read the api response and the plant facts, so they need no state
//
// what it works out:
//   - total supply per block (sum of every plant group in that block)
//   - which cells are a plant group running at its full capacity

import { styleOf } from "./plants";

// how close to the capacity a value must be to count as full, in MW
// the solver answers in floating point, so 3299.9999999 must still count as 3300
const FULL_CAPACITY_TOLERANCE_MW = 0.01;

/**
 * adds up every plant group for each block
 *
 * @param values - `values[g][t]` is the output in MW of group `g` in block `t`
 * @returns one total per block, in MW, the same length as a row of `values`
 *
 * @remarks
 * an empty `values` returns an empty list, so no total row is drawn for nothing
 * the number of blocks is read from the first row, all rows must have the same length
 *
 * @example
 * ```ts
 * blockTotals([[1, 2], [3, 4]]); // [4, 6]
 * ```
 */
export function blockTotals(values: readonly (readonly number[])[]): number[] {
  const blockCount = values[0]?.length ?? 0;
  return Array.from({ length: blockCount }, (_, t) => values.reduce((sum, row) => sum + row[t], 0));
}

/**
 * marks every cell where a plant group runs at its full capacity
 *
 * @param groups - plant group names, one per row of `values`
 * @param values - `values[g][t]` is the output in MW of group `g` in block `t`
 * @returns a grid of booleans with the same shape as `values`, true = at full capacity
 *
 * @remarks
 * edge cases:
 * - a group the style file does not know has `capMw` of 0, so it is never marked,
 *   otherwise every cell of an unknown group would light up
 * - the check is `>=` with a small tolerance, so a value a hair under the capacity
 *   still counts and a value over it (which the solver should not return) is also marked
 * - the capacity is the nameplate capacity from the style file, it is a display hint
 *   only, the solver uses its own limits (solar and wind can be capped lower by the sun
 *   or the wind, so they only light up when they reach the full nameplate)
 *
 * @example
 * ```ts
 * fullCapacityFlags(["Wind"], [[400, 120]]); // [[true, false]]
 * ```
 */
export function fullCapacityFlags(
  groups: readonly string[],
  values: readonly (readonly number[])[],
): boolean[][] {
  return values.map((row, g) => {
    const cap = styleOf(groups[g]).capMw;
    return row.map((mw) => cap > 0 && mw >= cap - FULL_CAPACITY_TOLERANCE_MW);
  });
}

// references:
// mdn, array.from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from
// mdn, array.prototype.reduce: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce
// mdn, optional chaining (?.): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining
// typescript, readonly arrays: https://www.typescriptlang.org/docs/handbook/2/objects.html#readonly-properties
// cmsc 150 final project spec, table 1 (plant capacities) and table 2 (demand)
// tsdoc standard: https://tsdoc.org