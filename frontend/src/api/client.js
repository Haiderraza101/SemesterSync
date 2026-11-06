import axios from "axios";
import { API_BASE_URL, STORAGE_KEYS } from "../config.js";
import { readString } from "../utils/storage.js";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = readString(STORAGE_KEYS.token);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
