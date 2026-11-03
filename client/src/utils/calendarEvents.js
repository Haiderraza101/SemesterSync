import { addDays, combineDateTime } from "./date.js";
import { getSlotKey } from "./clashes.js";
import { getClassInstances, getExams, getTasksWithCourses } from "./schedule.js";

const TASK_DURATION_MINUTES = 30;

function inRange(date, range) {
  return date >= range.start && date < range.end;
}

export function buildCalendarEvents({ schedule, courses, range, clashingSlots, hiddenCodes }) {
  if (!range) return [];
  const visibleCourses = courses.filter((course) => !hiddenCodes.has(course.code));
  const visibleCodes = new Set(visibleCourses.map((course) => course.code));

  const classEvents = getClassInstances(schedule, visibleCourses, range.start, addDays(range.end, -1)).map(
    (instance) => {
      const startsAt = combineDateTime(instance.dateKey, instance.start);
      const clash =
        instance.kind === "class" &&
        clashingSlots.has(getSlotKey(instance.course.code, { day: startsAt.getDay(), start: instance.start }));
      const variant = instance.cancelled
        ? "cancelled"
        : instance.kind === "makeup"
          ? "makeup"
          : clash
            ? "clash"
            : "class";

      return {
        id: instance.id,
        title: instance.course.shortName,
        start: startsAt,
        end: combineDateTime(instance.dateKey, instance.end),
        classNames: ["ss-event", `ss-event--${variant}`],
        extendedProps: { type: "class", variant, instance },
      };
    }
  );

  const examEvents = getExams(schedule, visibleCourses)
    .filter((exam) => inRange(exam.startsAt, range))
    .map((exam) => ({
      id: exam.id,
      title: `${exam.term === "midterm" ? "Midterm" : "Final"}: ${exam.course.shortName}`,
      start: exam.startsAt,
      end: combineDateTime(exam.date, exam.end),
      classNames: ["ss-event", "ss-event--exam"],
      extendedProps: { type: "exam", variant: "exam", exam },
    }));

  const taskEvents = getTasksWithCourses(schedule, courses)
    .filter((task) => !task.done && (!task.course || visibleCodes.has(task.courseCode)) && inRange(task.dueAt, range))
    .map((task) => ({
      id: task.id,
      title: task.title,
      start: task.dueAt,
      end: new Date(task.dueAt.getTime() + TASK_DURATION_MINUTES * 60 * 1000),
      classNames: ["ss-event", "ss-event--task"],
      extendedProps: { type: "task", variant: "task", task },
    }));

  return [...classEvents, ...examEvents, ...taskEvents];
}
