export default function ChartTooltip({ active, payload, title, rows }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__header">{title(point)}</div>
      <div className="chart-tooltip__body">
        {rows(point).map((row) => (
          <div key={row.label} className="chart-tooltip__row">
            <span className="chart-tooltip__value">
              <span className="chart-tooltip__dot" style={{ background: row.color }} />
              {row.value}
            </span>
            <span className="chart-tooltip__label">{row.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
