import { useState } from "react";
import StatusBadge from "../ui/StatusBadge.jsx";
import { cx } from "../../utils/cx.js";
import ChartCard from "./ChartCard.jsx";
import HalfDonut from "./HalfDonut.jsx";

const RISK_COLORS = { ok: "#16a34a", warning: "#f59e0b", critical: "#ef4444" };
const LIST_LIMIT = 5;

function overallRisk(percentage, requirement) {
  if (percentage === null) return "ok";
  if (percentage < requirement) return "critical";
  if (percentage < requirement + 5) return "warning";
  return "ok";
}

export default function AttendanceGauge({ summary, overall, requirement }) {
  const [hovered, setHovered] = useState(null);
  const risk = overallRisk(overall.percentage, requirement);
  const atRisk = summary.filter((item) => item.risk !== "ok").length;
  const items = [...summary].sort((a, b) => (b.held > 0) - (a.held > 0) || a.percentage - b.percentage).slice(0, LIST_LIMIT);

  return (
    <ChartCard title="Attendance" link={{ to: "/app/attendance", label: "Details" }}>
      <div className="chart-card__body">
        <HalfDonut
          track
          segments={overall.percentage === null ? [] : [{ name: "Attended", value: overall.percentage, color: RISK_COLORS[risk] }]}
          value={overall.percentage === null ? "–" : `${overall.percentage}%`}
          label="Overall attendance"
        />
        <div className="gauge-summary">
          <span className="gauge-summary__text">
            {overall.held ? `${overall.attended} of ${overall.held} classes attended` : "No classes recorded yet"} · {requirement}% required
          </span>
          <StatusBadge status={atRisk ? "warning" : "safe"} label={atRisk ? `${atRisk} at risk` : "All on track"} />
        </div>
        <ul className="chart-list">
          {items.map((item, index) => (
            <li
              key={item.course.code}
              className={cx("chart-list__item", hovered === index && "chart-list__item--active")}
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="chart-list__name">
                <span className="chart-list__dot" style={{ background: item.course.color }} />
                <span className="chart-list__text">{item.course.name}</span>
              </span>
              <span className="chart-list__values">
                <span className="chart-list__value">{item.held ? `${item.attended}/${item.held}` : "No classes"}</span>
                <span className="chart-list__divider">|</span>
                <span className={cx("chart-list__pct", `chart-list__pct--${item.risk}`)}>{item.held ? `${item.percentage}%` : "–"}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </ChartCard>
  );
}
