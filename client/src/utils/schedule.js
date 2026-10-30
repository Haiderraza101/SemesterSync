import { SEMESTER } from "../config.js";
import { addDays, combineDateTime, parseDateKey, startOfDay, toDateKey } from "./date.js";

export function getCourseIndex(catalog) {
  return new Map((catalog?.courses || []).map((course) => [course.code, course]));
}

export function toSelectedCourse(course, section) {
  const details = course?.sections[section];
  if (!details) return null;
  return {
    code: course.code,
    name: course.name,
    shortName: course.shortName,
    color: course.color,
    section,
    room: details.room,
    instructor: details.instructor,
    slots: details.slots,
  };
}

export function getSelectedCourses(schedule) {
  const index = getCourseIndex(schedule.catalog);
  return schedule.selections.map(({ code, section }) => toSelectedCourse(index.get(code), section)).filter(Boolean);
}

export function getInstanceId(code, dateKey, start) {
  return `${code}_${dateKey}_${start.replace(":", "")}`;
}

export function getSemesterRange() {
  return { start: parseDateKey(SEMESTER.start), end: parseDateKey(SEMESTER.end) };
}

export function getClassInstances(schedule, courses, from, to) {
  const cancelled = new Set(schedule.cancelled);
  const firstDay = startOfDay(from);
  const lastDay = startOfDay(to);
  const instances = [];

  for (let date = firstDay; date <= lastDay; date = addDays(date, 1)) {
    const dateKey = toDateKey(date);
    if (dateKey < SEMESTER.start || dateKey > SEMESTER.end) continue;
    const day = date.getDay();

    courses.forEach((course) => {
      course.slots
        .filter((slot) => slot.day === day)
        .forEach((slot) => {
          const id = getInstanceId(course.code, dateKey, slot.start);
          instances.push({
            id,
            kind: "class",
            course,
            dateKey,
            start: slot.start,
            end: slot.end,
            room: course.room,
            cancelled: cancelled.has(id),
          });
        });
    });
  }

  const courseIndex = new Map(courses.map((course) => [course.code, course]));
  const fromKey = toDateKey(firstDay);
  const toKey = toDateKey(lastDay);

  schedule.makeups.forEach((makeup) => {
    const course = courseIndex.get(makeup.code);
    if (!course || makeup.date < fromKey || makeup.date > toKey) return;
    instances.push({
      id: makeup.id,
      kind: "makeup",
      course,
      dateKey: makeup.date,
      start: makeup.start,
      end: makeup.end,
      room: makeup.room,
      cancelled: false,
    });
  });

  return instances.sort((a, b) => a.dateKey.localeCompare(b.dateKey) || a.start.localeCompare(b.start));
}

export function getClassesOnDate(schedule, courses, date) {
  return getClassInstances(schedule, courses, date, date);
}

export function getExams(schedule, courses) {
  const courseIndex = new Map(courses.map((course) => [course.code, course]));
  return ["midterm", "final"].flatMap((term) =>
    (schedule.dateSheets[term]?.exams || [])
      .filter((exam) => courseIndex.has(exam.code))
      .map((exam) => ({
        ...exam,
        id: `exam_${term}_${exam.code}`,
        term,
        course: courseIndex.get(exam.code),
        startsAt: combineDateTime(exam.date, exam.start),
      }))
  );
}

export function getTasksWithCourses(schedule, courses) {
  const courseIndex = new Map(courses.map((course) => [course.code, course]));
  return schedule.tasks.map((task) => ({
    ...task,
    course: courseIndex.get(task.courseCode) || null,
    dueAt: new Date(task.due),
  }));
}

export function getUpcomingItems(schedule, courses, now = new Date(), limit = 4) {
  const exams = getExams(schedule, courses).map((exam) => ({
    id: exam.id,
    kind: "exam",
    title: `${exam.term === "midterm" ? "Midterm" : "Final"}, ${exam.course.name}`,
    detail: exam.venue,
    date: exam.startsAt,
  }));

  const tasks = getTasksWithCourses(schedule, courses)
    .filter((task) => !task.done)
    .map((task) => ({
      id: task.id,
      kind: task.type,
      title: task.course ? `${task.title}, ${task.course.name}` : task.title,
      detail: task.type === "quiz" ? "In class" : "Due",
      date: task.dueAt,
    }));

  return [...exams, ...tasks]
    .filter((item) => item.date >= startOfDay(now))
    .sort((a, b) => a.date - b.date)
    .slice(0, limit);
}
