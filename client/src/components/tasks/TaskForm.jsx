import { useMemo } from "react";
import Button from "../ui/Button.jsx";
import Panel from "../ui/Panel.jsx";
import SelectField from "../ui/SelectField.jsx";
import TextField from "../ui/TextField.jsx";
import { useForm } from "../../hooks/useForm.js";
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
    }),
    [courses]
  );
  const { values, errors, handleChange, validate, reset } = useForm(initialValues, validateTask);

  const courseOptions = courses.map((course) => ({ value: course.code, label: course.name }));

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;
    onSubmit({
      id: `task-${Date.now()}`,
      title: values.title.trim(),
      courseCode: values.courseCode,
      type: values.type,
      due: `${values.date}T${values.time}`,
      reminder: values.reminder,
      done: false,
    });
    reset();
  };

  return (
    <Panel as="div" title="New item">
      <form className="modal__form" onSubmit={handleSubmit} noValidate>
        <TextField
          label="Title"
          name="title"
          placeholder="Assignment 5"
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
        <div className="form-row">
          <TextField
            label="Due date"
            name="date"
            type="date"
            value={values.date}
            onChange={handleChange}
            error={errors.date}
          />
          <TextField
            label="Time"
            name="time"
            type="time"
            value={values.time}
            onChange={handleChange}
            error={errors.time}
          />
        </div>
        <SelectField
          label="Reminder"
          name="reminder"
          options={TASK_REMINDER_OPTIONS}
          value={values.reminder}
          onChange={handleChange}
        />
        <Button type="submit" variant="primary" block>
          Add item
        </Button>
      </form>
    </Panel>
  );
}
