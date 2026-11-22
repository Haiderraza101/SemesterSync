import { useMemo, useState } from "react";
import Button from "../ui/Button.jsx";
import DateField from "../ui/DateField.jsx";
import Icon from "../ui/Icon.jsx";
import Notice from "../ui/Notice.jsx";
import SelectField from "../ui/SelectField.jsx";
import TextField from "../ui/TextField.jsx";
import TimeField from "../ui/TimeField.jsx";
import { useSchedule } from "../../hooks/useSchedule.js";
import { useToast } from "../../hooks/useToast.js";
import { cx } from "../../utils/cx.js";
import { DAY_NAMES, formatDayMonth, formatTime, minutesToTime, parseDateKey, timeToMinutes } from "../../utils/date.js";
import { getClassInstances, getSemester } from "../../utils/schedule.js";
import { TASK_TYPES } from "../../utils/taskTypes.js";

const DEFAULT_CLASS_MINUTES = 80;

const KINDS = [
  { value: "makeup", label: "Makeup class", hint: "An extra or rescheduled class", icon: "plus" },
  { value: "assignment", label: "Assignment", hint: "Something to submit", icon: "tasks" },
  { value: "quiz", label: "Quiz", hint: "Taken during a lecture", icon: "clock" },
  { value: "evaluation", label: "Evaluation", hint: "Viva, demo or presentation", icon: "shield-check" },
];

function classesAt(schedule, courses, dateKey, time) {
  const day = parseDateKey(dateKey);
  const minute = timeToMinutes(time);
  return getClassInstances(schedule, courses, day, day).filter(
    (instance) =>
      !instance.cancelled && timeToMinutes(instance.start) <= minute && minute < timeToMinutes(instance.end)
  );
}

function usualMinutes(course) {
  const slot = course?.slots?.[0];
  return slot ? timeToMinutes(slot.end) - timeToMinutes(slot.start) : DEFAULT_CLASS_MINUTES;
}

function initialValues(slot, courses, schedule) {
  const running = classesAt(schedule, courses, slot.dateKey, slot.time)[0];
  const course = running?.course || courses[0];
  return {
    kind: "assignment",
    courseCode: course?.code || "",
    title: "",
    date: slot.dateKey,
    time: slot.time,
    end: minutesToTime(timeToMinutes(slot.time) + usualMinutes(course)),
    room: course?.room || "",
  };
}

function validate(values, semester) {
  const errors = {};
  if (!values.courseCode) errors.courseCode = "Choose a course.";
  if (!values.date) errors.date = "Choose a date.";
  if (!values.time) errors.time = "Choose a time.";
  if (values.kind === "makeup") {
    if (values.date && ((semester.start && values.date < semester.start) || (semester.end && values.date > semester.end))) {
      errors.date = "Pick a date within the semester.";
    }
    if (!values.end) errors.end = "Choose an end time.";
    else if (values.time && timeToMinutes(values.end) <= timeToMinutes(values.time)) errors.end = "End time must be after the start.";
    if (!values.room.trim()) errors.room = "Enter a room.";
  } else {
    if (!values.title.trim()) errors.title = "Enter a title.";
    else if (values.title.trim().length > 120) errors.title = "Use 120 characters or fewer.";
  }
  return errors;
}

