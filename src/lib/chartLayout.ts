// layout numbers shared by the dispatch chart and the price row
// the chart is an svg that scales with its container, so every x position in it is a
// fixed share of the svg width, the price row uses the same shares, so each price
// slot lands under its bar at any screen width
//
// how the shares work:
//   the svg is CHART_W units wide, the bars live between PAD.left and CHART_W - PAD.right
//   that area is cut into one equal slot per block, and a bar is centered in its slot
//   the price row copies the left and right gap as percentages and cuts the same area
//   into the same equal slots
//
// only the horizontal numbers matter to the price row, so the height and the top and
// bottom padding can change without breaking the alignment

/** width of the chart svg in its own units (the viewBox width) */
export const CHART_W = 760;

/** height of the chart svg in its own units (the viewBox height) */
export const CHART_H = 360;

/**
 * empty space around the bars, in svg units
 *
 * @remarks
 * `left` is the room for the y axis title and the mw labels
 * `bottom` is the room for the three lines under each bar: icon, block name and hours
 */
export const CHART_PAD = { left: 64, right: 16, top: 16, bottom: 64 } as const;

/**
 * the left and right gap of the chart as a share of its width
 *
 * @returns css percentage strings, e.g. `{ left: "8.4211%", right: "2.1053%" }`
 *
 * @remarks
 * a css percentage padding is measured against the width of the parent, so putting
 * these on a box that is as wide as the svg gives the same gaps as inside the svg
 * four decimals are more than a pixel of precision on any screen
 *
 * @example
 * ```ts
 * chartInsetPercent().left; // "8.4211%"
 * ```
 */
export function chartInsetPercent(): { left: string; right: string } {
  return {
    left: `${((CHART_PAD.left / CHART_W) * 100).toFixed(4)}%`,
    right: `${((CHART_PAD.right / CHART_W) * 100).toFixed(4)}%`,
  };
}

// references:
// mdn, svg viewBox: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/viewBox
// mdn, padding (percentage values): https://developer.mozilla.org/en-US/docs/Web/CSS/padding#percentage
// mdn, number.toFixed: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toFixed
// typescript, const assertions (as const): https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-inference
// tsdoc standard: https://tsdoc.org