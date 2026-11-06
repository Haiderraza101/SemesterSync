import { EDITABLE_SCHEDULE_FIELDS } from "../models/Schedule.js";

const ARRAY_FIELDS = ["selections", "cancelled", "makeups", "tasks"];
const OBJECT_FIELDS = ["dateSheets", "attendance", "settings"];

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function scheduleValidator(body) {
  const errors = {};
  const keys = Object.keys(body);

  if (keys.length === 0) errors.schedule = "Provide at least one field to update.";

  keys
    .filter((key) => !EDITABLE_SCHEDULE_FIELDS.includes(key))
    .forEach((key) => {
      errors[key] = `${key} cannot be updated.`;
    });

  ARRAY_FIELDS.forEach((field) => {
    if (body[field] !== undefined && !Array.isArray(body[field])) errors[field] = `${field} must be a list.`;
  });

  OBJECT_FIELDS.forEach((field) => {
    if (body[field] !== undefined && !isPlainObject(body[field])) errors[field] = `${field} must be an object.`;
  });

  if (body.catalog !== undefined && body.catalog !== null && !Array.isArray(body.catalog?.courses)) {
    errors.catalog = "catalog must include a list of courses.";
  }

  return errors;
}
