import cron from "node-cron";
import { env } from "../config/env.js";
import { runNotificationTick } from "../services/notifications/notificationService.js";

const MINUTE_MS = 60 * 1000;

let task = null;
let running = false;
let lastRun = null;

async function tick() {
  if (running) return;
  running = true;

  const now = new Date();
  const earliest = new Date(now.getTime() - env.notifications.maxCatchUpMinutes * MINUTE_MS);
  const start = lastRun && lastRun > earliest ? lastRun : earliest;

  try {
    const sent = await runNotificationTick({ start, end: now });
    if (sent > 0) console.log(`Notifications sent: ${sent}`);
    lastRun = now;
  } catch (error) {
    console.error(`Notification run failed: ${error.message}`);
  } finally {
    running = false;
  }
}

export function startNotificationScheduler() {
  if (!env.notifications.enabled || task) return;
  lastRun = new Date(Date.now() - MINUTE_MS);
  task = cron.schedule("* * * * *", tick, { timezone: env.timezone });
  console.log(`Notification scheduler running (${env.timezone})`);
}

export function stopNotificationScheduler() {
  task?.stop();
  task = null;
}
