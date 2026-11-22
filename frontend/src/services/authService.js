import api, { refreshSession } from "../api/client.js";
import { tokenStore } from "../api/tokenStore.js";

function applySession({ accessToken, user }) {
  tokenStore.set(accessToken);
  return user;
}

export const authService = {
  async login(credentials) {
    const { data } = await api.post("/auth/login", credentials);
    return applySession(data);
  },

  async register(payload) {
    const { data } = await api.post("/auth/register", payload);
    return applySession(data);
  },

  async restoreSession() {
    const { user } = await refreshSession();
    return user;
  },

  async logout() {
    try {
      await api.post("/auth/logout");
    } catch {
      return;
    } finally {
      tokenStore.clear();
    }
  },

  async logoutEverywhere() {
    await api.post("/auth/logout-all");
    tokenStore.clear();
  },

  clearSession() {
    tokenStore.clear();
  },

  async forgotPassword(email) {
    const { data } = await api.post("/auth/forgot-password", { email });
    return data;
  },

  async verifyResetToken(token) {
    const { data } = await api.get(`/auth/reset-password/${encodeURIComponent(token)}`);
    return data;
  },

  async resetPassword(token, password) {
    const { data } = await api.post(`/auth/reset-password/${encodeURIComponent(token)}`, { password });
    return data;
  },

  async changePassword(payload) {
    const { data } = await api.put("/users/me/password", payload);
    return data;
  },

  async deleteAccount() {
    await api.delete("/users/me");
    tokenStore.clear();
  },

  async uploadAvatar(file) {
    const form = new FormData();
    form.append("avatar", file);
    const { data } = await api.post("/users/me/avatar", form, { headers: { "Content-Type": "multipart/form-data" } });
    return data.user;
  },

  async removeAvatar() {
    const { data } = await api.delete("/users/me/avatar");
    return data.user;
  },

  async updateProfile(profile) {
    const { data } = await api.put("/users/me", profile);
    return data.user;
  },
};
