import { cx } from "../../utils/cx.js";

export function KpiGrid({ children, columns = 4 }) {
  return <div className={cx("kpi-grid", columns !== 4 && `kpi-grid--${columns}`)}>{children}</div>;
}

export default function KpiCard({ label, value, unit, detail, tone, progress }) {
  return (
    <div className="kpi-card">
      <span className="kpi-card__label">{label}</span>
      <span className={cx("kpi-card__value", tone && `kpi-card__value--${tone}`)}>
        {value}
        {unit && <span className="kpi-card__unit">{unit}</span>}
      </span>
      {progress !== undefined && (
        <span className="kpi-card__bar" aria-hidden="true">
          <span
            className={cx("kpi-card__fill", tone && `kpi-card__fill--${tone}`)}
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </span>
      )}
      {detail && <span className="kpi-card__detail">{detail}</span>}
    </div>
  );
}
