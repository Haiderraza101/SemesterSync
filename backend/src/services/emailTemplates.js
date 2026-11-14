import { formatTime } from "./notifications/scheduleCalendar.js";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout(paragraphs) {
  const body = paragraphs.map((paragraph) => `<p style="margin:0 0 16px">${paragraph}</p>`).join("");
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#1f2933;max-width:520px">${body}<p style="margin:24px 0 0;color:#6b7280;font-size:13px">SemesterSync</p></div>`;
}

export function passwordResetEmail({ name, resetUrl, expiresInMinutes }) {
  const subject = "Reset your SemesterSync password";
  const text = [
    `Hi ${name},`,
    "",
    "We received a request to reset your SemesterSync password.",
    `Open this link to choose a new password: ${resetUrl}`,
    "",
    `The link expires in ${expiresInMinutes} minutes and can only be used once.`,
    "If you did not request this, you can ignore this email. Your password will not change.",
  ].join("\n");

  const html = layout([
    `Hi ${escapeHtml(name)},`,
    "We received a request to reset your SemesterSync password.",
    `<a href="${escapeHtml(resetUrl)}" style="display:inline-block;padding:10px 18px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px">Choose a new password</a>`,
    `The link expires in ${expiresInMinutes} minutes and can only be used once.`,
    "If you did not request this, you can ignore this email. Your password will not change.",
  ]);

  return { subject, text, html };
}

export function passwordChangedEmail({ name, resetUrl }) {
  const subject = "Your SemesterSync password was changed";
  const text = [
    `Hi ${name},`,
    "",
    "The password for your SemesterSync account was just changed, and other devices were logged out.",
    `If this was not you, reset your password right away: ${resetUrl}`,
  ].join("\n");

  const html = layout([
    `Hi ${escapeHtml(name)},`,
    "The password for your SemesterSync account was just changed, and other devices were logged out.",
    `If this was not you, <a href="${escapeHtml(resetUrl)}">reset your password</a> right away.`,
  ]);

  return { subject, text, html };
}

const DATE_LABEL = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" });

function list(items) {
  return `<ul style="margin:0 0 16px;padding-left:20px">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function summarySections({ classes, exams, tasks }) {
  return [
    {
      title: "Classes",
      items: classes.map(
        (item) =>
          `${formatTime(item.start)} to ${formatTime(item.end)}: ${item.name}${item.room ? `, ${item.room}` : ""}${item.makeup ? " (makeup)" : ""}`
      ),
    },
    {
      title: "Exams",
      items: exams.map((exam) => `${formatTime(exam.start)}: ${exam.name}${exam.venue ? `, ${exam.venue}` : ""}`),
    },
    {
      title: "Due today or tomorrow",
      items: tasks.map((task) => `${task.title}${task.courseName ? ` (${task.courseName})` : ""}`),
    },
  ].filter((section) => section.items.length > 0);
}

export function morningSummaryEmail({ name, day, classes, exams, tasks }) {
  const dateLabel = DATE_LABEL.format(day);
  const subject = `Your day: ${dateLabel}`;
  const sections = summarySections({ classes, exams, tasks });

  const text = [
    `Hi ${name},`,
    "",
    `Here is your schedule for ${dateLabel}.`,
    ...sections.flatMap((section) => ["", `${section.title}:`, ...section.items.map((item) => `- ${item}`)]),
  ].join("\n");

  const html = layout([
    `Hi ${escapeHtml(name)},`,
    `Here is your schedule for ${escapeHtml(dateLabel)}.`,
    ...sections.map((section) => `<strong>${escapeHtml(section.title)}</strong>${list(section.items)}`),
  ]);

  return { subject, text, html };
}

export function remindersEmail({ name, items }) {
  const subject = items.length === 1 ? `Reminder: ${items[0]}` : `${items.length} reminders from SemesterSync`;
  const text = [`Hi ${name},`, "", ...items.map((item) => `- ${item}`)].join("\n");
  const html = layout([`Hi ${escapeHtml(name)},`, list(items)]);
  return { subject, text, html };
}
