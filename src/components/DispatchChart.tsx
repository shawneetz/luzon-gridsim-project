"use client";

// blocky stacked bars: one bar per block (b1 to b6), one colored segment per plant group
// the dashed red line is the demand, so you can see supply meeting demand
// drawn with plain svg, so no chart library is needed
// svg shapes are styled with tailwind too (stroke-*, fill-*, text-*)
//
// what you can do with it:
//   - hover a bar segment to see a tooltip: group, block, mw and share of demand
//   - click a legend item to hide or show that group (the demand line always stays)
//   - read the axes: "MW" title on the y axis, icon, block name and hours under each bar
//
// the size and the gaps of the svg come from lib/chartLayout.ts, the price row
// under the chart reads the same numbers, so each price sits under its bar
//
// layout (edit the tailwind classes below):
//   the svg and the tooltip share one relative wrapper, the tooltip is positioned with
//   percentages of that wrapper, so it follows the segment when the svg scales
//   tooltip width: w-44 (176px), it sits beside the bar, on the right for the left half
//   of the blocks and on the left for the right half, so it does not cover the bar
//
// responsive (task 6.1):
//   below md the wrapper is at least 600px wide inside a sideways scrolling box, so the
//   axis text stays readable on a phone instead of shrinking to about 6px
//   from md up the chart fills its box again, like before

import { useState } from "react";
import { CHART_H as H, CHART_PAD as PAD, CHART_W as W } from "@/lib/chartLayout";
import { formatNumber } from "@/lib/format";
import { blockHours, blockIcons, demand } from "@/lib/grid";
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

/** one colored piece of a bar, with everything needed to draw it and describe it */
interface Segment {
  /** plant group name */
  group: string;
  /** block position, 0 is B1 */
  t: number;
  /** output of the group in this block, in MW */
  mw: number;
  /** y position of the top edge in svg units */
  top: number;
  /** y position of the bottom edge in svg units */
  bottom: number;
}

/** which segment the mouse is on, a group name and a block position */
interface Hovered {
  group: string;
  t: number;
}

// spacing between the horizontal grid lines, in mw
const GRID_STEP = 5000;

// gap between a bar edge and its tooltip, in svg units
const TOOLTIP_GAP = 8;

// half of the tooltip height, used to keep it inside the chart (3.5rem is about 56px)
const TOOLTIP_HALF = "3.5rem";

// look of the tooltip: same purple frame as the plant slot tooltips
// pointer-events-none so it never steals the hover from the segment under it
const tooltipBox =
  "pointer-events-none absolute z-10 w-44 border-2 border-tooltip-border bg-tooltip-bg px-3 py-2 text-left text-small leading-tight text-white outline-2 outline-black";

// look of a legend button: reset the button look, hidden groups are dimmed and crossed out
// max-md:min-h-11 makes each item a 44px touch target on phones and tablets in portrait,
// from md up it is the normal text height so the legend stays compact
const legendItem =
  "inline-flex cursor-pointer items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-white max-md:min-h-11";

// the sideways scroll box around the chart
// focus-visible outline shows when the keyboard focuses it, so keyboard users can scroll it with the arrows
const scrollBox = "overflow-x-auto focus-visible:outline-2 focus-visible:outline-white";

// the chart wrapper: relative for the tooltip, and a minimum width on small screens so the
// svg text stays readable (the scroll box above lets the rest scroll sideways)
const chartWrap = "relative min-w-[600px] md:min-w-0";

/**
 * stacked bar chart of the dispatch per block, with the demand drawn on top as a dashed line
 *
 * @param props - see {@link DispatchChartProps}
 *
 * @remarks
 * this is a client component because it keeps state: the hovered segment and the hidden groups
 *
 * scale:
 * - the top of the chart is 8% above the highest total or demand, worked out from
 *   every group, hidden or not, so hiding a group does not make the chart jump
 *
 * edge cases:
 * - `values` must have one row per group and one column per block, and
 *   `blocks.length` should match the length of `demand` in `lib/grid.ts`
 * - segments with 0 MW (or less) are skipped, so unused groups draw nothing and have no tooltip
 * - a hidden group is skipped before stacking, so the groups above it slide down to close the gap
 * - if the hovered group gets hidden, its segment is gone, so no tooltip is drawn
 * - the share of demand is mw divided by the demand of that block, it can be over 100% for a
 *   group only if supply is over demand, which the solver allows for a block
 * - a block without a name in `blockHours` (more blocks than hours) shows no hours line
 * - the segments react to the mouse and to touch (a tap counts as hover), they are not
 *   keyboard focusable, the text alternative for the chart comes in the accessibility task
 * - the size and the padding are shared with the price row, if you change them in
 *   `lib/chartLayout.ts` both follow, do not hardcode them again here
 *
 * responsive edge cases (task 6.1):
 * - the tooltip is positioned in percentages of the `chartWrap` box, which is as wide as
 *   the svg, so it still lines up with the segment when the svg is wider than the screen
 * - `overflow-x-auto` also clips the y direction, but the tooltip is clamped inside the
 *   chart height, so it is never cut
 * - the scroll box has `tabIndex={0}` and a label, because a scrollable area that cannot
 *   take focus is not reachable with the keyboard
 * - the price row under the chart does not scroll with it, below xl it is its own grid
 *   (see PriceRow.tsx), so the two only line up from xl up, which is the same as before
 *
 * @example
 * ```tsx
 * <DispatchChart groups={dispatch.groups} blocks={dispatch.blocks} values={dispatch.values} />
 * ```
 */
