import api from "../api/client.js";
import { USE_MOCK_API } from "../config.js";
import { mockAuth } from "../mocks/auth.js";

export const authService = {
  async login(credentials) {
    if (USE_MOCK_API) return mockAuth.login(credentials);
    const { data } = await api.post("/auth/login", credentials);
    return data;
  },

  async register(payload) {
    if (USE_MOCK_API) return mockAuth.register(payload);
    const { data } = await api.post("/auth/register", payload);
    return data;
  },

  async forgotPassword(email) {
    if (USE_MOCK_API) return mockAuth.forgotPassword(email);
    const { data } = await api.post("/auth/forgot-password", { email });
    return data;
  },

  async updateProfile(profile) {
    if (USE_MOCK_API) return mockAuth.updateProfile(profile);
    const { data } = await api.put("/users/me", profile);
    return data;
  },
};
