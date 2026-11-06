import { forwardRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";

const PLUGINS = [timeGridPlugin, dayGridPlugin, interactionPlugin];

function renderEventContent(arg) {
  const { event, timeText } = arg;
  return (
    <div className="ss-event__content">
      <span className="ss-event__title">{event.title}</span>
      {timeText && <span className="ss-event__time">{timeText}</span>}
    </div>
  );
}

const CalendarView = forwardRef(function CalendarView(
  { events, initialView, showSaturday, onDatesSet, onEventClick, renderEvent },
  ref
) {
  return (
    <div className="calendar-surface">
      <FullCalendar
        ref={ref}
        plugins={PLUGINS}
        initialView={initialView}
        headerToolbar={false}
        firstDay={1}
        hiddenDays={showSaturday ? [0] : [0, 6]}
        allDaySlot={false}
        slotMinTime="08:00:00"
        slotMaxTime="18:00:00"
        slotDuration="00:30:00"
        slotLabelInterval="01:00"
        expandRows
        height="auto"
        nowIndicator
        slotEventOverlap={false}
        dayMaxEvents={3}
        eventDisplay="block"
        dayHeaderFormat={{ weekday: "short", day: "numeric" }}
        slotLabelFormat={{ hour: "numeric", meridiem: "short" }}
        eventTimeFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }}
        events={events}
        datesSet={onDatesSet}
        eventClick={onEventClick}
        eventContent={renderEvent || renderEventContent}
      />
    </div>
  );
});

export default CalendarView;
