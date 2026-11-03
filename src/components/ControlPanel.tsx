/*
 * ControlPanel.tsx
 * The left panel of the app. It has the plant group checkboxes
 * (with Check All and Reset), the CO2 cap toggle and limit box,
 * and the Solve button. It holds no state of its own: everything
 * comes in through props from page.tsx.
 */

interface Props {
  groups: string[];                          // all plant group names
  selected: string[];                        // groups currently ticked
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
      {/* Plant group selection */}
      <h2>Plant groups</h2>
      <div className="button-row">
        <button type="button" className="secondary" onClick={props.onCheckAll}>
          Check All
        </button>
        <button type="button" className="secondary" onClick={props.onReset}>
          Reset
        </button>
      </div>

      {/* One checkbox per plant group */}
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

      {/* CO2 cap: a switch and a limit box */}
      <h2>CO₂ cap</h2>
      <label className="toggle">
        <input type="checkbox" checked={props.co2On} onChange={(e) => props.onCo2On(e.target.checked)} />
        Limit daily CO₂
      </label>
      <label className="field">
        Limit (t/day)
        {/* The box is disabled while the cap is switched off.
            It is a text input so blank or invalid values reach the API's validation. */}
        <input
          type="text"
          inputMode="numeric"
          value={props.co2Cap}
          disabled={!props.co2On}
          onChange={(e) => props.onCo2Cap(e.target.value)}
        />
      </label>

      {/* Start solving; disabled while a solve is running */}
      <button type="button" className="primary" onClick={props.onSolve} disabled={props.loading}>
        {props.loading ? "Solving..." : "Solve"}
      </button>
    </section>
  );
}
