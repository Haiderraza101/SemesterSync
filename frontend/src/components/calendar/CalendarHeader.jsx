import { useRef, useState } from "react";
import { useWindowWidth } from "../../hooks/useWindowWidth.js";
import { startOfWeek, weekdayIndexes } from "../../utils/calendarLayout.js";
import { cx } from "../../utils/cx.js";
import { SHORT_DAY_NAMES, addDays, isSameDay, startOfDay } from "../../utils/date.js";
import Floating from "../ui/Floating.jsx";
import Icon from "../ui/Icon.jsx";
import Select from "../ui/Select.jsx";
import PeriodPicker from "./PeriodPicker.jsx";

const DESKTOP_MIN_WIDTH = 1024;

const VIEWS = [
  { value: "week", label: "Week" },
  { value: "day", label: "Day" },
  { value: "month", label: "Month" },
];

export const KIND_OPTIONS = [
  { value: "all", label: "View all" },
  { value: "class", label: "Classes" },
  { value: "exam", label: "Exams" },
  { value: "task", label: "Deadlines" },
];

function NavButton({ label, icon, double, iconAfter = false, onClick }) {
  const icons = (
    <span className="cal-nav__icons">
      <Icon name={icon} size={18} strokeWidth={3.4} />
      {double && <Icon name={icon} size={18} strokeWidth={3.4} className="cal-nav__icon-second" />}
    </span>
  );
  return (
    <button type="button" className="cal-nav__button" onClick={onClick}>
      {!iconAfter && icons}
      <span>{label}</span>
      {iconAfter && icons}
    </button>
  );
}

export default function CalendarHeader({
  view,
  date,
  title,
  showSaturday,
  courseOptions,
  focusCode,
  kind,
  onViewChange,
  onDateChange,
  onFocusChange,
  onKindChange,
  actions,
}) {
  const width = useWindowWidth();
  const pickerRef = useRef(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const desktop = width >= DESKTOP_MIN_WIDTH;
  const today = startOfDay(new Date());
  const monday = startOfWeek(date);

  const goTo = (nextDate, nextView = view) => {
    onDateChange(startOfDay(nextDate));
    if (nextView !== view) onViewChange(nextView);
  };

  const step = (direction) => {
    if (view === "month") goTo(new Date(date.getFullYear(), date.getMonth() + direction, 1));
    else goTo(addDays(date, direction * (view === "day" ? 1 : 7)));
  };

  const quickDays = weekdayIndexes(showSaturday).map((weekday) => ({
    label: SHORT_DAY_NAMES[weekday],
    date: addDays(monday, weekday - 1),
  }));

  return (
    <div className="cal-header">
      <div className="cal-header__top">
        <div className="cal-header__left">
          <Select
            aria-label="Courses"
            value={focusCode}
            options={courseOptions}
            onChange={onFocusChange}
            className="cal-header__course"
          />
        </div>
        <h1 className="cal-header__title" aria-live="polite">
          {title}
        </h1>
        <div className="cal-header__right">
          <div className="cal-toggle" role="group" aria-label="Calendar view">
            {VIEWS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={view === option.value}
                className={cx("cal-toggle__option", view === option.value && "cal-toggle__option--active")}
                onClick={() => onViewChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            ref={pickerRef}
            type="button"
            className="cal-date-button"
            aria-haspopup="dialog"
            aria-expanded={pickerOpen}
            onClick={() => setPickerOpen((open) => !open)}
          >
            <Icon name="calendar" size={16} strokeWidth={2} />
            <span>Date</span>
          </button>
          <Floating
            anchorRef={pickerRef}
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            align="end"
            className="period-picker-popover"
            role="dialog"
            aria-label="Pick a date"
          >
            <PeriodPicker
              mode={view === "week" ? "week" : "day"}
              value={date}
              onSelect={(picked) => {
                setPickerOpen(false);
                goTo(view === "month" ? new Date(picked.getFullYear(), picked.getMonth(), 1) : picked);
              }}
            />
          </Floating>
          {actions}
        </div>
      </div>

      <div className="cal-header__bottom">
        {desktop && view !== "month" ? (
          <div className="cal-nav">
            <NavButton label="Week" icon="chevron-left" double onClick={() => goTo(addDays(date, -7), "week")} />
            <NavButton label="Day" icon="chevron-left" onClick={() => goTo(addDays(date, -1), "day")} />
            <div className="cal-nav__days">
              <button
                type="button"
                className={cx("cal-nav__day", view === "day" && isSameDay(date, today) && "cal-nav__day--active")}
                onClick={() => goTo(today, "day")}
              >
                Today
              </button>
              {quickDays.map((quick) => (
                <button
                  key={quick.label}
                  type="button"
                  className={cx("cal-nav__day", view === "day" && isSameDay(date, quick.date) && "cal-nav__day--active")}
                  onClick={() => goTo(quick.date, "day")}
                >
                  {quick.label}
                </button>
              ))}
            </div>
            <NavButton label="Day" icon="chevron-right" iconAfter onClick={() => goTo(addDays(date, 1), "day")} />
            <NavButton label="Week" icon="chevron-right" double iconAfter onClick={() => goTo(addDays(date, 7), "week")} />
          </div>
        ) : (
          <div className="cal-nav cal-nav--compact">
            <NavButton label="Prev" icon="chevron-left" onClick={() => step(-1)} />
            <button type="button" className="cal-nav__button" onClick={() => goTo(view === "month" ? new Date(today.getFullYear(), today.getMonth(), 1) : today)}>
              Today
            </button>
            <NavButton label="Next" icon="chevron-right" iconAfter onClick={() => step(1)} />
          </div>
        )}
        <div className="cal-header__kind">
          <Select aria-label="Show" value={kind} options={KIND_OPTIONS} onChange={onKindChange} />
        </div>
      </div>
    </div>
  );
}
