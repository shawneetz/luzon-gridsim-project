// turns one optimal solve into the numbers shown on the key insights card
// everything here is a pure function of the api response and the shared grid
// constants, so it needs no state and the api does not have to change
//
// what it works out:
//   - cheapest and most expensive block (from the prices)
//   - peak demand block (from the demand in lib/grid.ts)
//   - energy in MWh per plant group over the day (power x hours per block)
//   - total co2 in tonnes (energy x emission factor of each group)

import { demand, HOURS_PER_BLOCK } from "./grid";
import { styleOf } from "./plants";
import type { SolveResponse } from "./types";

/** one block that stands out, e.g. the cheapest one */
export interface BlockHighlight {
  /** block name as the api sent it, e.g. "B5" */
  block: string;
  /** position of the block, 0 is B1, used to pick the icon and the hours */
  index: number;
  /** the number that made it stand out: ₱ per MWh for prices, MW for demand */
  value: number;
}

/** what one plant group did over the whole day */
export interface PlantEnergy {
  /** plant group name, e.g. "Hydro" */
  group: string;
  /** energy made over the day in MWh */
  mwh: number;
}

/** everything the key insights card shows */
export interface Insights {
  cheapest: BlockHighlight;
  priciest: BlockHighlight;
  peak: BlockHighlight;
  /** one entry per plant group, same order as the dispatch table */
  energy: PlantEnergy[];
  /** sum of all `energy` entries in MWh */
  totalMwh: number;
  /** total co2 emitted over the day in tonnes */
  totalCo2: number;
  /** true when a group had no known emission factor, so `totalCo2` leaves it out */
  co2Partial: boolean;
}

/**
 * finds the position of the smallest or largest number in a list
 *
 * @param values - the numbers to search
 * @param pick - "min" for the smallest, "max" for the largest
 * @returns the index of the first match, ties go to the earlier block
 *
 * @remarks
 * a plain loop instead of `Math.min` plus `indexOf`, so there is one pass
 * and no floating point comparison against a second computed value
 *
 * @example
 * ```ts
 * indexOfExtreme([3, 1, 2], "min"); // 1
 * indexOfExtreme([3, 1, 3], "max"); // 0
 * ```
 */
function indexOfExtreme(values: readonly number[], pick: "min" | "max"): number {
  let best = 0;
  values.forEach((v, i) => {
    if (pick === "min" ? v < values[best] : v > values[best]) best = i;
  });
  return best;
}

/**
 * works out the key insights of an optimal solve
 *
 * @param dispatch - the dispatch part of the response (`values[g][t]` in MW)
 * @param prices - the prices part of the response (₱ per MWh per block)
 * @returns the insights, or `null` when there is nothing to summarize
 *
 * @remarks
 * energy of a group = sum of its MW over the blocks x `HOURS_PER_BLOCK`
 * co2 of a group = energy x its emission factor (t CO₂ per MWh)
 *
 * edge cases:
 * - an empty prices list or an empty dispatch returns `null`
 * - a group the style file does not know has `capMw` of 0, so its factor is
 *   unknown, it counts for energy but not for co2, and `co2Partial` turns true
 *   (hydro, solar and wind also have an emission of 0, but a known capacity,
 *   so they are counted as a real 0)
 * - `demand` has one entry per block, if the api ever sent more blocks than
 *   that, the peak is only searched in the blocks the demand list covers
 * - the unit of `value` depends on the highlight, see {@link BlockHighlight}
 *
 * @example
 * ```ts
 * const insights = buildInsights(result.dispatch, result.prices);
 * insights?.cheapest.block; // "B1"
 * ```
 */
export function buildInsights(
  dispatch: NonNullable<SolveResponse["dispatch"]>,
  prices: NonNullable<SolveResponse["prices"]>,
): Insights | null {
  if (prices.values.length === 0 || dispatch.groups.length === 0) return null;

  // name of block i, with a fallback so a short list never prints "undefined"
  const nameOf = (i: number) => prices.blocks[i] ?? `B${i + 1}`;

  const cheapestIndex = indexOfExtreme(prices.values, "min");
  const priciestIndex = indexOfExtreme(prices.values, "max");
  const peakIndex = indexOfExtreme(demand, "max");

  let totalCo2 = 0;
  let co2Partial = false;

  const energy: PlantEnergy[] = dispatch.groups.map((group, g) => {
    const mwh = dispatch.values[g].reduce((sum, mw) => sum + mw, 0) * HOURS_PER_BLOCK;
    const style = styleOf(group);
    if (style.capMw > 0) totalCo2 += mwh * style.emission;
    else co2Partial = true;
    return { group, mwh };
  });

  return {
    cheapest: { block: nameOf(cheapestIndex), index: cheapestIndex, value: prices.values[cheapestIndex] },
    priciest: { block: nameOf(priciestIndex), index: priciestIndex, value: prices.values[priciestIndex] },
    peak: { block: nameOf(peakIndex), index: peakIndex, value: demand[peakIndex] },
    energy,
    totalMwh: energy.reduce((sum, e) => sum + e.mwh, 0),
    totalCo2,
    co2Partial,
  };
}

// references:
// typescript, utility types (NonNullable): https://www.typescriptlang.org/docs/handbook/utility-types.html#nonnullabletype
// typescript, indexed access types (SolveResponse["dispatch"]): https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html
// mdn, array.prototype.map: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
// mdn, array.prototype.reduce: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce
// mdn, nullish coalescing (??): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing
// cmsc 150 final project spec, table 1 (emission factors) and constraint (6) (co2 = h x e x x)
// tsdoc standard: https://tsdoc.org