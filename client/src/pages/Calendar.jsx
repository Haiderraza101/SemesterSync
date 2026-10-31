import { useCallback, useMemo, useRef, useState } from "react";
import CalendarLegend from "../components/calendar/CalendarLegend.jsx";
import CalendarToolbar from "../components/calendar/CalendarToolbar.jsx";
import CalendarView from "../components/calendar/CalendarView.jsx";
import CourseFilter from "../components/calendar/CourseFilter.jsx";
import EventDetails from "../components/calendar/EventDetails.jsx";
import Button from "../components/ui/Button.jsx";
import { useSchedule } from "../hooks/useSchedule.js";
import { buildCalendarEvents } from "../utils/calendarEvents.js";
import { findClashes, getClashingSlotKeys } from "../utils/clashes.js";
import { getSelectedCourses } from "../utils/schedule.js";
import "../styles/pages/calendar.css";

export default function Calendar() {
  const { schedule } = useSchedule();
  const calendarRef = useRef(null);
  const [range, setRange] = useState(null);
  const [title, setTitle] = useState("");
  const [view, setView] = useState(schedule.settings.defaultView);
  const [selectedId, setSelectedId] = useState(null);
  const [hiddenCodes, setHiddenCodes] = useState(() => new Set());

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
          <EventDetails event={selectedEvent} />
          {courses.length > 0 && <CourseFilter courses={courses} hiddenCodes={hiddenCodes} onToggle={toggleCourse} />}
          <CalendarLegend />
        </aside>
      </div>
    </>
  );
}
