import { DAY_NAMES, formatTime, timeToMinutes } from "./date.js";

export function slotsOverlap(a, b) {
  return (
    a.day === b.day && timeToMinutes(a.start) < timeToMinutes(b.end) && timeToMinutes(b.start) < timeToMinutes(a.end)
  );
}

export function getSlotKey(code, slot) {
  return `${code}|${slot.day}|${slot.start}`;
}

export function findClashes(courses) {
  const clashes = [];

  for (let i = 0; i < courses.length; i += 1) {
    for (let j = i + 1; j < courses.length; j += 1) {
      const first = courses[i];
      const second = courses[j];
      first.slots.forEach((firstSlot) => {
        second.slots.forEach((secondSlot) => {
          if (!slotsOverlap(firstSlot, secondSlot)) return;
          clashes.push({
            id: `${getSlotKey(first.code, firstSlot)}~${getSlotKey(second.code, secondSlot)}`,
            day: firstSlot.day,
            start:
              timeToMinutes(firstSlot.start) > timeToMinutes(secondSlot.start) ? firstSlot.start : secondSlot.start,
            courses: [first, second],
            slotKeys: [getSlotKey(first.code, firstSlot), getSlotKey(second.code, secondSlot)],
          });
        });
      });
    }
  }

  return clashes.sort((a, b) => a.day - b.day || timeToMinutes(a.start) - timeToMinutes(b.start));
}

export function getClashingSlotKeys(clashes) {
  return new Set(clashes.flatMap((clash) => clash.slotKeys));
}

export function describeClash(clash) {
  const [first, second] = clash.courses;
  return `${DAY_NAMES[clash.day]} at ${formatTime(clash.start)}: ${first.name} (${first.section}) and ${second.name} (${second.section})`;
}
