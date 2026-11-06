export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK !== "false";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export const STORAGE_KEYS = {
  token: "semestersync.token",
  user: "semestersync.user",
  schedule: "semestersync.schedule",
};

export const SEMESTER = {
  name: "Fall 2026",
  start: "2026-08-24",
  end: "2026-12-18",
};
