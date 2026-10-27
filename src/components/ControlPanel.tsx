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
        <button type="button" className="secondary" onClick={props.onCheckAll}>
          Check All
        </button>
        <button type="button" className="secondary" onClick={props.onReset}>
          Reset
        </button>
      </div>

      <div className="checklist">
        {props.groups.map((group) => (
          <label key={group}>
            <input
              type="checkbox"
              checked={props.selected.includes(group)}
              onChange={() => props.onToggleGroup(group)}
            />
            {group}
          </label>
        ))}
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
