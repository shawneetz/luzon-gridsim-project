// the price of electricity in each block, one inventory slot per block
// each slot shows the time of day icon and block name on top, and the price on a
// dark plate below, colored from green (cheapest) to red (most expensive)
// hovering a slot shows how the price was computed (price = S / h)
// it holds no state, everything comes in through props
//
// layout (edit the tailwind classes below):
//   below xl: 3 columns (two rows of three), the slots are too narrow to line up with the bars
//   from xl up: one row that lines up with the chart above it
//     - the outer box copies the border and padding of the chart box (border-2 + p-3),
//       so its content is exactly as wide as the svg
//     - the inner grid copies the left and right gap of the svg as percentages
//       (see lib/chartLayout.ts), then cuts the rest into one equal column per block
//     - each column is as wide as a chart slot, so a slot is centered under its bar

import type { CSSProperties } from "react";
import { chartInsetPercent } from "@/lib/chartLayout";
import { formatNumber } from "@/lib/format";
import { blockIcons, HOURS_PER_BLOCK } from "@/lib/grid";

/**
 * turns a price into a color between green (cheapest) and red (most expensive)
 *
 * @param price - the price to color, in ₱ per MWh
 * @param min - the lowest price among all blocks
 * @param max - the highest price among all blocks
 * @returns an `hsl()` string, hue 120 (green) at `min` down to hue 0 (red) at `max`
 *
 * @remarks
 * when every block has the same price (`min === max`) the share is 0,
 * so everything is green instead of dividing by zero
 *
 * @example
 * ```ts
 * heatColor(3800, 3800, 14700);  // "hsl(120, 100%, 65%)"
 * heatColor(14700, 3800, 14700); // "hsl(0, 100%, 65%)"
 * ```
 */
function heatColor(price: number, min: number, max: number): string {
  const share = max === min ? 0 : (price - min) / (max - min); // 0 = cheapest, 1 = priciest
  const hue = 120 - share * 120;                                // 120 = green, 0 = red
  return `hsl(${hue}, 100%, 65%)`;
}

/**
 * the hover text of a price slot, a reminder of how the price was computed
 *
 * @param price - the price of the block in ₱ per MWh
 * @returns text like "Price = S ÷ h = 15,200 ÷ 4 h = ₱3,800 per MWh"
 *
 * @remarks
 * the shadow price `S` is the price times the hours of a block (`price = S / h`),
 * so it is rebuilt here instead of asking the api for it
 * `formatNumber` keeps up to 4 decimals, which also hides the tiny floating point
 * error of the multiplication
 *
 * @example
 * ```ts
 * priceTitle(3800); // "Price = S ÷ h = 15,200 ÷ 4 h = ₱3,800 per MWh"
 * ```
 */
function priceTitle(price: number): string {
  return `Price = S ÷ h = ${formatNumber(price * HOURS_PER_BLOCK)} ÷ ${HOURS_PER_BLOCK} h = ₱${formatNumber(price)} per MWh`;
}

// the gaps of the chart as percentages, worked out once when the file loads
const inset = chartInsetPercent();

// css variables for the inner grid, set inline because their values come from code
// tailwind reads them with the pl-(--name) syntax, so they can still be switched on only from xl
const gridVars = {
  "--price-left": inset.left,
  "--price-right": inset.right,
} as CSSProperties;

/** props for the {@link PriceRow} component */
interface PriceRowProps {
  /** block names, e.g. ["B1", ..., "B6"], one per price */
  blocks: string[];
  /** price of each block in ₱ per MWh, same order as `blocks` */
  values: number[];
}

