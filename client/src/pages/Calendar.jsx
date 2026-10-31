import { useCallback, useMemo, useRef, useState } from "react";
import CalendarLegend from "../components/calendar/CalendarLegend.jsx";
import CalendarToolbar from "../components/calendar/CalendarToolbar.jsx";
import CalendarView from "../components/calendar/CalendarView.jsx";
import CourseFilter from "../components/calendar/CourseFilter.jsx";
import EventDetails from "../components/calendar/EventDetails.jsx";
import MakeupModal from "../components/calendar/MakeupModal.jsx";
import Button from "../components/ui/Button.jsx";
import { useSchedule } from "../hooks/useSchedule.js";
import { useToast } from "../hooks/useToast.js";
import { buildCalendarEvents } from "../utils/calendarEvents.js";
import { findClashes, getClashingSlotKeys } from "../utils/clashes.js";
import { getSelectedCourses } from "../utils/schedule.js";
import "../styles/pages/calendar.css";

export default function Calendar() {
  const { schedule, toggleCancelled, markAttendance, addMakeup, removeMakeup } = useSchedule();
  const { notify } = useToast();
  const calendarRef = useRef(null);
  const [range, setRange] = useState(null);
  const [title, setTitle] = useState("");
  const [view, setView] = useState(schedule.settings.defaultView);
  const [selectedId, setSelectedId] = useState(null);
  const [hiddenCodes, setHiddenCodes] = useState(() => new Set());
  const [makeupFor, setMakeupFor] = useState(null);

  const courses = useMemo(() => getSelectedCourses(schedule), [schedule]);
  const clashingSlots = useMemo(() => getClashingSlotKeys(findClashes(courses)), [courses]);

  const events = useMemo(
    () => buildCalendarEvents({ schedule, courses, range, clashingSlots, hiddenCodes }),
    [schedule, courses, range, clashingSlots, hiddenCodes]
  );

  const displayedEvents = useMemo(
    () =>
      events.map((event) =>
        event.id === selectedId ? { ...event, classNames: [...event.classNames, "ss-event--selected"] } : event
      ),
    [events, selectedId]
  );

  const selectedEvent = events.find((event) => event.id === selectedId) || null;

  const getApi = () => calendarRef.current?.getApi();

  const handleDatesSet = useCallback((info) => {
    setRange((current) =>
      current && current.start.getTime() === info.start.getTime() && current.end.getTime() === info.end.getTime()
        ? current
        : { start: info.start, end: info.end }
    );
    setTitle(info.view.title);
    setView(info.view.type);
  }, []);

  const handleEventClick = useCallback((info) => {
    info.jsEvent.preventDefault();
    setSelectedId(info.event.id);
  }, []);

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

  return (
    <>
      <CalendarToolbar
        title={title}
        view={view}
        onPrev={() => getApi()?.prev()}
        onNext={() => getApi()?.next()}
        onToday={() => getApi()?.today()}
        onViewChange={(nextView) => getApi()?.changeView(nextView)}
        actions={
          <Button to="/app/tasks" variant="primary">
            Add task
          </Button>
        }
      />
      <div className="calendar-layout">
        <div className="calendar-layout__main">
          <CalendarView
            ref={calendarRef}
            events={displayedEvents}
            initialView={schedule.settings.defaultView}
            showSaturday={schedule.settings.showSaturday}
            onDatesSet={handleDatesSet}
            onEventClick={handleEventClick}
          />
        </div>
        <aside className="calendar-layout__side" aria-label="Calendar details">
          <EventDetails
            event={selectedEvent}
            attendance={selectedEvent ? schedule.attendance.marks[selectedEvent.id] : undefined}
            onToggleCancel={handleToggleCancel}
            onMarkAttendance={markAttendance}
            onAddMakeup={setMakeupFor}
            onRemoveMakeup={handleRemoveMakeup}
          />
          {courses.length > 0 && <CourseFilter courses={courses} hiddenCodes={hiddenCodes} onToggle={toggleCourse} />}
          <CalendarLegend />
        </aside>
      </div>
      <MakeupModal instance={makeupFor} onSubmit={handleMakeupSubmit} onClose={() => setMakeupFor(null)} />
    </>
  );
}
