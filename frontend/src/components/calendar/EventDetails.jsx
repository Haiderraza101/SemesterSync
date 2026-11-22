import { examTermLabel } from "../../utils/examTerms.js";
import { taskTypeLabel } from "../../utils/taskTypes.js";
import AttendanceMarker from "../app/AttendanceMarker.jsx";
import Button from "../ui/Button.jsx";
import StatusBadge from "../ui/StatusBadge.jsx";
import LectureResources from "./LectureResources.jsx";
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

function LectureQuizzes({ quizzes, onToggleTask }) {
  if (quizzes.length === 0) return null;
  return (
    <div className="lecture-quizzes">
      <h3 className="lecture-section__title">Quiz in this lecture</h3>
      {quizzes.map((quiz) => (
        <div key={quiz.id} className="lecture-quiz">
          <div className="lecture-quiz__text">
            <span className="lecture-quiz__title">{quiz.title}</span>
            <StatusBadge status={quiz.done ? "completed" : "pending"} />
          </div>
          {onToggleTask && (
            <Button size="sm" onClick={() => onToggleTask(quiz.id)}>
              {quiz.done ? "Mark as pending" : "Mark as done"}
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

function ClassDetails({
  instance,
  variant,
  attendance,
  onToggleTask,
  onToggleCancel,
  onMarkAttendance,
  onAddMakeup,
  onRemoveMakeup,
}) {
  const isMakeup = instance.kind === "makeup";

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
      <LectureQuizzes quizzes={instance.quizzes || []} onToggleTask={onToggleTask} />
      <div className="event-details__actions">
        {!instance.cancelled && onMarkAttendance && (
          <div className="event-details__attendance">
            <span className="event-details__attendance-label">Attendance</span>
            <AttendanceMarker
              block
              size="lg"
              label={`Attendance for ${instance.course.name}`}
              value={attendance}
              onChange={(status) => onMarkAttendance(instance.id, status)}
            />
            <span className="event-details__attendance-hint">Every 3 lates count as one absence.</span>
          </div>
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
        <span className="event-details__kind">{`${examTermLabel(exam.term)} exam`}</span>
        <h2 className="event-details__title">{exam.course.name}</h2>
      </div>
      <dl className="detail-list">
        <DetailRow label="When" value={`${formatShortDate(exam.startsAt)}, ${formatTimeRange(exam.start, exam.end)}`} />
      </dl>
    </>
  );
}

function TaskDetails({ task }) {
  return (
    <>
      <div className="event-details__header">
        <span className="event-details__kind">{taskTypeLabel(task.type)}</span>
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
      <section className="event-details">
        <EmptyState variant="compact"
          icon="calendar"
          title="Select an event"
          description="Click a class, exam or deadline to see its details."
        />
      </section>
    );
  }

  const { type, variant } = event.extendedProps;

  return (
    <section className="event-details" aria-live="polite">
      {type === "class" && (
        <>
          <ClassDetails instance={event.extendedProps.instance} variant={variant} {...handlers} />
          <LectureResources key={event.id} instance={event.extendedProps.instance} />
        </>
      )}
      {type === "exam" && <ExamDetails exam={event.extendedProps.exam} />}
      {type === "task" && <TaskDetails task={event.extendedProps.task} />}
    </section>
  );
}
