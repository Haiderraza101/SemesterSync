import api from "../api/client.js";

function toFormData(file, extra = {}) {
  const formData = new FormData();
  formData.append("file", file);
  Object.entries(extra).forEach(([key, value]) => formData.append(key, value));
  return formData;
}

const multipart = { headers: { "Content-Type": "multipart/form-data" } };

export const scheduleService = {
  async getSchedule() {
    const { data } = await api.get("/schedule");
    return data.schedule;
  },

  async saveSchedule(changes) {
    const { data } = await api.put("/schedule", changes);
    return data.schedule;
  },

  async parseTimetable(file) {
    const { data } = await api.post("/timetable/parse", toFormData(file), multipart);
    return data;
  },

  async parseDateSheet(file, term) {
    const { data } = await api.post("/datesheets/parse", toFormData(file, { term }), multipart);
    return data;
  },

  async getMyShareCode() {
    const { data } = await api.get("/share");
    return data.code;
  },

  async createShareCode(content) {
    const { data } = await api.post("/share", content);
    return data;
  },

  async disableShareCode() {
    await api.delete("/share");
  },

  async lookupShareCode(code) {
    const normalized = code.trim().toUpperCase();
    const { data } = await api.get(`/share/${encodeURIComponent(normalized)}`);
    return data;
  },
};
