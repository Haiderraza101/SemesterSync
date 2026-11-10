import api, { refreshSession } from "../api/client.js";
import { tokenStore } from "../api/tokenStore.js";
import { USE_MOCK_API } from "../config.js";
import { mockAuth } from "../mocks/auth.js";

function applySession({ accessToken, user }) {
  tokenStore.set(accessToken);
  return user;
}

export const authService = {
  async login(credentials) {
    if (USE_MOCK_API) return applySession(await mockAuth.login(credentials));
    const { data } = await api.post("/auth/login", credentials);
    return applySession(data);
  },

  async register(payload) {
    if (USE_MOCK_API) return applySession(await mockAuth.register(payload));
    const { data } = await api.post("/auth/register", payload);
    return applySession(data);
  },

  async restoreSession() {
    if (USE_MOCK_API) return applySession(await mockAuth.restoreSession());
    const { user } = await refreshSession();
    return user;
  },

  async logout() {
    try {
      if (USE_MOCK_API) await mockAuth.logout();
      else await api.post("/auth/logout");
    } catch {
      return;
    } finally {
      tokenStore.clear();
    }
  },

  async logoutEverywhere() {
    if (USE_MOCK_API) await mockAuth.logout();
    else await api.post("/auth/logout-all");
    tokenStore.clear();
  },

  clearSession() {
    tokenStore.clear();
  },

  async forgotPassword(email) {
    if (USE_MOCK_API) return mockAuth.forgotPassword(email);
    const { data } = await api.post("/auth/forgot-password", { email });
    return data;
  },

  async verifyResetToken(token) {
    if (USE_MOCK_API) return mockAuth.verifyResetToken(token);
    const { data } = await api.get(`/auth/reset-password/${encodeURIComponent(token)}`);
    return data;
  },

  async resetPassword(token, password) {
    if (USE_MOCK_API) return mockAuth.resetPassword(token, password);
    const { data } = await api.post(`/auth/reset-password/${encodeURIComponent(token)}`, { password });
    return data;
  },

  async changePassword(payload) {
    if (USE_MOCK_API) return mockAuth.changePassword(payload);
    const { data } = await api.put("/users/me/password", payload);
    return data;
  },

  async deleteAccount() {
    if (USE_MOCK_API) await mockAuth.deleteAccount();
    else await api.delete("/users/me");
    tokenStore.clear();
  },

  async updateProfile(profile) {
    if (USE_MOCK_API) return (await mockAuth.updateProfile(profile)).user;
    const { data } = await api.put("/users/me", profile);
    return data.user;
  },
};
