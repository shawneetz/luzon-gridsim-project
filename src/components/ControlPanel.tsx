// CONTROL PANEL
// Left side of the page: plant group slots, the CO2 cap toggle, and the Solve button.
// Each plant group is an inventory slot you click to select (white frame) or unselect.
// This component holds no state; the page passes everything in through props.

import { styleOf } from "@/lib/plants";

interface Props {
  groups: string[];
  selected: string[];
  onToggleGroup: (group: string) => void;
  onCheckAll: () => void;
  onReset: () => void;
  co2On: boolean;
  onCo2On: (on: boolean) => void;
  co2Cap: string;
  onCo2Cap: (cap: string) => void;
  onSolve: () => void;
  loading: boolean;
}

export default function ControlPanel(props: Props) {
  return (
    <section className="card">
      <h2>Plant groups</h2>
      <div className="button-row">
        <button type="button" onClick={props.onCheckAll}>
          Check All
        </button>
        <button type="button" onClick={props.onReset}>
          Reset
        </button>
      </div>

      {/* One slot per plant group. Clicking a slot selects or unselects it. */}
      <div className="plant-grid">
        {props.groups.map((group) => {
          const style = styleOf(group);
          const isOn = props.selected.includes(group);
          return (
            <button
              key={group}
              type="button"
              className={`plant-card ${isOn ? "on" : ""}`}
              style={{ "--plant": style.color } as React.CSSProperties}
              aria-pressed={isOn}
              onClick={() => props.onToggleGroup(group)}
            >
              <span className="plant-icon">{style.icon}</span>
              <span className="plant-name">{group}</span>
              <span className="plant-tag">{style.tag}</span>
            </button>
          );
        })}
      </div>

      <h2>CO₂ cap</h2>
      <label className="toggle">
        <input type="checkbox" checked={props.co2On} onChange={(e) => props.onCo2On(e.target.checked)} />
        Limit daily CO₂
      </label>
      <label className="field">
        Limit (t/day)
        <input
          type="text"
          inputMode="numeric"
          value={props.co2Cap}
          disabled={!props.co2On}
          onChange={(e) => props.onCo2Cap(e.target.value)}
        />
      </label>

      <button type="button" className="primary" onClick={props.onSolve} disabled={props.loading}>
        {props.loading ? "Solving..." : "Solve"}
      </button>
    </section>
  );
}
