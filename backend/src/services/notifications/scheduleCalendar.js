import { EXAM_TERMS } from "../../utils/examTerms.js";

export function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function combineDateTime(dateKey, time) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatTime(time) {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function instanceId(code, dateKey, start) {
  return `${code}_${dateKey}_${start.replace(":", "")}`;
}

function withinSemester(settings, dateKey) {
  if (settings?.semesterStart && dateKey < settings.semesterStart) return false;
  if (settings?.semesterEnd && dateKey > settings.semesterEnd) return false;
  return true;
}

export function getSelectedCourses(schedule) {
  const courses = new Map((schedule.catalog?.courses || []).map((course) => [course.code, course]));
  return (schedule.selections || []).flatMap(({ code, section }) => {
    const course = courses.get(code);
    const details = course?.sections?.[section];
    if (!details) return [];
    return [{ code, section, name: course.name, shortName: course.shortName || course.name, ...details }];
  });
}

export function getClassesOn(schedule, courses, date) {
  const dateKey = toDateKey(date);
  if (!withinSemester(schedule.settings, dateKey)) return [];

  const cancelled = new Set(schedule.cancelled || []);
  const day = date.getDay();
  const courseIndex = new Map(courses.map((course) => [course.code, course]));

  const weekly = courses.flatMap((course) =>
    (course.slots || [])
      .filter((slot) => slot.day === day && !cancelled.has(instanceId(course.code, dateKey, slot.start)))
      .map((slot) => ({
        code: course.code,
        name: course.name,
        start: slot.start,
        end: slot.end,
        room: slot.room || course.room || "",
        makeup: false,
      }))
  );

  const makeups = (schedule.makeups || [])
    .filter((makeup) => makeup.date === dateKey && courseIndex.has(makeup.code))
    .map((makeup) => ({
      code: makeup.code,
      name: courseIndex.get(makeup.code).name,
      start: makeup.start,
      end: makeup.end,
      room: makeup.room,
      makeup: true,
    }));

  return [...weekly, ...makeups]
    .map((item) => ({ ...item, startsAt: combineDateTime(dateKey, item.start) }))
    .sort((a, b) => a.startsAt - b.startsAt);
}

export function getExams(schedule, courses) {
  const courseIndex = new Map(courses.map((course) => [course.code, course]));
  return EXAM_TERMS.flatMap((term) =>
    (schedule.dateSheets?.[term]?.exams || [])
      .filter((exam) => courseIndex.has(exam.code) && exam.date && exam.start)
      .map((exam) => ({
        ...exam,
        term,
        name: courseIndex.get(exam.code).name,
        startsAt: combineDateTime(exam.date, exam.start),
      }))
  );
}

export function getOpenTasks(schedule, courses) {
  const courseIndex = new Map(courses.map((course) => [course.code, course]));
  return (schedule.tasks || [])
    .filter((task) => !task.done && task.due)
    .map((task) => ({ ...task, courseName: courseIndex.get(task.courseCode)?.name || "", dueAt: new Date(task.due) }))
    .filter((task) => !Number.isNaN(task.dueAt.getTime()));
}
