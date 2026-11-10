import axios from "axios";
import { API_BASE_URL } from "../config.js";
import { notifySessionExpired, tokenStore } from "./tokenStore.js";

const SESSION_ENDPOINT_PATTERN = /^\/auth\/(login|register|refresh|logout|forgot-password|reset-password(\/.*)?)$/;

const baseConfig = {
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
};

const api = axios.create(baseConfig);
const sessionClient = axios.create(baseConfig);

let refreshPromise = null;

export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = sessionClient
      .post("/auth/refresh")
      .then(({ data }) => {
        tokenStore.set(data.accessToken);
        return data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function shouldRefresh(error) {
  const { config, response } = error;
  if (!config || config._retried || response?.status !== 401) return false;
  return !SESSION_ENDPOINT_PATTERN.test(config.url || "");
}

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!shouldRefresh(error)) return Promise.reject(error);

    error.config._retried = true;
    try {
      await refreshSession();
    } catch (refreshError) {
      if (refreshError.response?.status === 401) {
        tokenStore.clear();
        notifySessionExpired();
      }
      return Promise.reject(error);
    }
    return api(error.config);
  }
);

export default api;