export default function DispatchChart({ groups, blocks, values }: DispatchChartProps) {
  const [hovered, setHovered] = useState<Hovered | null>(null);
  const [hidden, setHidden] = useState<string[]>([]); // names of the groups that are switched off

  const n = blocks.length;

  // scale: the top of the chart is a little above the highest demand or supply (all groups)
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

  // every visible segment, stacked per block (hidden and zero groups are left out)
  const segments: Segment[] = [];
  blocks.forEach((_, t) => {
    let stackedMw = 0; // how much is already stacked below the current segment
    groups.forEach((group, g) => {
      const mw = values[g][t];
      if (hidden.includes(group) || mw <= 0) return;
      const bottom = y(stackedMw);
      stackedMw += mw;
      segments.push({ group, t, mw, top: y(stackedMw), bottom });
    });
  });

  // the segment under the mouse, if it is still drawn
  const active = hovered ? segments.find((s) => s.group === hovered.group && s.t === hovered.t) : undefined;

  /** adds the group to the hidden list, or removes it if it is already hidden */
  function toggleGroup(group: string) {
    setHidden((now) => (now.includes(group) ? now.filter((name) => name !== group) : [...now, group]));
  }

  // tooltip position: beside the bar, on the right for the left half of the blocks
  const tooltipOnRight = active !== undefined && active.t < n / 2;
  const tooltipLeft = active
    ? ((centerX(active.t) + (tooltipOnRight ? 1 : -1) * (barWidth / 2 + TOOLTIP_GAP)) / W) * 100
    : 0;
  const tooltipMiddleY = active ? ((active.top + active.bottom) / 2 / H) * 100 : 0;

  return (
    <div className="screen p-3">
      {/* scroll box: on phones the chart is wider than the screen and scrolls sideways */}
      <div className={scrollBox} tabIndex={0} role="region" aria-label="Dispatch chart, scrolls sideways on small screens">
        {/* relative wrapper: the tooltip is positioned against the svg, not the whole box */}
        <div className={chartWrap}>
          {/* crispEdges keeps the bars sharp and pixel-like */}
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="block h-auto w-full [shape-rendering:crispEdges]"
            role="img"
            aria-label="Stacked dispatch per block compared with demand"
          >
            {/* y axis title, turned so it reads bottom to top */}
            <text
              className="fill-chart-text font-body text-[15px]"
              transform={`translate(10 ${(PAD.top + H - PAD.bottom) / 2}) rotate(-90)`}
              textAnchor="middle"
            >
              MW
            </text>

            {/* grid lines and mw labels */}
            {ticks.map((mw) => (
              <g key={mw}>
                <line className="stroke-screen-edge" x1={PAD.left} x2={W - PAD.right} y1={y(mw)} y2={y(mw)} />
                <text className="fill-chart-text font-body text-[15px]" x={PAD.left - 8} y={y(mw) + 5} textAnchor="end">
                  {mw.toLocaleString("en-US")}
                </text>
              </g>
            ))}

            {/* one rect per visible segment, the hovered one gets a white frame */}
            {segments.map((seg) => {
              const isActive = active === seg;
              return (
                <rect
                  key={`${seg.group}-${seg.t}`}
                  className={`cursor-pointer stroke-2 ${isActive ? "stroke-white" : "stroke-black"}`}
                  x={centerX(seg.t) - barWidth / 2}
                  y={seg.top}
                  width={barWidth}
                  height={seg.bottom - seg.top}
                  fill={styleOf(seg.group).color}
                  onMouseEnter={() => setHovered({ group: seg.group, t: seg.t })}
                  onMouseLeave={() => setHovered(null)}
                />
              );
            })}

            {/* demand line (redstone): dashed red, it never hides */}
            <polyline
              className="pointer-events-none fill-none stroke-redstone stroke-[3] [stroke-dasharray:8_5]"
              points={demand.map((d, t) => `${centerX(t)},${y(d)}`).join(" ")}
            />

            {/* x axis: time-of-day icon, block name and hours under each bar */}
            {blocks.map((name, t) => (
              <g key={name}>
                <text x={centerX(t)} y={H - 42} textAnchor="middle" fontSize="16">
                  {blockIcons[t]}
                </text>
                <text className="fill-chart-text font-body text-[15px]" x={centerX(t)} y={H - 26} textAnchor="middle">
                  {name}
                </text>
                <text className="fill-label font-body text-[13px]" x={centerX(t)} y={H - 9} textAnchor="middle">
                  {blockHours[t]}
                </text>
              </g>
            ))}
          </svg>

          {/* tooltip: group, block, mw and share of demand
              left and top are percentages of the wrapper, so it follows the segment at any width
              clamp keeps the middle of the tooltip inside the chart, even for a segment near an edge */}
          {active && (
            <div
              role="tooltip"
              className={tooltipBox}
              style={{
                left: `${tooltipLeft}%`,
                top: `clamp(${TOOLTIP_HALF}, ${tooltipMiddleY}%, calc(100% - ${TOOLTIP_HALF}))`,
                transform: `translate(${tooltipOnRight ? "0" : "-100%"}, -50%)`,
              }}
            >
              <span className="block text-body text-white">{active.group}</span>
              <span className="block text-label">
                {blocks[active.t]} · {blockHours[active.t]}
              </span>
              <span className="mt-1 block text-gold">{formatNumber(active.mw)} MW</span>
              <span className="block text-label">{((active.mw / demand[active.t]) * 100).toFixed(1)}% of demand</span>
            </div>
          )}
        </div>
      </div>

      {/* legend: color key for the segments, click a group to hide or show it
          it sits outside the scroll box, so it stays in view while the chart scrolls */}
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-chart-text">
        {groups.map((group) => {
          const isHidden = hidden.includes(group);
          return (
            <button
              key={group}
              type="button"
              className={`${legendItem} ${isHidden ? "line-through opacity-40" : ""}`}
              aria-pressed={!isHidden}
              onClick={() => toggleGroup(group)}
            >
              <span className="inline-block size-3 border-2 border-black" style={{ background: styleOf(group).color }} />
              {group}
            </button>
          );
        })}
        {/* demand is not a button, the line always stays */}
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block size-3 border-2 border-black bg-redstone" />
          Demand
        </span>
      </div>
    </div>
  );
}