/**
 * one price slot per block, colored by how expensive the block is, lined up under the chart bars
 *
 * @param props - see {@link PriceRowProps}
 *
 * @remarks
 * has no state and no hooks, so it needs no "use client" of its own
 * the min and max are worked out here from `values`, so the colors always
 * match the prices that are on screen
 *
 * edge cases:
 * - the custom properties are set in `style`, and typescript does not know them, so the
 *   object is cast to `CSSProperties`
 * - the columns use `repeat(blocks.length, minmax(0, 1fr))`, so they follow the number of
 *   blocks, and `minmax(0, 1fr)` lets a narrow column shrink instead of growing around a long price
 * - the alignment only holds while the outer box has the same border and padding as the chart
 *   box (`border-2` and `p-3`), if you change one, change `xl:px-[calc(0.75rem+2px)]` too
 * - `values` should have the same length as `blocks`, a missing price would crash `toLocaleString`
 * - `blockIcons` is indexed by the block position, so it must have one icon per block (see `lib/grid.ts`)
 * - an empty `values` list gives `Math.min()` of nothing, which is `Infinity`, but no slot
 *   is drawn then, so the color is never used
 * - a price like 14,700.00 needs about 85px at xl, the slot is about 105px wide at a 1280px
 *   window, so the padding is kept small (`xl:px-1`), at narrower widths the 3 column layout takes over
 * - `title` only shows on mouse hover, the price itself is always on screen, so nothing is lost on touch
 *
 * @example
 * ```tsx
 * <PriceRow blocks={prices.blocks} values={prices.values} />
 * ```
 */
export default function PriceRow({ blocks, values }: PriceRowProps) {
  // range of the prices, used to color the slots
  const minPrice = Math.min(...values);
  const maxPrice = Math.max(...values);

  return (
    // outer box: same inset as the chart box, so its content is as wide as the svg (xl only)
    <div className="xl:px-[calc(0.75rem+2px)]">
      {/* inner grid: copies the gaps of the svg, then one equal column per block (xl only) */}
      <div
        className="grid grid-cols-3 gap-1.5 xl:grid-cols-(--price-cols) xl:gap-0 xl:pl-(--price-left) xl:pr-(--price-right)"
        style={{ ...gridVars, "--price-cols": `repeat(${blocks.length}, minmax(0, 1fr))` } as CSSProperties}
      >
        {blocks.map((block, t) => (
          // .slot comes from the shared looks, cursor-default because a price slot is not clickable
          // xl:mx-1 makes the gap between slots (the grid gap is 0 there, so columns match the chart slots)
          <div
            key={block}
            title={priceTitle(values[t])}
            className="slot cursor-default p-2 text-center xl:mx-1 xl:px-1"
          >
            <div className="font-pixel text-pixel-label text-ink">
              {blockIcons[t]} {block}
            </div>
            {/* the price sits on a dark plate, colored green (cheap) to red (expensive) */}
            <div className="mt-1.5 bg-screen px-1 py-0.5 text-price" style={{ color: heatColor(values[t], minPrice, maxPrice) }}>
              {values[t].toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// references:
// react, rendering lists (keys): https://react.dev/learn/rendering-lists
// react, CSSProperties type: https://react.dev/reference/react-dom/components/common#applying-css-styles
// typescript, type assertions (as): https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions
// mdn, css custom properties (var()): https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
// mdn, grid-template-columns (repeat and minmax): https://developer.mozilla.org/en-US/docs/Web/CSS/grid-template-columns
// mdn, padding (percentage values): https://developer.mozilla.org/en-US/docs/Web/CSS/padding#percentage
// mdn, title attribute: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/title
// mdn, hsl() color: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/hsl
// mdn, math.min: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/min
// tailwind css v4, using css variables in utilities (the (--name) syntax): https://tailwindcss.com/docs/adding-custom-styles#using-arbitrary-values
// tailwind css v4, grid template columns: https://tailwindcss.com/docs/grid-template-columns
// tailwind css v4, responsive design (xl: breakpoint): https://tailwindcss.com/docs/responsive-design
// cmsc 150 final project spec, shadow prices and the price of electricity (price = S / h)
// tsdoc standard: https://tsdoc.org