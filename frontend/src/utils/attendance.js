import { getClassInstances, getSemesterRange } from "./schedule.js";

export const LATES_PER_ABSENCE = 3;

export const ATTENDANCE_OPTIONS = [
  { value: 80, label: "80%" },
  { value: 75, label: "75%" },
];

function getRisk(canMiss) {
  if (canMiss === 0) return "critical";
  if (canMiss <= 3) return "warning";
  return "ok";
}

export function getAttendanceSummary(schedule, courses, requirement = 80) {
  const range = getSemesterRange(schedule);
  const plannedByCourse = new Map();

  if (range) {
    getClassInstances(schedule, courses, range.start, range.end)
      .filter((instance) => !instance.cancelled)
      .forEach((instance) => {
        plannedByCourse.set(instance.course.code, (plannedByCourse.get(instance.course.code) || 0) + 1);
      });
  }

  const marksByCourse = new Map();
  Object.entries(schedule.attendance.marks).forEach(([instanceId, status]) => {
    const code = instanceId.split("_")[0];
    const counts = marksByCourse.get(code) || { held: 0, attended: 0, late: 0 };
    counts.held += 1;
    if (status === "present" || status === "late") counts.attended += 1;
    if (status === "late") counts.late += 1;
    marksByCourse.set(code, counts);
  });

  return courses.map((course) => {
    const baseline = schedule.attendance.baseline[course.code] || { held: 0, attended: 0 };
    const marked = marksByCourse.get(course.code) || { held: 0, attended: 0, late: 0 };
    const held = baseline.held + marked.held;
    const late = marked.late;
    const lateAbsences = Math.floor(late / LATES_PER_ABSENCE);
    const attended = baseline.attended + marked.attended - lateAbsences;
    const absent = held - attended;
    const total = Math.max(plannedByCourse.get(course.code) || 0, held);
    const allowedAbsences = Math.floor(total * (1 - requirement / 100));
    const canMiss = Math.max(0, allowedAbsences - absent);
    const percentage = held === 0 ? 100 : Math.round((attended / held) * 100);

    return { course, held, attended, absent, late, lateAbsences, total, percentage, canMiss, risk: held === 0 ? "ok" : getRisk(canMiss) };
  });
}

export function getLowestAttendance(summary) {
  return summary.filter((item) => item.held > 0).reduce((lowest, item) => (!lowest || item.percentage < lowest.percentage ? item : lowest), null);
}
