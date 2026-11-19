import api from "../api/client.js";

const lecturePath = (lectureId) => `/lectures/${encodeURIComponent(lectureId)}`;

export const lectureService = {
  async get(lectureId) {
    const { data } = await api.get(lecturePath(lectureId));
    return data.lecture;
  },

  async save(lectureId, changes) {
    const { data } = await api.put(lecturePath(lectureId), changes);
    return data.lecture;
  },

  async listForCourse(courseCode) {
    const { data } = await api.get("/lectures", { params: { course: courseCode } });
    return data.lectures;
  },

  async uploadFile(lectureId, info, file, onProgress) {
    const form = new FormData();
    Object.entries(info).forEach(([key, value]) => value !== undefined && form.append(key, value));
    form.append("file", file);
    const { data } = await api.post(`${lecturePath(lectureId)}/files`, form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => event.total && onProgress?.(Math.round((event.loaded / event.total) * 100)),
    });
    return data.lecture;
  },

  async downloadFile(lectureId, file) {
    const { data } = await api.get(`${lecturePath(lectureId)}/files/${file.id}`, { responseType: "blob" });
    const url = URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  async deleteFile(lectureId, fileId) {
    const { data } = await api.delete(`${lecturePath(lectureId)}/files/${fileId}`);
    return data.lecture;
  },
};
