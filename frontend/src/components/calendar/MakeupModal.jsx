import { useState } from "react";
import DateField from "../ui/DateField.jsx";
import Modal from "../ui/Modal.jsx";
import ModalSubmitButton from "../ui/ModalSubmitButton.jsx";
import TextField from "../ui/TextField.jsx";
import { useSchedule } from "../../hooks/useSchedule.js";
import { getSemester } from "../../utils/schedule.js";
import { addDays, parseDateKey, timeToMinutes, toDateKey } from "../../utils/date.js";

function createInitialValues(instance) {
  return {
    date: toDateKey(addDays(parseDateKey(instance.dateKey), 1)),
    start: instance.start,
    end: instance.end,
    room: instance.room,
  };
}

function isOutsideSemester(date, semester) {
  return (semester.start && date < semester.start) || (semester.end && date > semester.end);
}

function validate(values, semester) {
  const errors = {};
  if (!values.date) errors.date = "Choose a date.";
  else if (isOutsideSemester(values.date, semester)) errors.date = "Pick a date within the semester.";
  if (!values.start) errors.start = "Choose a start time.";
  if (!values.end) errors.end = "Choose an end time.";
  else if (values.start && timeToMinutes(values.end) <= timeToMinutes(values.start))
    errors.end = "End time must be after the start time.";
  if (!values.room.trim()) errors.room = "Enter a room.";
  return errors;
}

const FORM_ID = "makeup-form";

function MakeupForm({ instance, onSubmit }) {
  const { schedule } = useSchedule();
  const semester = getSemester(schedule);
  const [values, setValues] = useState(() => createInitialValues(instance));
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validate(values, semester);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit({
      id: `makeup_${instance.course.code}_${Date.now()}`,
      code: instance.course.code,
      date: values.date,
      start: values.start,
      end: values.end,
      room: values.room.trim(),
    });
  };

  return (
    <form id={FORM_ID} className="modal__form form-stack" onSubmit={handleSubmit} noValidate>
      {instance.course.name && <p className="text-muted">Reschedule {instance.course.name}.</p>}
      <DateField
        label="Date"
        name="date"
        min={semester.start || undefined}
        max={semester.end || undefined}
        value={values.date}
        onChange={handleChange}
        error={errors.date}
      />
      <div className="form-row">
        <TextField
          label="Start time"
          name="start"
          type="time"
          value={values.start}
          onChange={handleChange}
          error={errors.start}
        />
        <TextField
          label="End time"
          name="end"
          type="time"
          value={values.end}
          onChange={handleChange}
          error={errors.end}
        />
      </div>
      <TextField label="Room" name="room" value={values.room} onChange={handleChange} error={errors.room} />
    </form>
  );
}

export default function MakeupModal({ instance, onSubmit, onClose }) {
  return (
    <Modal
      open={Boolean(instance)}
      parent="Calendar"
      title="Add makeup class"
      onClose={onClose}
      footer={<ModalSubmitButton label="Add makeup class" formId={FORM_ID} />}
    >
      {instance && <MakeupForm key={instance.id} instance={instance} onSubmit={onSubmit} />}
    </Modal>
  );
}
