import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const APP_NAME = "SemesterSync";

const TITLES = {
  "/": "Semester schedule manager",
  "/login": "Log in",
  "/register": "Create an account",
  "/forgot-password": "Reset password",
  "/app": "Dashboard",
  "/app/calendar": "Calendar",
  "/app/timetable": "Timetable",
  "/app/datesheets": "Date sheets",
  "/app/tasks": "Assignments and quizzes",
  "/app/attendance": "Attendance",
  "/app/share": "Share code",
  "/app/export": "Export timetable",
  "/app/settings": "Settings",
};

export default function DocumentTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    const normalized = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
    const title = TITLES[normalized];
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME;
  }, [pathname]);

  return null;
}
