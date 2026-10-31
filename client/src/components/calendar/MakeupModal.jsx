import { useState } from "react";
import Button from "../ui/Button.jsx";
import Modal from "../ui/Modal.jsx";
import TextField from "../ui/TextField.jsx";
import { SEMESTER } from "../../config.js";
import { addDays, parseDateKey, timeToMinutes, toDateKey } from "../../utils/date.js";

function createInitialValues(instance) {
  return {
    date: toDateKey(addDays(parseDateKey(instance.dateKey), 1)),
    start: instance.start,
    end: instance.end,
    room: instance.room,
  };
}

function validate(values) {
  const errors = {};
  if (!values.date) errors.date = "Choose a date.";
  else if (values.date < SEMESTER.start || values.date > SEMESTER.end) errors.date = "Pick a date within the semester.";
  if (!values.start) errors.start = "Choose a start time.";
  if (!values.end) errors.end = "Choose an end time.";
  else if (values.start && timeToMinutes(values.end) <= timeToMinutes(values.start)) errors.end = "End time must be after the start time.";
  if (!values.room.trim()) errors.room = "Enter a room.";
  return errors;
}

function MakeupForm({ instance, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => createInitialValues(instance));
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validate(values);
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
    <form className="modal__form" onSubmit={handleSubmit} noValidate>
      <TextField label="Date" name="date" type="date" min={SEMESTER.start} max={SEMESTER.end} value={values.date} onChange={handleChange} error={errors.date} />
      <div className="form-row">
        <TextField label="Start time" name="start" type="time" value={values.start} onChange={handleChange} error={errors.start} />
        <TextField label="End time" name="end" type="time" value={values.end} onChange={handleChange} error={errors.end} />
      </div>
      <TextField label="Room" name="room" value={values.room} onChange={handleChange} error={errors.room} />
      <div className="modal__form-actions">
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary">
          Add makeup class
        </Button>
      </div>
    </form>
  );
}

export default function MakeupModal({ instance, onSubmit, onClose }) {
  return (
    <Modal open={Boolean(instance)} title="Add makeup class" description={instance ? instance.course.name : undefined} onClose={onClose}>
      {instance && <MakeupForm key={instance.id} instance={instance} onSubmit={onSubmit} onCancel={onClose} />}
    </Modal>
  );
}
