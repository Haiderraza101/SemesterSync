import Icon from "../ui/Icon.jsx";
import SegmentedControl from "../ui/SegmentedControl.jsx";

export const CALENDAR_VIEWS = [
  { value: "timeGridDay", label: "Day" },
  { value: "timeGridWeek", label: "Week" },
  { value: "dayGridMonth", label: "Month" },
];

export default function CalendarToolbar({ title, view, onPrev, onNext, onToday, onViewChange, actions }) {
  return (
    <header className="page-header calendar-toolbar">
      <div className="page-header__row">
        <div className="calendar-toolbar__nav">
          <h1 className="calendar-toolbar__title" aria-live="polite">
            {title}
          </h1>
          <button type="button" className="btn btn--secondary btn--icon" aria-label="Previous" onClick={onPrev}>
            <Icon name="chevronLeft" size={14} />
          </button>
          <button type="button" className="btn btn--secondary btn--icon" aria-label="Next" onClick={onNext}>
            <Icon name="chevronRight" size={14} />
          </button>
          <button type="button" className="btn btn--secondary" onClick={onToday}>
            Today
          </button>
        </div>
        <div className="page-header__actions">
          <SegmentedControl label="Calendar view" options={CALENDAR_VIEWS} value={view} onChange={onViewChange} />
          {actions}
        </div>
      </div>
    </header>
  );
}