// references:
// react, useState: https://react.dev/reference/react/useState
// react, updating arrays in state: https://react.dev/learn/updating-arrays-in-state
// react, responding to events: https://react.dev/learn/responding-to-events
// react, rendering lists (keys): https://react.dev/learn/rendering-lists
// next.js, server and client components: https://nextjs.org/docs/app/getting-started/server-and-client-components
// mdn, svg viewBox: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/viewBox
// mdn, svg shape-rendering (crispEdges): https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/shape-rendering
// mdn, svg transform (translate and rotate): https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/transform
// mdn, svg polyline: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/polyline
// mdn, svg text-anchor: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/text-anchor
// mdn, css clamp(): https://developer.mozilla.org/en-US/docs/Web/CSS/clamp
// mdn, overflow-x: https://developer.mozilla.org/en-US/docs/Web/CSS/overflow-x
// mdn, tabindex (keyboard access to scrollable regions): https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/tabindex
// mdn, region role: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/region_role
// mdn, aria-pressed: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-pressed
// mdn, array.prototype.find: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
// mdn, array.prototype.reduce: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce
// mdn, number.toFixed: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toFixed
// w3c wcag 2.2, target size (minimum), 2.5.8: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
// wai-aria authoring practices, tooltip pattern: https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
// tailwind css v4, stroke: https://tailwindcss.com/docs/stroke
// tailwind css v4, min-width: https://tailwindcss.com/docs/min-width
// tailwind css v4, overflow: https://tailwindcss.com/docs/overflow
// tailwind css v4, responsive design (max-md: variant): https://tailwindcss.com/docs/responsive-design#targeting-a-breakpoint-range
// tailwind css v4, text decoration (line-through): https://tailwindcss.com/docs/text-decoration-line
// cmsc 150 final project spec, table 2 (demand and block hours)
// tsdoc standard: https://tsdoc.org