// DispatchChart.tsx
// blocky stacked bars: one bar per block (b1 to b6), one colored segment per plant group.
// the dashed red line is the demand, so you can see supply meeting demand.
// drawn with plain svg, so no chart library is needed.
// svg shapes are styled with tailwind too (stroke-*, fill-*, text-*).

import { blockIcons, styleOf } from "@/lib/plants";

interface Props {
  groups: string[];   // plant group names (one per row of values)
  blocks: string[];   // block names, e.g. b1 to b6
  values: number[][]; // values[g][t] = mw of group g in block t
}

// demand per block from the project spec (table 2), used for the dashed line
const demand = [6300, 8600, 11800, 12300, 14000, 10600];

// size of the svg and the empty space around the bars
const W = 760;
const H = 340;
const PAD = { left: 64, right: 16, top: 16, bottom: 44 };

// spacing between the horizontal grid lines, in mw
const GRID_STEP = 5000;

export default function DispatchChart({ groups, blocks, values }: Props) {
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