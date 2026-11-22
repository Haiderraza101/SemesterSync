import { differenceInDays, startOfDay } from "./date.js";

export function daysAway(date, now = new Date()) {
  const days = differenceInDays(startOfDay(date), startOfDay(now));
  if (days < 0) return { days, label: days === -1 ? "Yesterday" : `${-days} days ago`, variant: "secondary" };
  if (days === 0) return { days, label: "Today", variant: "warning" };
  if (days === 1) return { days, label: "Tomorrow", variant: "info" };
  return { days, label: `In ${days} days`, variant: "secondary" };
}
