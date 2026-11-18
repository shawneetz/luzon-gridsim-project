// small input checks that run in the browser, so the player gets a message right
// under the field instead of after a round trip to the r api
// the rules mirror the project spec (a co2 cap of 0 or less, or blank, is invalid)
// the api (check.R) is still the final check, this file is only for fast feedback

/**
 * checks the co2 limit text and says what is wrong with it
 *
 * @param value - the raw text of the co2 limit box, e.g. "165000"
 * @returns an empty string when the value is fine, otherwise a short message
 * for the player
 *
 * @remarks
 * the page keeps the limit as text on purpose (see `SolveRequest` in `lib/types.ts`),
 * so blank and bad values can reach this check
 *
 * edge cases:
 * - blank or spaces only is its own message, because `Number("")` is 0 and would
 *   otherwise be reported as "greater than 0"
 * - text like "abc" or "1e999" gives `NaN` or `Infinity`, so it is reported as
 *   "not a number" (`Number.isFinite` rejects both)
 * - thousands commas ("165,000") count as not a number, type it without commas
 *
 * @example
 * ```ts
 * co2CapError("165000"); // ""
 * co2CapError("");       // "Enter a CO₂ limit"
 * co2CapError("0");      // "The limit must be greater than 0"
 * co2CapError("abc");    // "The limit must be a number"
 * ```
 */
export function co2CapError(value: string): string {
  const text = value.trim();
  if (text === "") return "Enter a CO₂ limit";

  const cap = Number(text);
  if (!Number.isFinite(cap)) return "The limit must be a number";
  if (cap <= 0) return "The limit must be greater than 0";

  return "";
}

// references:
// mdn, number.isfinite: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isFinite
// mdn, number constructor (string conversion): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/Number
// typescript, everyday types: https://www.typescriptlang.org/docs/handbook/2/everyday-types.html
// cmsc 150 final project spec, failure cases (invalid input)
// tsdoc standard: https://tsdoc.org