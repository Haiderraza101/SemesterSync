import Button from "../ui/Button.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import { formatShortDate, formatTime, formatTimeRange, parseDateKey, toTimeKey } from "../../utils/date.js";

function DetailRow({ label, value }) {
  return (
    <div className="detail-list__row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

const VARIANT_STATUS = {
  class: "Scheduled",
  clash: "Clashes with another class",
  cancelled: "Cancelled this week",
  makeup: "Makeup class",
};

function ClassDetails({
  instance,
  variant,
  attendance,
  onToggleCancel,
  onMarkAttendance,
  onAddMakeup,
  onRemoveMakeup,
}) {
  const isMakeup = instance.kind === "makeup";
  const present = attendance === "present";

  return (
    <>
      <div className="event-details__header">
        <span className="event-details__kind">{isMakeup ? "Makeup class" : "Weekly class"}</span>
        <h2 className="event-details__title">{instance.course.name}</h2>
      </div>
      <dl className="detail-list">
        <DetailRow
          label="When"
          value={`${formatShortDate(parseDateKey(instance.dateKey))}, ${formatTimeRange(instance.start, instance.end)}`}
        />
        <DetailRow label="Room" value={instance.room} />
        <DetailRow label="Section" value={instance.course.section} />
        <DetailRow label="Status" value={VARIANT_STATUS[variant]} />
      </dl>
      <div className="event-details__actions">
        {!instance.cancelled && onMarkAttendance && (
          <Button
            variant={present ? "secondary" : "primary"}
            block
            onClick={() => onMarkAttendance(instance.id, present ? null : "present")}
          >
            {present ? "Marked present · Undo" : "Mark attendance"}
          </Button>
        )}
        {!isMakeup && onToggleCancel && (
          <Button block onClick={() => onToggleCancel(instance.id)}>
            {instance.cancelled ? "Restore this class" : "Cancel this class"}
          </Button>
        )}
        {!isMakeup && onAddMakeup && (
          <Button block onClick={() => onAddMakeup(instance)}>
            Add makeup class
          </Button>
        )}
        {isMakeup && onRemoveMakeup && (
          <Button variant="danger" block onClick={() => onRemoveMakeup(instance.id)}>
            Remove makeup class
          </Button>
        )}
      </div>
    </>
  );
}

function ExamDetails({ exam }) {
  return (
    <>
      <div className="event-details__header">
        <span className="event-details__kind">{exam.term === "midterm" ? "Midterm exam" : "Final exam"}</span>
        <h2 className="event-details__title">{exam.course.name}</h2>
      </div>
      <dl className="detail-list">
        <DetailRow label="When" value={`${formatShortDate(exam.startsAt)}, ${formatTimeRange(exam.start, exam.end)}`} />
        <DetailRow label="Venue" value={exam.venue} />
      </dl>
    </>
  );
}

function TaskDetails({ task }) {
  return (
    <>
      <div className="event-details__header">
        <span className="event-details__kind">{task.type === "quiz" ? "Quiz" : "Assignment"}</span>
        <h2 className="event-details__title">{task.title}</h2>
      </div>
      <dl className="detail-list">
        <DetailRow label="Course" value={task.course?.name || "General"} />
        <DetailRow label="Due" value={`${formatShortDate(task.dueAt)}, ${formatTime(toTimeKey(task.dueAt))}`} />
      </dl>
    </>
  );
}

export default function EventDetails({ event, ...handlers }) {
  if (!event) {
    return (
      <section className="panel event-details">
        <EmptyState
          icon="calendar"
          title="Select an event"
          description="Click a class, exam or deadline to see its details."
        />
      </section>
    );
  }

  const { type, variant } = event.extendedProps;

  return (
    <section className="panel event-details" aria-live="polite">
      {type === "class" && <ClassDetails instance={event.extendedProps.instance} variant={variant} {...handlers} />}
      {type === "exam" && <ExamDetails exam={event.extendedProps.exam} />}
      {type === "task" && <TaskDetails task={event.extendedProps.task} />}
    </section>
  );
}
