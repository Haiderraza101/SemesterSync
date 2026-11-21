import { startOfWeek, weekdayIndexes } from "./calendarLayout.js";
import { SHORT_DAY_NAMES, addDays, formatDayMonth, startOfDay, timeToMinutes, toDateKey } from "./date.js";
import { getClassInstances, getSemesterRange } from "./schedule.js";

const FALLBACK_WEEKS_BEFORE = 4;
const FALLBACK_WEEKS_AFTER = 8;

function toHours(minutes) {
  return Math.round((minutes / 60) * 10) / 10;
}

function instanceMinutes(instance) {
  return timeToMinutes(instance.end) - timeToMinutes(instance.start);
}

function countDue(items, fromKey, toKey) {
  return items.filter((key) => key >= fromKey && key <= toKey).length;
}

function dueKeys(exams, tasks) {
  return [...exams.map((exam) => exam.date), ...tasks.map((task) => toDateKey(task.dueAt))];
}

export function getWeeklyWorkload(schedule, courses, exams, tasks, now) {
  const currentWeek = startOfWeek(now);
  const range = getSemesterRange(schedule) || {
    start: addDays(currentWeek, -FALLBACK_WEEKS_BEFORE * 7),
    end: addDays(currentWeek, FALLBACK_WEEKS_AFTER * 7 - 1),
  };
  const instances = getClassInstances(schedule, courses, range.start, range.end).filter((instance) => !instance.cancelled);
  const due = dueKeys(exams, tasks);
  const weeks = [];

  for (let monday = startOfWeek(range.start); monday <= range.end; monday = addDays(monday, 7)) {
    const fromKey = toDateKey(monday);
    const toKey = toDateKey(addDays(monday, 6));
    const minutes = instances
      .filter((instance) => instance.dateKey >= fromKey && instance.dateKey <= toKey)
      .reduce((total, instance) => total + instanceMinutes(instance), 0);
    weeks.push({
      key: fromKey,
      label: formatDayMonth(monday),
      tooltip: `Week of ${formatDayMonth(monday)}`,
      current: fromKey === toDateKey(currentWeek),
      hours: toHours(minutes),
      due: countDue(due, fromKey, toKey),
    });
  }

  return weeks;
}

export function getDailyWorkload(schedule, courses, exams, tasks, now) {
  const monday = startOfWeek(now);
  const weekdays = weekdayIndexes(schedule.settings.showSaturday);
  const days = [0, 7].flatMap((offset) => weekdays.map((weekday) => addDays(monday, offset + weekday - 1)));
  const instances = getClassInstances(schedule, courses, days[0], days[days.length - 1]).filter(
    (instance) => !instance.cancelled
  );
  const due = dueKeys(exams, tasks);
  const todayKey = toDateKey(startOfDay(now));

  return days.map((date) => {
    const key = toDateKey(date);
    const minutes = instances
      .filter((instance) => instance.dateKey === key)
      .reduce((total, instance) => total + instanceMinutes(instance), 0);
    return {
      key,
      label: `${SHORT_DAY_NAMES[date.getDay()]} ${date.getDate()}`,
      tooltip: `${SHORT_DAY_NAMES[date.getDay()]}, ${formatDayMonth(date)}`,
      current: key === todayKey,
      hours: toHours(minutes),
      due: countDue(due, key, key),
    };
  });
}

const COURSE_SLICES = 6;
const OTHER_COLOR = "#9ca3af";

export function getHoursByCourse(courses) {
  const items = courses
    .map((course) => ({
      code: course.code,
      name: course.name,
      color: course.color,
      value: toHours(course.slots.reduce((total, slot) => total + timeToMinutes(slot.end) - timeToMinutes(slot.start), 0)),
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
  if (items.length <= COURSE_SLICES + 1) return items;
  const rest = items.slice(COURSE_SLICES);
  return [
    ...items.slice(0, COURSE_SLICES),
    {
      code: "other",
      name: `${rest.length} other courses`,
      color: OTHER_COLOR,
      value: toHours(rest.reduce((total, item) => total + item.value * 60, 0)),
    },
  ];
}

export function getOverallAttendance(summary) {
  const held = summary.reduce((total, item) => total + item.held, 0);
  const attended = summary.reduce((total, item) => total + item.attended, 0);
  return { held, attended, percentage: held === 0 ? null : Math.round((attended / held) * 100) };
}
