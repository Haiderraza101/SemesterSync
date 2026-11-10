import { STORAGE_KEYS } from "../config.js";
import { readJson, removeItem, writeJson } from "../utils/storage.js";
import { delay } from "./delay.js";

const DEMO_USER = {
  id: "demo-user",
  name: "Haider Raza",
  email: "haider@example.com",
  rollNumber: "23L-0634",
  section: "BCS-7A",
};

function createToken() {
  return `mock-${Math.random().toString(36).slice(2)}`;
}

function startSession(user) {
  writeJson(STORAGE_KEYS.mockSession, user);
  return { accessToken: createToken(), user };
}

function readSessionUser() {
  return readJson(STORAGE_KEYS.mockSession);
}

export const mockAuth = {
  async login({ email, password }) {
    await delay();
    if (!email || !password || password.length < 6) {
      throw new Error("Invalid email or password.");
    }
    const stored = readSessionUser();
    return startSession(stored?.email === email ? stored : { ...DEMO_USER, email });
  },

  async register(payload) {
    await delay();
    const { password, remember, ...profile } = payload;
    if (!password) throw new Error("Password is required.");
    return startSession({ id: `user-${Date.now()}`, ...profile });
  },

  async restoreSession() {
    await delay(150);
    const user = readSessionUser();
    if (!user) throw new Error("No active session.");
    return { accessToken: createToken(), user };
  },

  async logout() {
    await delay(150);
    removeItem(STORAGE_KEYS.mockSession);
  },

  async forgotPassword() {
    await delay();
    return { message: "If an account exists for that email, a reset link has been sent." };
  },

  async verifyResetToken() {
    await delay(300);
    return { valid: true };
  },

  async resetPassword() {
    await delay();
    removeItem(STORAGE_KEYS.mockSession);
    return { message: "Your password has been reset. Log in with your new password." };
  },

  async changePassword({ currentPassword }) {
    await delay(400);
    if (!currentPassword || currentPassword.length < 6) throw new Error("Your current password is incorrect.");
    return { message: "Password updated. Other devices have been logged out." };
  },

  async deleteAccount() {
    await delay(400);
    removeItem(STORAGE_KEYS.mockSession);
  },

  async updateProfile(profile) {
    await delay(300);
    const user = { ...(readSessionUser() || DEMO_USER), ...profile };
    writeJson(STORAGE_KEYS.mockSession, user);
    return { user };
  },
};
