import { useState } from "react";
import { cx } from "../../utils/cx.js";
import ChartCard from "./ChartCard.jsx";
import HalfDonut from "./HalfDonut.jsx";

function formatHours(value) {
  return `${Number.isInteger(value) ? value : value.toFixed(1)} h`;
}

export default function CourseHoursChart({ items }) {
  const [hovered, setHovered] = useState(null);
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <ChartCard title="Weekly hours by course" link={{ to: "/app/timetable", label: "Timetable" }}>
      <div className="chart-card__body">
        <HalfDonut
          segments={items}
          value={formatHours(Math.round(total * 10) / 10)}
          label="In class every week"
          activeIndex={hovered}
          onHover={setHovered}
        />
        <ul className="chart-list chart-list--spaced">
          {items.map((item, index) => (
            <li
              key={item.code}
              className={cx("chart-list__item", hovered === index && "chart-list__item--active")}
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="chart-list__name">
                <span className="chart-list__dot" style={{ background: item.color }} />
                <span className="chart-list__text">{item.name}</span>
              </span>
              <span className="chart-list__values">
                <span className="chart-list__value">{formatHours(item.value)}</span>
                <span className="chart-list__divider">|</span>
                <span className="chart-list__pct">{total ? ((item.value / total) * 100).toFixed(1) : "0.0"}%</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </ChartCard>
  );
}
