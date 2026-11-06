import { cx } from "../../utils/cx.js";

export default function StatGroup({ stats }) {
  return (
    <dl className="stat-group">
      {stats.map((stat) => (
        <div key={stat.label} className="stat-group__item">
          <dt className="stat-group__label">{stat.label}</dt>
          <dd className={cx("stat-group__value", stat.tone && `stat-group__value--${stat.tone}`)}>{stat.value}</dd>
          {stat.detail && <dd className="stat-group__detail">{stat.detail}</dd>}
        </div>
      ))}
    </dl>
  );
}
