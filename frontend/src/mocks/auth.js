import { STORAGE_KEYS } from "../config.js";
import { readJson } from "../utils/storage.js";
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

export const mockAuth = {
  async login({ email, password }) {
    await delay();
    if (!email || !password || password.length < 6) {
      throw new Error("Invalid email or password.");
    }
    const stored = readJson(STORAGE_KEYS.user);
    const user = stored?.email === email ? stored : { ...DEMO_USER, email };
    return { token: createToken(), user };
  },

  async register(payload) {
    await delay();
    const { password, ...profile } = payload;
    if (!password) throw new Error("Password is required.");
    return { token: createToken(), user: { id: `user-${Date.now()}`, ...profile } };
  },

  async forgotPassword() {
    await delay();
    return { ok: true };
  },

  async changePassword({ currentPassword }) {
    await delay(400);
    if (!currentPassword || currentPassword.length < 6) throw new Error("Your current password is incorrect.");
    return { ok: true };
  },

  async deleteAccount() {
    await delay(400);
    return { ok: true };
  },

  async updateProfile(profile) {
    await delay(300);
    const current = readJson(STORAGE_KEYS.user) || DEMO_USER;
    return { user: { ...current, ...profile } };
  },
};
