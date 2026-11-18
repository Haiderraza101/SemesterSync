import { useMemo, useState } from "react";
import SemesterNotice from "../components/app/SemesterNotice.jsx";
import CalendarHeader from "../components/calendar/CalendarHeader.jsx";
import CalendarLegend from "../components/calendar/CalendarLegend.jsx";
import CourseFilter from "../components/calendar/CourseFilter.jsx";
import EventDetails from "../components/calendar/EventDetails.jsx";
import MakeupModal from "../components/calendar/MakeupModal.jsx";
import MonthGrid from "../components/calendar/MonthGrid.jsx";
import TimeGrid from "../components/calendar/TimeGrid.jsx";
import Button from "../components/ui/Button.jsx";
import Sheet from "../components/ui/Sheet.jsx";
import { useSchedule } from "../hooks/useSchedule.js";
import { useToast } from "../hooks/useToast.js";
import { buildCalendarEvents, toCalendarItem } from "../utils/calendarEvents.js";
import { formatTitle, getRange, getVisibleDays, viewFromSetting, weekdayIndexes } from "../utils/calendarLayout.js";
import { findClashes, getClashingSlotKeys } from "../utils/clashes.js";
import { startOfDay } from "../utils/date.js";
import { getSelectedCourses } from "../utils/schedule.js";
import "../styles/pages/calendar.css";

const ALL = "all";

export default function Calendar() {
  const { schedule, toggleCancelled, markAttendance, addMakeup, removeMakeup } = useSchedule();
  const { notify } = useToast();
  const { showSaturday, defaultView } = schedule.settings;
  const [view, setView] = useState(() => viewFromSetting(defaultView));
  const [date, setDate] = useState(() => startOfDay(new Date()));
  const [selectedId, setSelectedId] = useState(null);
  const [hiddenCodes, setHiddenCodes] = useState(() => new Set());
  const [focusCode, setFocusCode] = useState(ALL);
  const [kind, setKind] = useState(ALL);
  const [makeupFor, setMakeupFor] = useState(null);

  const courses = useMemo(() => getSelectedCourses(schedule), [schedule]);
  const clashingSlots = useMemo(() => getClashingSlotKeys(findClashes(courses)), [courses]);
  const range = useMemo(() => getRange(view, date, showSaturday), [view, date, showSaturday]);

  const effectiveHidden = useMemo(() => {
    if (focusCode === ALL) return hiddenCodes;
    return new Set(courses.map((course) => course.code).filter((code) => code !== focusCode));
  }, [focusCode, hiddenCodes, courses]);

  const events = useMemo(
    () => buildCalendarEvents({ schedule, courses, range, clashingSlots, hiddenCodes: effectiveHidden }),
    [schedule, courses, range, clashingSlots, effectiveHidden]
  );

  const items = useMemo(
    () =>
      events
        .map(toCalendarItem)
        .filter((item) => kind === ALL || (kind === "class" ? item.type === "class" : item.type === kind)),
    [events, kind]
  );

  const courseOptions = useMemo(
    () => [
      { value: ALL, label: "All courses" },
      ...courses.map((course) => ({ value: course.code, label: course.shortName || course.name })),
    ],
    [courses]
  );

  const selectedEvent = events.find((event) => event.id === selectedId) || null;

  const handleToggleCancel = (id) => {
    const wasCancelled = schedule.cancelled.includes(id);
    toggleCancelled(id);
    notify(wasCancelled ? "Class restored." : "Class cancelled for this week.");
  };

  const handleMakeupSubmit = (makeup) => {
    addMakeup(makeup);
    setMakeupFor(null);
    setSelectedId(makeup.id);
    notify("Makeup class added.");
  };

  const handleRemoveMakeup = (id) => {
    removeMakeup(id);
    setSelectedId(null);
    notify("Makeup class removed.");
  };

  const toggleCourse = (code) => {
    setHiddenCodes((current) => {
      const next = new Set(current);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const openDay = (day) => {
    setDate(startOfDay(day));
    setView("day");
  };

  return (
    <>
      <SemesterNotice />
      <CalendarHeader
        view={view}
        date={date}
        title={formatTitle(view, date, showSaturday)}
        showSaturday={showSaturday}
        courseOptions={courseOptions}
        focusCode={focusCode}
        kind={kind}
        onViewChange={setView}
        onDateChange={setDate}
        onFocusChange={setFocusCode}
        onKindChange={setKind}
        actions={
          <Button to="/app/tasks" variant="primary" className="cal-header__action">
            Add task
          </Button>
        }
      />
      <div className="calendar-layout">
        <div className="calendar-layout__main">
          {view === "month" ? (
            <MonthGrid
              month={date}
              weekdays={weekdayIndexes(showSaturday)}
              items={items}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onOpenDay={openDay}
            />
          ) : (
            <TimeGrid
              days={getVisibleDays(view, date, showSaturday)}
              items={items}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}
        </div>
        <div className="calendar-layout__extras">
          {courses.length > 0 && <CourseFilter courses={courses} hiddenCodes={hiddenCodes} onToggle={toggleCourse} />}
          <CalendarLegend />
        </div>
      </div>
      <Sheet open={Boolean(selectedEvent)} title="Event details" onClose={() => setSelectedId(null)}>
        <EventDetails
          event={selectedEvent}
          attendance={selectedEvent ? schedule.attendance.marks[selectedEvent.id] : undefined}
          onToggleCancel={handleToggleCancel}
          onMarkAttendance={markAttendance}
          onAddMakeup={(instance) => {
            setSelectedId(null);
            setMakeupFor(instance);
          }}
          onRemoveMakeup={handleRemoveMakeup}
        />
      </Sheet>
      <MakeupModal instance={makeupFor} onSubmit={handleMakeupSubmit} onClose={() => setMakeupFor(null)} />
    </>
  );
}
