// blocky stacked bars: one bar per block (b1 to b6), one colored segment per plant group
// the dashed red line is the demand, so you can see supply meeting demand
// drawn with plain svg, so no chart library is needed
// svg shapes are styled with tailwind too (stroke-*, fill-*, text-*)
//
// the size and the gaps of the svg come from lib/chartLayout.ts, the price row
// under the chart reads the same numbers, so each price sits under its bar

import { CHART_H as H, CHART_PAD as PAD, CHART_W as W } from "@/lib/chartLayout";
import { blockIcons, demand } from "@/lib/grid";
import { styleOf } from "@/lib/plants";

/** props for the {@link DispatchChart} component */
interface DispatchChartProps {
  /** plant group names, one per row of `values` (order decides the stacking order) */
  groups: string[];
  /** block names, e.g. ["B1", ..., "B6"], one per column of `values` */
  blocks: string[];
  /** `values[g][t]` = output in MW of group `g` in block `t` */
  values: number[][];
}

// spacing between the horizontal grid lines, in mw
const GRID_STEP = 5000;

/**
 * stacked bar chart of the dispatch per block, with the demand drawn on top as a dashed line
 *
 * @param props - see {@link DispatchChartProps}
 *
 * @remarks
 * pure svg with no state, so no "use client" is needed here; it is bundled
 * with the client page that renders it
 *
 * edge cases:
 * - `values` must have one row per group and one column per block, and
 *   `blocks.length` should match the length of `demand` in `lib/grid.ts`
 * - segments with 0 MW (or less) are skipped, so unused groups draw nothing
 * - the top of the chart is 8% above the highest total or demand, so the
 *   tallest bar never touches the edge
 * - the size and the padding are shared with the price row, if you change them in
 *   `lib/chartLayout.ts` both follow, do not hardcode them again here
 *
 * @example
 * ```tsx
 * <DispatchChart groups={dispatch.groups} blocks={dispatch.blocks} values={dispatch.values} />
 * ```
 */
export default function DispatchChart({ groups, blocks, values }: DispatchChartProps) {
  const n = blocks.length;

  // scale: the top of the chart is a little above the highest demand or supply
  const totals = blocks.map((_, t) => values.reduce((sum, row) => sum + row[t], 0));
  const maxY = Math.max(...totals, ...demand) * 1.08;

  // each block gets an equal slot; the bar fills most of it
  const slotWidth = (W - PAD.left - PAD.right) / n;
  const barWidth = slotWidth * 0.6;
  const centerX = (t: number) => PAD.left + slotWidth * t + slotWidth / 2;

  // turns a mw value into a y position in the svg
  const y = (mw: number) => H - PAD.bottom - (mw / maxY) * (H - PAD.top - PAD.bottom);

  // horizontal grid line values
  const ticks: number[] = [];
  for (let mw = 0; mw <= maxY; mw += GRID_STEP) ticks.push(mw);

  return (
    <div className="screen p-3">
      {/* crispEdges keeps the bars sharp and pixel-like */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full [shape-rendering:crispEdges]"
        role="img"
        aria-label="Stacked dispatch per block compared with demand"
      >
        {/* grid lines and mw labels */}
        {ticks.map((mw) => (
          <g key={mw}>
            <line className="stroke-screen-edge" x1={PAD.left} x2={W - PAD.right} y1={y(mw)} y2={y(mw)} />
            <text className="fill-chart-text font-body text-[15px]" x={PAD.left - 8} y={y(mw) + 5} textAnchor="end">
              {mw.toLocaleString("en-US")}
            </text>
          </g>
        ))}

        {/* one stacked bar per block */}
        {blocks.map((_, t) => {
          let stackedMw = 0; // how much is already stacked below the current segment
          return groups.map((group, g) => {
            const mw = values[g][t];
            const bottom = y(stackedMw);
            stackedMw += mw;
            const top = y(stackedMw);
            if (mw <= 0) return null; // nothing to draw for this segment
            return (
              <rect
                key={`${group}-${t}`}
                className="stroke-black stroke-2"
                x={centerX(t) - barWidth / 2}
                y={top}
                width={barWidth}
                height={bottom - top}
                fill={styleOf(group).color}
              />
            );
          });
        })}

        {/* demand line (redstone): dashed red */}
        <polyline
          className="fill-none stroke-redstone stroke-[3] [stroke-dasharray:8_5]"
          points={demand.map((d, t) => `${centerX(t)},${y(d)}`).join(" ")}
        />

        {/* time-of-day icon and block name under each bar */}
        {blocks.map((name, t) => (
          <g key={name}>
            <text x={centerX(t)} y={H - 22} textAnchor="middle" fontSize="16">
              {blockIcons[t]}
            </text>
            <text className="fill-chart-text font-body text-[15px]" x={centerX(t)} y={H - 6} textAnchor="middle">
              {name}
            </text>
          </g>
        ))}
      </svg>

      {/* legend: color key for the segments */}
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-chart-text">
        {groups.map((group) => (
          <span key={group}>
            <span className="mr-1.5 inline-block size-3 border-2 border-black" style={{ background: styleOf(group).color }} />
            {group}
          </span>
        ))}
        <span>
          <span className="mr-1.5 inline-block size-3 border-2 border-black bg-redstone" />
          Demand
        </span>
      </div>
    </div>
  );
}

// references:
// mdn, svg viewBox: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/viewBox
// mdn, svg shape-rendering (crispEdges): https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/shape-rendering
// mdn, svg polyline: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/polyline
// mdn, svg text-anchor: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/text-anchor
// mdn, array.prototype.reduce: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce
// react, rendering lists (keys): https://react.dev/learn/rendering-lists
// typescript, import and export renaming (as): https://www.typescriptlang.org/docs/handbook/modules/reference.html
// tailwind css v4, stroke width: https://tailwindcss.com/docs/stroke-width
// tsdoc standard: https://tsdoc.org