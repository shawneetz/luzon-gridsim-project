// the price of electricity in each block, one inventory slot per block
// each slot shows the time of day icon and block name on top, and the price on a
// dark plate below, colored from green (cheapest) to red (most expensive)
// it holds no state, everything comes in through props
//
// layout (edit the tailwind classes below):
//   3 columns (two rows of three blocks), change grid-cols-3 for another shape
//   task 4.4 will move this under the chart and line each slot up with its bar

import { blockIcons } from "@/lib/grid";

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

/** props for the {@link PriceRow} component */
interface PriceRowProps {
  /** block names, e.g. ["B1", ..., "B6"], one per price */
  blocks: string[];
  /** price of each block in ₱ per MWh, same order as `blocks` */
  values: number[];
}

/**
 * one price slot per block, colored by how expensive the block is
 *
 * @param props - see {@link PriceRowProps}
 *
 * @remarks
 * has no state and no hooks, so it needs no "use client" of its own
 * the min and max are worked out here from `values`, so the colors always
 * match the prices that are on screen
 *
 * edge cases:
 * - `values` should have the same length as `blocks`, a missing price would crash `toLocaleString`
 * - `blockIcons` is indexed by the block position, so it must have one icon per block (see `lib/grid.ts`)
 * - an empty `values` list gives `Math.min()` of nothing, which is `Infinity`, but no slot
 *   is drawn then, so the color is never used
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
    <div className="grid grid-cols-3 gap-1.5">
      {blocks.map((block, t) => (
        // .slot comes from globals.css, cursor-default because a price slot is not clickable
        <div key={block} className="slot cursor-default p-2 text-center">
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
  );
}

// references:
// react, rendering lists (keys): https://react.dev/learn/rendering-lists
// mdn, hsl() color: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/hsl
// mdn, math.min: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/min
// mdn, number.toLocaleString: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString
// tailwind css v4, grid template columns: https://tailwindcss.com/docs/grid-template-columns
// cmsc 150 final project spec, shadow prices and the price of electricity (price = S / h)
// tsdoc standard: https://tsdoc.org