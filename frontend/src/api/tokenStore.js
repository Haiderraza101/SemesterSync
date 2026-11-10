let accessToken = null;
const expiryListeners = new Set();

export const tokenStore = {
  get() {
    return accessToken;
  },
  set(token) {
    accessToken = token || null;
  },
  clear() {
    accessToken = null;
  },
};

export function onSessionExpired(listener) {
  expiryListeners.add(listener);
  return () => expiryListeners.delete(listener);
}

export function notifySessionExpired() {
  expiryListeners.forEach((listener) => listener());
}
