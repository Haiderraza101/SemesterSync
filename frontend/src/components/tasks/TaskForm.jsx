import { useEffect, useMemo } from "react";
import Button from "../ui/Button.jsx";
import DateField from "../ui/DateField.jsx";
import Panel from "../ui/Panel.jsx";
import SelectField from "../ui/SelectField.jsx";
import TextField from "../ui/TextField.jsx";
import TimeField from "../ui/TimeField.jsx";
import { useForm } from "../../hooks/useForm.js";
import { useSchedule } from "../../hooks/useSchedule.js";
import { formatShortDate, formatTimeRange, parseDateKey } from "../../utils/date.js";
import { getUpcomingLectures } from "../../utils/schedule.js";
import { TASK_REMINDER_OPTIONS } from "../../utils/reminders.js";
import { validateTask } from "../../utils/validation.js";

const TYPE_OPTIONS = [
  { value: "assignment", label: "Assignment" },
  { value: "quiz", label: "Quiz" },
];

export default function TaskForm({ courses, onSubmit }) {
  const initialValues = useMemo(
    () => ({
      title: "",
      courseCode: courses[0]?.code || "",
      type: "assignment",
      date: "",
      time: "23:59",
      reminder: "1d",
      lectureId: "",
    }),
    [courses]
  );
  const { schedule } = useSchedule();
  const { values, errors, setValues, handleChange, validate, reset } = useForm(initialValues, (formValues) =>
    validateTask({ ...formValues, requiresLecture: lectures.length > 0 })
  );

  const courseOptions = courses.map((course) => ({ value: course.code, label: course.name }));
  const selectedCourse = courses.find((course) => course.code === values.courseCode);
  const isQuiz = values.type === "quiz";

  const lectures = useMemo(
    () => (isQuiz && selectedCourse ? getUpcomingLectures(schedule, selectedCourse) : []),
    [isQuiz, selectedCourse, schedule]
  );

  const lectureOptions = lectures.map((lecture) => ({
    value: lecture.id,
    label: `${formatShortDate(parseDateKey(lecture.dateKey))} · ${formatTimeRange(lecture.start, lecture.end)} · ${lecture.room}${lecture.kind === "makeup" ? " (makeup)" : ""}`,
  }));

  const chosenLecture = lectures.find((lecture) => lecture.id === values.lectureId);

  useEffect(() => {
    if (values.lectureId && !chosenLecture) setValues((current) => ({ ...current, lectureId: "" }));
  }, [values.lectureId, chosenLecture, setValues]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;
    const linked = isQuiz && chosenLecture;
    onSubmit({
      id: `task-${Date.now()}`,
      title: values.title.trim(),
      courseCode: values.courseCode,
      type: values.type,
      due: linked ? `${chosenLecture.dateKey}T${chosenLecture.start}` : `${values.date}T${values.time}`,
      reminder: values.reminder,
      done: false,
      ...(linked && { lectureId: chosenLecture.id }),
    });
    reset();
  };

  return (
    <Panel as="div" title="New item">
      <form className="form-stack" onSubmit={handleSubmit} noValidate>
        <TextField
          label="Title"
          name="title"
          placeholder={isQuiz ? "Quiz 3" : "Assignment 5"}
          value={values.title}
          onChange={handleChange}
          error={errors.title}
        />
        <SelectField
          label="Course"
          name="courseCode"
          options={courseOptions}
          value={values.courseCode}
          onChange={handleChange}
          error={errors.courseCode}
        />
        <fieldset className="radio-group">
          <legend className="field__label">Type</legend>
          <div className="radio-group__options">
            {TYPE_OPTIONS.map((option) => (
              <label key={option.value} className="checkbox">
                <input
                  type="radio"
                  className="radio__input"
                  name="type"
                  value={option.value}
                  checked={values.type === option.value}
                  onChange={handleChange}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>
        {isQuiz && lectures.length > 0 && (
          <SelectField
            label="Lecture"
            name="lectureId"
            placeholder="Choose the lecture"
            options={lectureOptions}
            value={values.lectureId}
            onChange={handleChange}
            error={errors.lectureId}
            hint="The quiz is added to that lecture on your calendar."
          />
        )}
        {isQuiz && lectures.length === 0 && selectedCourse && (
          <p className="field__hint">No upcoming lectures for this course, so set the date and time yourself.</p>
        )}
        {!(isQuiz && lectures.length > 0) && (
        <div className="form-row">
          <DateField
            label="Due date"
            name="date"
            value={values.date}
            onChange={handleChange}
            error={errors.date}
          />
          <TimeField
            label="Time"
            name="time"
            value={values.time}
            onChange={handleChange}
            error={errors.time}
          />
        </div>
        )}
        <SelectField
          label="Reminder"
          name="reminder"
          options={TASK_REMINDER_OPTIONS}
          value={values.reminder}
          onChange={handleChange}
        />
        <Button type="submit" variant="primary" block>
          {isQuiz ? "Add quiz" : "Add assignment"}
        </Button>
      </form>
    </Panel>
  );
}