export default function AddEventPanel({ slot, courses, onDone, onCancel }) {
  const { schedule, addMakeup, addTask } = useSchedule();
  const { notify } = useToast();
  const semester = getSemester(schedule);
  const [values, setValues] = useState(() => initialValues(slot, courses, schedule));
  const [errors, setErrors] = useState({});

  const course = courses.find((item) => item.code === values.courseCode);
  const isMakeup = values.kind === "makeup";
  const kind = KINDS.find((item) => item.value === values.kind);
  const typeInfo = TASK_TYPES.find((item) => item.value === values.kind);
  const courseOptions = courses.map((item) => ({ value: item.code, label: item.name }));
  const slotDate = parseDateKey(slot.dateKey);

  const lecture = useMemo(() => {
    if (values.kind !== "quiz" || !course || !values.date || !values.time) return null;
    return classesAt(schedule, [course], values.date, values.time)[0] || null;
  }, [values.kind, values.date, values.time, course, schedule]);

  const update = (changes) => {
    setValues((current) => ({ ...current, ...changes }));
    setErrors((current) => {
      const next = { ...current };
      Object.keys(changes).forEach((key) => delete next[key]);
      return next;
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === "courseCode") {
      const nextCourse = courses.find((item) => item.code === value);
      update({
        courseCode: value,
        room: nextCourse?.room || values.room,
        end: minutesToTime(timeToMinutes(values.time) + usualMinutes(nextCourse)),
      });
      return;
    }
    if (name === "time" && isMakeup) {
      update({ time: value, end: minutesToTime(timeToMinutes(value) + usualMinutes(course)) });
      return;
    }
    update({ [name]: value });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validate(values, semester);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (isMakeup) {
      addMakeup({
        id: `makeup_${values.courseCode}_${Date.now()}`,
        code: values.courseCode,
        date: values.date,
        start: values.time,
        end: values.end,
        room: values.room.trim(),
      });
      notify(`Makeup class for ${course.name} added.`);
    } else {
      addTask({
        id: `task-${Date.now()}`,
        title: values.title.trim(),
        courseCode: values.courseCode,
        type: values.kind,
        due: lecture ? `${lecture.dateKey}T${lecture.start}` : `${values.date}T${values.time}`,
        done: false,
        ...(lecture && { lectureId: lecture.id }),
      });
      notify(`${values.title.trim()} added to your calendar.`);
    }
    onDone();
  };

  if (courses.length === 0) {
    return (
      <div className="add-event">
        <Notice variant="info" title="Add your courses first">
          Select your sections on the timetable page, then you can add classes and deadlines here.
        </Notice>
        <Button to="/app/timetable" variant="primary" block>
          Go to timetable
        </Button>
      </div>
    );
  }

  return (
    <form className="add-event" onSubmit={handleSubmit} noValidate>
      <div className="add-event__slot">
        <span className="add-event__slot-icon" aria-hidden="true">
          <Icon name="calendar" size={18} strokeWidth={2} />
        </span>
        <div>
          <p className="add-event__slot-day">
            {DAY_NAMES[slotDate.getDay()]}, {formatDayMonth(slotDate)}
          </p>
          <p className="add-event__slot-time">Selected slot · {formatTime(slot.time)}</p>
        </div>
      </div>

      <fieldset className="add-event__kinds">
        <legend className="add-event__legend">What are you adding?</legend>
        <div className="add-event__kind-grid">
          {KINDS.map((item) => {
            const active = item.value === values.kind;
            return (
              <button
                key={item.value}
                type="button"
                aria-pressed={active}
                className={cx("add-event__kind", `add-event__kind--${item.value}`, active && "add-event__kind--active")}
                onClick={() => update({ kind: item.value })}
              >
                <span className="add-event__kind-icon" aria-hidden="true">
                  <Icon name={item.icon} size={16} strokeWidth={2} />
                </span>
                <span className="add-event__kind-text">
                  <span className="add-event__kind-label">{item.label}</span>
                  <span className="add-event__kind-hint">{item.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="add-event__fields">
        <SelectField
          label="Course"
          name="courseCode"
          options={courseOptions}
          value={values.courseCode}
          onChange={handleChange}
          error={errors.courseCode}
        />
        {!isMakeup && (
          <TextField
            label="Title"
            name="title"
            placeholder={typeInfo?.placeholder}
            value={values.title}
            onChange={handleChange}
            error={errors.title}
            maxLength={120}
          />
        )}
        <DateField
          label={isMakeup ? "Date" : "Due date"}
          name="date"
          value={values.date}
          min={isMakeup ? semester.start || undefined : undefined}
          max={isMakeup ? semester.end || undefined : undefined}
          onChange={handleChange}
          error={errors.date}
        />
        <div className="form-row">
          <TimeField
            label={isMakeup ? "Start time" : "Time"}
            name="time"
            value={values.time}
            onChange={handleChange}
            error={errors.time}
          />
          {isMakeup && <TimeField label="End time" name="end" value={values.end} onChange={handleChange} error={errors.end} />}
        </div>
        {isMakeup && <TextField label="Room" name="room" value={values.room} onChange={handleChange} error={errors.room} />}
        {values.kind === "quiz" &&
          (lecture ? (
            <Notice variant="success" title="Linked to a lecture">
              This quiz will show on the {lecture.course.name} lecture at {formatTime(lecture.start)}.
            </Notice>
          ) : (
            <p className="add-event__note">
              No {course?.name || "class"} lecture at this time, so the quiz is added as its own calendar item.
            </p>
          ))}
      </div>

      <div className="add-event__footer">
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary">
          Add {kind.label.toLowerCase()}
        </Button>
      </div>
    </form>
  );
}
