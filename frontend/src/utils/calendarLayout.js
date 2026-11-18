import { addDays, startOfDay, toDateKey } from "./date.js";

export const VIEW_KEYS = { day: "timeGridDay", week: "timeGridWeek", month: "dayGridMonth" };
export const DEFAULT_START_HOUR = 8;
export const DEFAULT_END_HOUR = 18;
export const HOUR_HEIGHT = 100;
export const QUARTER_HEIGHT = HOUR_HEIGHT / 4;
export const MIN_CARD_HEIGHT = 40;
export const COLUMN_MIN_WIDTH = 120;

const UK_DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const UK_DAY = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
const MONTH = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });

export function viewFromSetting(setting) {
  return Object.entries(VIEW_KEYS).find(([, key]) => key === setting)?.[0] || "week";
}

export function startOfWeek(date) {
  const day = startOfDay(date);
  return addDays(day, -((day.getDay() + 6) % 7));
}

export function weekdayIndexes(showSaturday) {
  return showSaturday ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5];
}

export function getVisibleDays(view, date, showSaturday) {
  if (view === "day") return [startOfDay(date)];
  const monday = startOfWeek(date);
  return weekdayIndexes(showSaturday).map((weekday) => addDays(monday, weekday - 1));
}

export function getMonthWeeks(date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const weeks = [];
  for (let monday = startOfWeek(first); monday <= last; monday = addDays(monday, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, index) => addDays(monday, index)));
  }
  return weeks;
}

export function getRange(view, date, showSaturday) {
  if (view === "month") {
    const weeks = getMonthWeeks(date);
    return { start: weeks[0][0], end: addDays(weeks[weeks.length - 1][6], 1) };
  }
  const days = getVisibleDays(view, date, showSaturday);
  return { start: days[0], end: addDays(days[days.length - 1], 1) };
}

export function shiftDate(view, date, direction) {
  if (view === "month") return new Date(date.getFullYear(), date.getMonth() + direction, 1);
  return addDays(date, direction * (view === "day" ? 1 : 7));
}

export function formatTitle(view, date, showSaturday) {
  if (view === "day") return UK_DAY.format(date);
  if (view === "month") return MONTH.format(date);
  const days = getVisibleDays("week", date, showSaturday);
  return `${UK_DATE.format(days[0])} – ${UK_DATE.format(days[days.length - 1])}`;
}

export function minutesOfDay(date) {
  return date.getHours() * 60 + date.getMinutes();
}

export function groupByDay(items) {
  const groups = new Map();
  items.forEach((item) => {
    const key = toDateKey(item.start);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });
  return groups;
}

export function hourBounds(items) {
  if (items.length === 0) return { startHour: DEFAULT_START_HOUR, endHour: DEFAULT_END_HOUR };
  const earliest = Math.min(...items.map((item) => minutesOfDay(item.start)));
  const latest = Math.max(...items.map((item) => minutesOfDay(item.end) || 24 * 60));
  return {
    startHour: Math.min(DEFAULT_START_HOUR, Math.floor(earliest / 60)),
    endHour: Math.min(24, Math.max(DEFAULT_END_HOUR, Math.ceil(latest / 60))),
  };
}

function overlaps(a, b) {
  return a.start < b.end && b.start < a.end;
}

function assignColumns(items) {
  const columns = [];
  [...items]
    .sort((a, b) => a.start - b.start || b.end - a.end)
    .forEach((item) => {
      const column = columns.find((existing) => !overlaps(existing[existing.length - 1], item));
      if (column) column.push(item);
      else columns.push([item]);
    });
  return columns;
}

export function overlapCount(items) {
  return Math.max(1, assignColumns(items).length);
}

export function layoutOverlaps(items) {
  const columns = assignColumns(items);
  const columnOf = new Map();
  columns.forEach((column, index) => column.forEach((item) => columnOf.set(item.id, index)));

  const clusters = [];
  [...items]
    .sort((a, b) => a.start - b.start)
    .forEach((item) => {
      const cluster = clusters.find((group) => group.some((other) => overlaps(other, item)));
      if (cluster) cluster.push(item);
      else clusters.push([item]);
    });

  const layout = new Map();
  clusters.forEach((cluster) => {
    const total = Math.max(...cluster.map((item) => columnOf.get(item.id))) + 1;
    cluster.forEach((item) => layout.set(item.id, { column: columnOf.get(item.id), total }));
  });
  return layout;
}

export function cardPosition(item, startHour) {
  const top = ((minutesOfDay(item.start) - startHour * 60) * HOUR_HEIGHT) / 60;
  const duration = Math.max(15, (item.end - item.start) / 60000);
  return { top, height: Math.max(MIN_CARD_HEIGHT, (duration * HOUR_HEIGHT) / 60) };
}

export function hourLabel(hour) {
  const suffix = hour >= 12 && hour < 24 ? "PM" : "AM";
  return `${hour % 12 || 12} ${suffix}`;
}
