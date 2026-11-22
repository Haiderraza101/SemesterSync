import { useMemo } from "react";
import { getMonthWeeks, groupByDay } from "../../utils/calendarLayout.js";
import { cx } from "../../utils/cx.js";
import { SHORT_DAY_NAMES, isSameDay, toDateKey } from "../../utils/date.js";
import Icon from "../ui/Icon.jsx";
import EventCard from "./EventCard.jsx";

const MAX_VISIBLE = 3;

export default function MonthGrid({ month, weekdays, items, selectedId, onSelect, onOpenDay, onAddDay }) {
  const weeks = useMemo(() => getMonthWeeks(month), [month]);
  const itemsByDay = useMemo(() => groupByDay(items), [items]);
  const today = new Date();
  const template = { gridTemplateColumns: `repeat(${weekdays.length}, minmax(120px, 1fr))` };

  return (
    <div className="cal-grid">
      <div className="cal-grid__scroll scrollbar-premium">
        <div className="cal-month">
          <div className="cal-month__head" style={template}>
            {weekdays.map((weekday) => (
              <div key={weekday} className="cal-grid__day-header">
                <span className="cal-grid__day-name">{SHORT_DAY_NAMES[weekday]}</span>
              </div>
            ))}
          </div>
          {weeks.map((week) => (
            <div key={toDateKey(week[0])} className="cal-month__week" style={template}>
              {weekdays.map((weekday) => {
                const day = week[(weekday + 6) % 7];
                const dayItems = (itemsByDay.get(toDateKey(day)) || []).sort((a, b) => a.start - b.start);
                const hidden = dayItems.length - MAX_VISIBLE;
                const outside = day.getMonth() !== month.getMonth();
                return (
                  <div key={toDateKey(day)} className={cx("cal-month__cell", outside && "cal-month__cell--outside")}>
                    <div className="cal-month__cell-head">
                      <button
                        type="button"
                        className={cx("cal-month__date", isSameDay(day, today) && "cal-month__date--today")}
                        aria-label={`Open ${day.toDateString()} in day view`}
                        onClick={() => onOpenDay(day)}
                      >
                        {day.getDate()}
                      </button>
                      {onAddDay && (
                        <button
                          type="button"
                          className="cal-month__add"
                          aria-label={`Add something on ${day.toDateString()}`}
                          onClick={() => onAddDay(day)}
                        >
                          <Icon name="plus" size={14} strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                    <div className="cal-month__items">
                      {dayItems.slice(0, MAX_VISIBLE).map((item) => (
                        <EventCard
                          key={item.id}
                          item={item}
                          compact
                          height={0}
                          selected={item.id === selectedId}
                          onSelect={onSelect}
                        />
                      ))}
                      {hidden > 0 && (
                        <button type="button" className="cal-month__more" onClick={() => onOpenDay(day)}>
                          +{hidden} more
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
