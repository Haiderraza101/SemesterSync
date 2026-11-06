import api from "../api/client.js";
import { USE_MOCK_API } from "../config.js";
import { mockScheduleApi } from "../mocks/scheduleApi.js";

function toFormData(file, extra = {}) {
  const formData = new FormData();
  formData.append("file", file);
  Object.entries(extra).forEach(([key, value]) => formData.append(key, value));
  return formData;
}

const multipart = { headers: { "Content-Type": "multipart/form-data" } };

export const scheduleService = {
  async parseTimetable(file) {
    if (USE_MOCK_API) return mockScheduleApi.parseTimetable(file);
    const { data } = await api.post("/timetable/parse", toFormData(file), multipart);
    return data;
  },

  async parseDateSheet(file, term) {
    if (USE_MOCK_API) return mockScheduleApi.parseDateSheet(file, term);
    const { data } = await api.post("/datesheets/parse", toFormData(file, { term }), multipart);
    return data;
  },

  async createShareCode(selections) {
    if (USE_MOCK_API) return mockScheduleApi.createShareCode(selections);
    const { data } = await api.post("/share", { selections });
    return data;
  },

  async lookupShareCode(code) {
    const normalized = code.trim().toUpperCase();
    if (USE_MOCK_API) return mockScheduleApi.lookupShareCode(normalized);
    const { data } = await api.get(`/share/${encodeURIComponent(normalized)}`);
    return data;
  },
};
