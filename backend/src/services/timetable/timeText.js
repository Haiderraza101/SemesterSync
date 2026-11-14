const TIME_RANGE_PATTERN =
  /(\d{1,2})\s*[:.]\s*(\d{2})\s*(am|pm)?\s*(?:-|–|—|to)\s*(\d{1,2})\s*[:.]\s*(\d{2})\s*(am|pm)?/i;
const TIME_ONLY_PATTERN = new RegExp(`^\\s*${TIME_RANGE_PATTERN.source}\\s*$`, "i");
const CLOCK_PATTERN = /^\s*(\d{1,2})\s*[:.]\s*(\d{2})(?:\s*[:.]\s*\d{2})?\s*(am|pm)?\s*$/i;
const DAY_FRACTION_PATTERN = /^\s*0?\.\d+\s*$/;
const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const LATEST_MORNING_HOUR = 7;
const FIVE_MINUTES = 5;
const APPROXIMATE_SNAP_MINUTES = 10;
const MINUTES_PER_DAY = 24 * 60;

function toMinutes(hours, minutes, meridiem) {
  let hour = Number(hours);
  const marker = meridiem?.toLowerCase();
  if (marker === "pm" && hour < 12) hour += 12;
  else if (marker === "am" && hour === 12) hour = 0;
  else if (!marker && hour >= 1 && hour <= LATEST_MORNING_HOUR) hour += 12;
  return hour * 60 + Number(minutes);
}

export function dayFromText(text) {
  const normalized = String(text).toLowerCase().replace(/[^a-z]/g, "");
  if (normalized.length < 3) return null;
  const index = DAYS.findIndex((day) => day === normalized || (normalized.length <= 4 && day.startsWith(normalized)));
  return index === -1 ? null : index;
}

export function parseClockTime(text) {
  const value = String(text);
  if (DAY_FRACTION_PATTERN.test(value)) return Math.round(Number(value) * MINUTES_PER_DAY);
  const match = CLOCK_PATTERN.exec(value);
  if (!match) return null;
  return toMinutes(match[1], match[2], match[3]);
}

export function formatMinutes(total) {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function roundToFiveMinutes(total) {
  return Math.round(total / FIVE_MINUTES) * FIVE_MINUTES;
}

export function isTimeOnly(text) {
  return TIME_ONLY_PATTERN.test(text);
}

export function extractTimeRange(text) {
  const match = TIME_RANGE_PATTERN.exec(text);
  if (!match) return { range: null, rest: text };

  const [, startHour, startMinute, startMeridiem, endHour, endMinute, endMeridiem] = match;
  const inheritsMeridiem = !startMeridiem && endMeridiem && Number(startHour) <= Number(endHour);
  let start = toMinutes(startHour, startMinute, inheritsMeridiem ? endMeridiem : startMeridiem);
  let end = toMinutes(endHour, endMinute, endMeridiem);
  if (end <= start && end + 12 * 60 > start) end += 12 * 60;
  if (end <= start) [start, end] = [end, start];

  const rest = `${text.slice(0, match.index)} ${text.slice(match.index + match[0].length)}`.trim();
  return { range: { start, end }, rest };
}

export function createColumnClock(slots) {
  const anchors = slots
    .flatMap((slot) => [
      { col: slot.c0, minutes: slot.start },
      { col: slot.c1 + 1, minutes: slot.end },
    ])
    .sort((a, b) => a.col - b.col);
  const boundaries = slots.flatMap((slot) => [slot.start, slot.end]);
  const exactGrid = slots.every((slot) => Number.isInteger((slot.end - slot.start) / (slot.c1 - slot.c0 + 1)));
  const snapTolerance = exactGrid ? 0 : APPROXIMATE_SNAP_MINUTES;

  function snap(minutes) {
    const nearest = boundaries.reduce(
      (best, boundary) => (Math.abs(boundary - minutes) < Math.abs(best - minutes) ? boundary : best),
      boundaries[0]
    );
    return Math.abs(nearest - minutes) <= snapTolerance ? nearest : roundToFiveMinutes(minutes);
  }

  function interpolate(left, right, col) {
    if (right.col === left.col) return left.minutes;
    return left.minutes + ((col - left.col) * (right.minutes - left.minutes)) / (right.col - left.col);
  }

  function at(col) {
    if (anchors.length < 2) return null;
    if (col <= anchors[0].col) return interpolate(anchors[0], anchors[1], col);
    for (let index = 0; index < anchors.length - 1; index += 1) {
      if (col >= anchors[index].col && col <= anchors[index + 1].col) {
        return interpolate(anchors[index], anchors[index + 1], col);
      }
    }
    return interpolate(anchors[anchors.length - 2], anchors[anchors.length - 1], col);
  }

  return {
    span(c0, c1) {
      const start = at(c0);
      const end = at(c1 + 1);
      if (start === null || end === null) return null;
      return { start: snap(start), end: snap(end) };
    },
  };
}
