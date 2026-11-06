import { createContext, useCallback, useMemo, useState } from "react";
import { STORAGE_KEYS } from "../config.js";
import { authService } from "../services/authService.js";
import { readJson, readString, removeItem, writeJson, writeString } from "../utils/storage.js";

export const AuthContext = createContext(null);

function readSession() {
  const token = readString(STORAGE_KEYS.token);
  const user = readJson(STORAGE_KEYS.user);
  return token && user ? user : null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession);

  const startSession = useCallback(({ token, user: nextUser }) => {
    writeString(STORAGE_KEYS.token, token);
    writeJson(STORAGE_KEYS.user, nextUser);
    setUser(nextUser);
    return nextUser;
  }, []);

  const login = useCallback(async (credentials) => startSession(await authService.login(credentials)), [startSession]);

  const register = useCallback(async (payload) => startSession(await authService.register(payload)), [startSession]);

  const logout = useCallback(() => {
    removeItem(STORAGE_KEYS.token);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (profile) => {
    const { user: updated } = await authService.updateProfile(profile);
    writeJson(STORAGE_KEYS.user, updated);
    setUser(updated);
    return updated;
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), login, register, logout, updateProfile }),
    [user, login, register, logout, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
