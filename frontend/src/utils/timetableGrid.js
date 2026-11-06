import { timeToMinutes } from "./date.js";

export function buildTimetableGrid(courses, days) {
  const slotMap = new Map();

  courses.forEach((course) => {
    course.slots.forEach((slot) => {
      const key = `${slot.start}-${slot.end}`;
      if (!slotMap.has(key)) slotMap.set(key, { start: slot.start, end: slot.end, cells: new Map() });
      const row = slotMap.get(key);
      const entries = row.cells.get(slot.day) || [];
      entries.push(course);
      row.cells.set(slot.day, entries);
    });
  });

  return [...slotMap.values()]
    .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start))
    .map((row) => ({
      key: `${row.start}-${row.end}`,
      start: row.start,
      end: row.end,
      cells: days.map((day) => ({ day, courses: row.cells.get(day) || [] })),
    }));
}
