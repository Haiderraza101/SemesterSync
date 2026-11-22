import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { onSessionExpired } from "../api/tokenStore.js";
import { authService } from "../services/authService.js";

export const AuthContext = createContext(null);

const LOADING_STATE = { status: "loading", user: null };

function toState(user) {
  return user ? { status: "authenticated", user } : { status: "guest", user: null };
}

export function AuthProvider({ children }) {
  const [state, setState] = useState(LOADING_STATE);

  const setUser = useCallback((user) => setState(toState(user)), []);

  useEffect(() => {
    let active = true;
    authService
      .restoreSession()
      .then((user) => active && setUser(user))
      .catch(() => active && setUser(null));
    return () => {
      active = false;
    };
  }, [setUser]);

  useEffect(() => onSessionExpired(() => setUser(null)), [setUser]);

  const login = useCallback(
    async (credentials) => {
      const user = await authService.login(credentials);
      setUser(user);
      return user;
    },
    [setUser]
  );

  const register = useCallback(
    async (payload) => {
      const user = await authService.register(payload);
      setUser(user);
      return user;
    },
    [setUser]
  );

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, [setUser]);

  const logoutEverywhere = useCallback(async () => {
    await authService.logoutEverywhere();
    setUser(null);
  }, [setUser]);

  const clearSession = useCallback(() => {
    authService.clearSession();
    setUser(null);
  }, [setUser]);

  const updateProfile = useCallback(
    async (profile) => {
      const user = await authService.updateProfile(profile);
      setUser(user);
      return user;
    },
    [setUser]
  );

  const uploadAvatar = useCallback(
    async (file) => {
      const user = await authService.uploadAvatar(file);
      setUser(user);
      return user;
    },
    [setUser]
  );

  const removeAvatar = useCallback(async () => {
    const user = await authService.removeAvatar();
    setUser(user);
    return user;
  }, [setUser]);

  const value = useMemo(
    () => ({
      user: state.user,
      status: state.status,
      isLoading: state.status === "loading",
      isAuthenticated: state.status === "authenticated",
      login,
      register,
      logout,
      logoutEverywhere,
      clearSession,
      updateProfile,
      uploadAvatar,
      removeAvatar,
    }),
    [state, login, register, logout, logoutEverywhere, clearSession, updateProfile, uploadAvatar, removeAvatar]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
