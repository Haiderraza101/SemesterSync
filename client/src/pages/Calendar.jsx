import { useCallback, useMemo, useRef, useState } from "react";
import CalendarToolbar from "../components/calendar/CalendarToolbar.jsx";
import CalendarView from "../components/calendar/CalendarView.jsx";
import Button from "../components/ui/Button.jsx";
import { useSchedule } from "../hooks/useSchedule.js";
import { buildCalendarEvents } from "../utils/calendarEvents.js";
import { findClashes, getClashingSlotKeys } from "../utils/clashes.js";
import { getSelectedCourses } from "../utils/schedule.js";
import "../styles/pages/calendar.css";

const EMPTY_SET = new Set();

export default function Calendar() {
  const { schedule } = useSchedule();
  const calendarRef = useRef(null);
  const [range, setRange] = useState(null);
  const [title, setTitle] = useState("");
  const [view, setView] = useState(schedule.settings.defaultView);

  const courses = useMemo(() => getSelectedCourses(schedule), [schedule]);
  const clashingSlots = useMemo(() => getClashingSlotKeys(findClashes(courses)), [courses]);

  const events = useMemo(
    () => buildCalendarEvents({ schedule, courses, range, clashingSlots, hiddenCodes: EMPTY_SET }),
    [schedule, courses, range, clashingSlots]
  );

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
      <CalendarView
        ref={calendarRef}
        events={events}
        initialView={schedule.settings.defaultView}
        showSaturday={schedule.settings.showSaturday}
        onDatesSet={handleDatesSet}
      />
    </>
  );
}
