import { useMemo, useState } from "react";
import { addDays, isSameDay, startOfDay } from "../../utils/date.js";
import { startOfWeek } from "../../utils/calendarLayout.js";
import { cx } from "../../utils/cx.js";
import Icon from "../ui/Icon.jsx";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_TITLE = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });

function buildDays(month) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const days = [];
  for (let day = startOfWeek(first); day <= last || days.length % 7 !== 0; day = addDays(day, 1)) {
    days.push({ date: day, currentMonth: day.getMonth() === month.getMonth() });
  }
  return days;
}

function NavButton({ label, onClick, double, direction }) {
  const icon = direction === "prev" ? "chevron-left" : "chevron-right";
  return (
    <button type="button" className="period-picker__nav" aria-label={label} onClick={onClick}>
      <Icon name={icon} size={16} strokeWidth={3.2} />
      {double && <Icon name={icon} size={16} strokeWidth={3.2} className="period-picker__nav-second" />}
    </button>
  );
}

export default function PeriodPicker({ mode, value, onSelect }) {
  const [month, setMonth] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1));
  const [hoverWeek, setHoverWeek] = useState(null);
  const days = useMemo(() => buildDays(month), [month]);
  const selectedWeek = startOfWeek(value).getTime();
  const today = startOfDay(new Date());

  const changeMonth = (offset) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));

  return (
    <div className="period-picker">
      <div className="period-picker__header">
        <div className="period-picker__group">
          <NavButton label="Previous year" direction="prev" double onClick={() => changeMonth(-12)} />
          <NavButton label="Previous month" direction="prev" onClick={() => changeMonth(-1)} />
        </div>
        <h2 className="period-picker__title">{MONTH_TITLE.format(month)}</h2>
        <div className="period-picker__group">
          <NavButton label="Next month" direction="next" onClick={() => changeMonth(1)} />
          <NavButton label="Next year" direction="next" double onClick={() => changeMonth(12)} />
        </div>
      </div>
      <div className="period-picker__weekdays" aria-hidden="true">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="period-picker__grid" onMouseLeave={() => setHoverWeek(null)}>
        {days.map(({ date, currentMonth }) => {
          const week = startOfWeek(date).getTime();
          const selected = mode === "week" ? week === selectedWeek : isSameDay(date, value);
          const hovered = mode === "week" && hoverWeek === week && !selected;
          return (
            <button
              key={date.toISOString()}
              type="button"
              className={cx(
                "period-picker__day",
                !currentMonth && "period-picker__day--outside",
                selected && "period-picker__day--selected",
                hovered && "period-picker__day--hovered",
                isSameDay(date, today) && "period-picker__day--today"
              )}
              aria-pressed={selected}
              onMouseEnter={() => setHoverWeek(week)}
              onClick={() => onSelect(date)}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
      <div className="period-picker__footer">
        <button type="button" className="period-picker__today" onClick={() => onSelect(today)}>
          Today
        </button>
      </div>
    </div>
  );
}
