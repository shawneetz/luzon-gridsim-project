import { formatNumber } from "@/lib/format";

interface Props {
  corner: string;
  columns: string[];
  rowLabels: string[];
  rows: (number | string)[][];
}

export default function DataTable({ corner, columns, rowLabels, rows }: Props) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>{corner}</th>
            {columns.map((name, j) => (
              <th key={j}>{name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <th>{rowLabels[i]}</th>
              {row.map((cell, j) => (
                <td key={j} className={cell === 0 ? "zero" : ""}>
                  {typeof cell === "number" ? formatNumber(cell) : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
