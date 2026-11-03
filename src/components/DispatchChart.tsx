// DISPATCH CHART
// Blocky stacked bars: one bar per block (B1 to B6), one colored segment per plant group.
// The dashed red line is the demand, so you can see supply meeting demand.
// Drawn with plain SVG, so no chart library is needed.

import { blockIcons, styleOf } from "@/lib/plants";

interface Props {
  groups: string[];   // plant group names (one per row of values)
  blocks: string[];   // block names, e.g. B1 to B6
  values: number[][]; // values[g][t] = MW of group g in block t
}

// Demand per block from the project spec (Table 2), used for the dashed line
const demand = [6300, 8600, 11800, 12300, 14000, 10600];

// Drawing area inside the SVG
const W = 760;
const H = 340;
const PAD = { left: 64, right: 16, top: 16, bottom: 44 };

export default function DispatchChart({ groups, blocks, values }: Props) {
  const n = blocks.length;

  // Scale: the top of the chart is a little above the highest demand or supply
  const totals = blocks.map((_, t) => values.reduce((sum, row) => sum + row[t], 0));
  const maxY = Math.max(...totals, ...demand) * 1.08;

  // Each block gets an equal slot; the bar fills most of it
  const slotWidth = (W - PAD.left - PAD.right) / n;
  const barWidth = slotWidth * 0.6;
  const centerX = (t: number) => PAD.left + slotWidth * t + slotWidth / 2;
  const y = (mw: number) => H - PAD.bottom - (mw / maxY) * (H - PAD.top - PAD.bottom);

  // Horizontal grid lines every 5,000 MW
  const ticks: number[] = [];
  for (let mw = 0; mw <= maxY; mw += 5000) ticks.push(mw);

  return (
    <div className="chart-box">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Stacked dispatch per block compared with demand">
        {/* grid lines and MW labels */}
        {ticks.map((mw) => (
          <g key={mw}>
            <line className="chart-axis" x1={PAD.left} x2={W - PAD.right} y1={y(mw)} y2={y(mw)} />
            <text className="chart-label" x={PAD.left - 8} y={y(mw) + 5} textAnchor="end">
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
                x={centerX(t) - barWidth / 2}
                y={top}
                width={barWidth}
                height={bottom - top}
                fill={styleOf(group).color}
                stroke="#000"
                strokeWidth={2}
              />
            );
          });
        })}

        {/* demand line (redstone) */}
        <polyline className="chart-demand" points={demand.map((d, t) => `${centerX(t)},${y(d)}`).join(" ")} />

        {/* time-of-day icon and block name under each bar */}
        {blocks.map((name, t) => (
          <g key={name}>
            <text x={centerX(t)} y={H - 22} textAnchor="middle" fontSize="16">
              {blockIcons[t]}
            </text>
            <text className="chart-label" x={centerX(t)} y={H - 6} textAnchor="middle">
              {name}
            </text>
          </g>
        ))}
      </svg>

      {/* legend: color key for the segments */}
      <div className="legend">
        {groups.map((group) => (
          <span key={group}>
            <span className="legend-dot" style={{ background: styleOf(group).color }} />
            {group}
          </span>
        ))}
        <span>
          <span className="legend-dot" style={{ background: "#ff3030" }} />
          Demand
        </span>
      </div>
    </div>
  );
}
