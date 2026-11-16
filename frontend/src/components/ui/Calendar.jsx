import { useEffect, useMemo, useRef, useState } from "react";
import { cx } from "../../utils/cx.js";
import Icon from "./Icon.jsx";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const CAPTION = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });
const DAY_LABEL = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function fromDateKey(key) {
  if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function addMonths(date, months) {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), lastDay));
}

function buildWeeks(month) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const start = addDays(first, -first.getDay());
  const end = addDays(last, 6 - last.getDay());
  const weeks = [];
  for (let day = start; day <= end; day = addDays(day, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, index) => addDays(day, index)));
  }
  return weeks;
}

function NavButton({ label, onClick, double = false, direction }) {
  const icon = direction === "prev" ? "chevron-left" : "chevron-right";
  return (
    <button type="button" className="ui-calendar__nav-button" aria-label={label} onClick={onClick}>
      {double ? (
        <span className="ui-calendar__double">
          <Icon name={icon} size={16} strokeWidth={3} />
          <Icon name={icon} size={16} strokeWidth={3} />
        </span>
      ) : (
        <Icon name={icon} size={16} strokeWidth={3} />
      )}
    </button>
  );
}

export default function Calendar({ value, onSelect, min, max, autoFocus = false }) {
  const selected = fromDateKey(value);
  const todayKey = toDateKey(new Date());
  const [focused, setFocused] = useState(() => selected || fromDateKey(min) || new Date());
  const [month, setMonth] = useState(() => new Date(focused.getFullYear(), focused.getMonth(), 1));
  const gridRef = useRef(null);
  const shouldFocus = useRef(autoFocus);

  const weeks = useMemo(() => buildWeeks(month), [month]);
  const isDisabled = (key) => (min && key < min) || (max && key > max);

  useEffect(() => {
    if (!shouldFocus.current) return;
    gridRef.current?.querySelector(`[data-key="${toDateKey(focused)}"]`)?.focus();
  }, [focused, month]);

  const moveFocus = (next) => {
    shouldFocus.current = true;
    setFocused(next);
    if (next.getMonth() !== month.getMonth() || next.getFullYear() !== month.getFullYear()) {
      setMonth(new Date(next.getFullYear(), next.getMonth(), 1));
    }
  };

  const shiftMonth = (months) => {
    const next = addMonths(month, months);
    setMonth(next);
    setFocused(addMonths(focused, months));
    shouldFocus.current = false;
  };

  const handleKeyDown = (event) => {
    const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (moves[event.key] !== undefined) {
      event.preventDefault();
      moveFocus(addDays(focused, moves[event.key]));
    } else if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault();
      moveFocus(addMonths(focused, event.key === "PageUp" ? -1 : 1));
    }
  };

  return (
    <div className="ui-calendar">
      <div className="ui-calendar__caption">
        <span className="ui-calendar__label" aria-live="polite">
          {CAPTION.format(month)}
        </span>
        <div className="ui-calendar__nav">
          <div className="ui-calendar__nav-group">
            <NavButton label="Previous year" direction="prev" double onClick={() => shiftMonth(-12)} />
            <NavButton label="Previous month" direction="prev" onClick={() => shiftMonth(-1)} />
          </div>
          <div className="ui-calendar__nav-group">
            <NavButton label="Next month" direction="next" onClick={() => shiftMonth(1)} />
            <NavButton label="Next year" direction="next" double onClick={() => shiftMonth(12)} />
          </div>
        </div>
      </div>
      <div className="ui-calendar__weekdays" aria-hidden="true">
        {WEEKDAYS.map((day) => (
          <span key={day} className="ui-calendar__weekday">
            {day}
          </span>
        ))}
      </div>
      <div ref={gridRef} className="ui-calendar__weeks" role="grid" onKeyDown={handleKeyDown}>
        {weeks.map((week) => (
          <div key={toDateKey(week[0])} className="ui-calendar__week" role="row">
            {week.map((day) => {
              const key = toDateKey(day);
              const outside = day.getMonth() !== month.getMonth();
              const isSelected = value === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="gridcell"
                  data-key={key}
                  tabIndex={key === toDateKey(focused) ? 0 : -1}
                  aria-selected={isSelected}
                  aria-label={DAY_LABEL.format(day)}
                  disabled={isDisabled(key)}
                  className={cx(
                    "ui-calendar__day",
                    outside && "ui-calendar__day--outside",
                    key === todayKey && "ui-calendar__day--today",
                    isSelected && "ui-calendar__day--selected"
                  )}
                  onClick={() => onSelect?.(key)}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
