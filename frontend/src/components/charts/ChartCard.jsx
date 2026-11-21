import { Link } from "react-router-dom";
import { cx } from "../../utils/cx.js";

export function ChartMetrics({ metrics, value, onChange }) {
  return (
    <div className="chart-metrics" role="group" aria-label="Metric">
      {metrics.map((metric) => {
        const active = metric.id === value;
        return (
          <button
            key={metric.id}
            type="button"
            aria-pressed={active}
            className={cx("chart-metric", active && "chart-metric--active")}
            onClick={() => onChange(metric.id)}
          >
            <span className="chart-metric__label">
              {active && <span className="chart-metric__dot" />}
              {metric.label}
            </span>
            <span className="chart-metric__value">{metric.value}</span>
            {metric.detail && <span className="chart-metric__detail">{metric.detail}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function ChartTabs({ options, value, onChange, label }) {
  return (
    <div className="chart-tabs" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          className={cx("chart-tabs__tab", option.value === value && "chart-tabs__tab--active")}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default function ChartCard({ title, link, className, children }) {
  return (
    <section className={cx("chart-card", className)}>
      <header className="chart-card__header">
        <h2 className="chart-card__title">{title}</h2>
        {link && (
          <Link to={link.to} className="chart-card__link">
            {link.label}
          </Link>
        )}
      </header>
      {children}
    </section>
  );
}
