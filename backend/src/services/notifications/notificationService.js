import NotificationLog from "../../models/NotificationLog.js";
import Schedule from "../../models/Schedule.js";
import { sendEmail } from "../emailService.js";
import { morningSummaryEmail, remindersEmail } from "../emailTemplates.js";
import {
  addDays,
  combineDateTime,
  formatTime,
  getClassesOn,
  getExams,
  getOpenTasks,
  getSelectedCourses,
  startOfDay,
  toDateKey,
} from "./scheduleCalendar.js";

const MINUTE_MS = 60 * 1000;
const OFFSET_MINUTES = { "15m": 15, "30m": 30, "3h": 180, "1d": 1440, "2d": 2880, "1w": 10080 };
const TERM_LABELS = { midterm: "Midterm", final: "Final" };
const DEFAULT_SUMMARY_TIME = "07:00";

function inWindow(date, window) {
  return date > window.start && date <= window.end;
}

function remindAt(date, reminder) {
  const minutes = OFFSET_MINUTES[reminder];
  return minutes ? new Date(date.getTime() - minutes * MINUTE_MS) : null;
}

function windowDays(window) {
  const days = [];
  const lastKey = toDateKey(window.end);
  for (let day = startOfDay(window.start); toDateKey(day) <= lastKey; day = addDays(day, 1)) {
    days.push(day);
  }
  return days;
}

function collectSummaries(schedule, courses, window) {
  const settings = schedule.settings || {};
  if (settings.morningSummary === false) return [];

  return windowDays(window).flatMap((day) => {
    const dateKey = toDateKey(day);
    if (!inWindow(combineDateTime(dateKey, settings.summaryTime || DEFAULT_SUMMARY_TIME), window)) return [];

    const classes = getClassesOn(schedule, courses, day);
    const exams = getExams(schedule, courses).filter((exam) => exam.date === dateKey);
    const tasks = getOpenTasks(schedule, courses).filter((task) => task.dueAt >= day && task.dueAt < addDays(day, 2));
    if (classes.length + exams.length + tasks.length === 0) return [];

    return [{ key: `summary:${dateKey}`, day, classes, exams, tasks }];
  });
}

function collectClassReminders(schedule, courses, window) {
  const reminder = schedule.settings?.classReminder;
  if (!OFFSET_MINUTES[reminder]) return [];

  return windowDays({ start: window.start, end: addDays(window.end, 1) }).flatMap((day) =>
    getClassesOn(schedule, courses, day)
      .filter((item) => inWindow(remindAt(item.startsAt, reminder), window))
      .map((item) => ({
        key: `class:${item.code}:${toDateKey(day)}:${item.start}`,
        text: `${item.makeup ? "Makeup class" : "Class"}: ${item.name} at ${formatTime(item.start)}${item.room ? `, ${item.room}` : ""}`,
      }))
  );
}

function collectTaskReminders(schedule, courses, window) {
  return getOpenTasks(schedule, courses)
    .filter((task) => inWindow(remindAt(task.dueAt, task.reminder), window))
    .map((task) => ({
      key: `task:${task.id}:${task.reminder}:${task.due}`,
      text: `${task.type === "quiz" ? "Quiz" : "Assignment"} due: ${task.title}${task.courseName ? ` (${task.courseName})` : ""}`,
    }));
}

function collectExamReminders(schedule, courses, window) {
  return getExams(schedule, courses)
    .filter((exam) => inWindow(remindAt(exam.startsAt, exam.reminder), window))
    .map((exam) => ({
      key: `exam:${exam.term}:${exam.code}:${exam.date}:${exam.reminder}`,
      text: `${TERM_LABELS[exam.term]} exam: ${exam.name} on ${exam.date} at ${formatTime(exam.start)}${exam.venue ? `, ${exam.venue}` : ""}`,
    }));
}

async function claim(userId, key) {
  try {
    await NotificationLog.create({ user: userId, key });
    return true;
  } catch (error) {
    if (error.code === 11000) return false;
    throw error;
  }
}

async function claimAll(userId, items) {
  const claimed = [];
  for (const item of items) {
    if (await claim(userId, item.key)) claimed.push(item);
  }
  return claimed;
}

async function deliver(userId, items, message) {
  try {
    await sendEmail(message);
  } catch (error) {
    await NotificationLog.deleteMany({ user: userId, key: { $in: items.map((item) => item.key) } });
    throw error;
  }
}

export function collectNotifications(schedule, window) {
  const courses = getSelectedCourses(schedule);
  return {
    summaries: collectSummaries(schedule, courses, window),
    reminders: [
      ...collectClassReminders(schedule, courses, window),
      ...collectTaskReminders(schedule, courses, window),
      ...collectExamReminders(schedule, courses, window),
    ],
  };
}

async function notifyUser(schedule, window) {
  const { user } = schedule;
  const due = collectNotifications(schedule, window);

  const summaries = await claimAll(user._id, due.summaries);
  for (const summary of summaries) {
    await deliver(user._id, [summary], { to: user.email, ...morningSummaryEmail({ name: user.name, ...summary }) });
  }

  const reminders = await claimAll(user._id, due.reminders);
  if (reminders.length > 0) {
    const items = reminders.map((item) => item.text);
    await deliver(user._id, reminders, { to: user.email, ...remindersEmail({ name: user.name, items }) });
  }

  return summaries.length + reminders.length;
}

export async function runNotificationTick(window) {
  const cursor = Schedule.find({ $or: [{ "selections.0": { $exists: true } }, { "tasks.0": { $exists: true } }] })
    .populate("user", "name email")
    .lean()
    .cursor();

  let sent = 0;
  for await (const schedule of cursor) {
    if (!schedule.user?.email) continue;
    try {
      sent += await notifyUser(schedule, window);
    } catch (error) {
      console.error(`Notifications for user ${schedule.user._id} failed: ${error.message}`);
    }
  }
  return sent;
}
