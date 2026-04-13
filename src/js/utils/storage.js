// LocalStorage/SessionStorage Wrapper

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'trabajahoy_access_token',
  REFRESH_TOKEN: 'trabajahoy_refresh_token',
  USER: 'trabajahoy_user',
  ROLES: 'trabajahoy_roles',
  THEME: 'trabajahoy_theme',
  LANGUAGE: 'trabajahoy_language',
};

export const storage = {
  // Tokens
  setTokens(tokens) {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
  },

  getAccessToken() {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  getRefreshToken() {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  clearTokens() {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  // User
  setUser(user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  getUser() {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  },

  clearUser() {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  // Roles
  setRoles(roles) {
    localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(roles));
  },

  getRoles() {
    const roles = localStorage.getItem(STORAGE_KEYS.ROLES);
    return roles ? JSON.parse(roles) : [];
  },

  clearRoles() {
    localStorage.removeItem(STORAGE_KEYS.ROLES);
  },

  // Clear all auth data
  clearAll() {
    this.clearTokens();
    this.clearUser();
    this.clearRoles();
  },

  // Generic methods
  set(key, value, useSession = false) {
    const storage = useSession ? sessionStorage : localStorage;
    storage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  },

  get(key, useSession = false) {
    const storage = useSession ? sessionStorage : localStorage;
    const value = storage.getItem(key);
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  },

  remove(key, useSession = false) {
    const storage = useSession ? sessionStorage : localStorage;
    storage.removeItem(key);
  },

  clear(useSession = false) {
    const storage = useSession ? sessionStorage : localStorage;
    storage.clear();
  },
};
