export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const SHORT_DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function pad(value) {
  return String(value).padStart(2, "0");
}

export function toDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDateKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function combineDateTime(dateKey, time) {
  const date = parseDateKey(dateKey);
  const [hours, minutes] = time.split(":").map(Number);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export function toTimeKey(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function startOfDay(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function addDays(date, amount) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

export function differenceInDays(later, earlier) {
  return Math.round((startOfDay(later) - startOfDay(earlier)) / MS_PER_DAY);
}

export function isSameDay(a, b) {
  return toDateKey(a) === toDateKey(b);
}

export function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function formatTime(time) {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${pad(minutes)} ${period}`;
}

export function formatTimeRange(start, end) {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

export function formatShortTimeRange(start, end) {
  const strip = (time) => formatTime(time).replace(/ (AM|PM)$/, "");
  return `${strip(start)} – ${strip(end)}`;
}

const longDateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

const dayMonthFormatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

export function formatLongDate(date) {
  return longDateFormatter.format(date);
}

export function formatShortDate(date) {
  return shortDateFormatter.format(date);
}

export function formatDayMonth(date) {
  return dayMonthFormatter.format(date);
}

export function getGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
