// LocalStorage/SessionStorage Wrapper

const STORAGE_KEYS = {
  ACCESS_TOKEN: "trabajahoy_access_token",
  REFRESH_TOKEN: "trabajahoy_refresh_token",
  USER: "trabajahoy_user",
  ROLES: "trabajahoy_roles",
  THEME: "trabajahoy_theme",
  LANGUAGE: "trabajahoy_language",
};

function parseStoredJson(value, fallbackValue, onError = null) {
  if (value === null || value === undefined || value === "") {
    return fallbackValue;
  }

  try {
    return JSON.parse(value);
  } catch {
    if (typeof onError === "function") {
      onError();
    }
    return fallbackValue;
  }
}

export const storage = {
  setAuthSession(session = {}) {
    const { accessToken, refreshToken, user, roles } = session;

    if (accessToken || refreshToken) {
      this.setTokens({ accessToken, refreshToken });
    }
    if (user) {
      this.setUser(user);
    }
    if (Array.isArray(roles)) {
      this.setRoles(roles);
    }
  },

  getAuthSession() {
    return {
      accessToken: this.getAccessToken(),
      refreshToken: this.getRefreshToken(),
      user: this.getUser(),
      roles: this.getRoles(),
    };
  },

  clearAuthSession() {
    this.clearAll();
  },

  // Tokens
  setTokens(tokens) {
    const accessToken = tokens?.accessToken || "";
    const refreshToken = tokens?.refreshToken || "";

    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
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
    return parseStoredJson(user, null, () => {
      localStorage.removeItem(STORAGE_KEYS.USER);
    });
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
    return parseStoredJson(roles, [], () => {
      localStorage.removeItem(STORAGE_KEYS.ROLES);
    });
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
    storage.setItem(
      key,
      typeof value === "string" ? value : JSON.stringify(value),
    );
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
