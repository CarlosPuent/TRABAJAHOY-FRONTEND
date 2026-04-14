// Global State Management using Proxy Pattern
import { getPrimaryRole, hasAnyRole, normalizeRoles } from "@core/roles";

class Store {
  constructor() {
    this._state = {
      // Authentication
      isAuthenticated: false,
      user: null,
      roles: [],
      primaryRole: null,
      accessToken: null,
      refreshToken: null,

      // UI State
      loading: false,
      error: null,
      toasts: [],

      // Data caches
      vacancies: {
        list: [],
        pagination: null,
        filters: {},
      },
      companies: {
        list: [],
        pagination: null,
      },
      applications: {
        list: [],
        pagination: null,
      },
      savedJobs: [],
      profile: null,
    };

    // Create proxy for reactive updates
    this._proxy = new Proxy(this._state, {
      set: (target, property, value) => {
        const oldValue = target[property];
        target[property] = value;

        // Notify subscribers
        this._notify(property, value, oldValue);
        return true;
      },
    });

    // Subscribers map
    this._subscribers = {};
  }

  // Get state value
  get(path) {
    const keys = path.split(".");
    let value = this._proxy;

    for (const key of keys) {
      if (value === undefined || value === null) {
        return undefined;
      }
      value = value[key];
    }

    return value;
  }

  // Set state value
  set(path, value) {
    if (path === "roles") {
      this.setRoles(value);
      return;
    }

    const keys = path.split(".");
    let target = this._proxy;

    for (let i = 0; i < keys.length - 1; i++) {
      target = target[keys[i]];
    }

    target[keys[keys.length - 1]] = value;
  }

  // Subscribe to state changes
  subscribe(path, callback) {
    if (!this._subscribers[path]) {
      this._subscribers[path] = [];
    }

    this._subscribers[path].push(callback);

    // Return unsubscribe function
    return () => {
      this._subscribers[path] = this._subscribers[path].filter(
        (cb) => cb !== callback,
      );
    };
  }

  // Notify subscribers
  _notify(path, newValue, oldValue) {
    const subscribers = this._subscribers[path] || [];
    subscribers.forEach((callback) => callback(newValue, oldValue));
  }

  // Authentication helpers
  setAuth(tokens = {}, user = null, roles = null) {
    this._proxy.isAuthenticated = true;
    this._proxy.accessToken = tokens?.accessToken || null;
    this._proxy.refreshToken = tokens?.refreshToken || null;
    this._proxy.user = user;

    const resolvedRoles = Array.isArray(roles)
      ? roles
      : Array.isArray(user?.roles)
        ? user.roles
        : Array.isArray(tokens?.roles)
          ? tokens.roles
          : [];

    this.setRoles(resolvedRoles);
  }

  setRoles(roles = []) {
    const normalizedRoles = normalizeRoles(roles);
    this._proxy.roles = normalizedRoles;
    this._proxy.primaryRole = getPrimaryRole(normalizedRoles);
  }

  getRoles() {
    return [...(this._proxy.roles || [])];
  }

  getPrimaryRole() {
    return this._proxy.primaryRole || getPrimaryRole(this._proxy.roles || []);
  }

  hasAnyRole(roles = []) {
    return hasAnyRole(this._proxy.roles || [], roles);
  }

  isAuthenticated() {
    return this._proxy.isAuthenticated === true;
  }

  clearAuth() {
    this._proxy.isAuthenticated = false;
    this._proxy.accessToken = null;
    this._proxy.refreshToken = null;
    this._proxy.user = null;
    this.setRoles([]);
  }

  hasRole(roleName) {
    return this.hasAnyRole([roleName]);
  }

  isCandidate() {
    return this.hasRole("candidate");
  }

  isRecruiter() {
    return this.hasRole("recruiter");
  }

  isAdmin() {
    return this.hasRole("admin");
  }

  isModerator() {
    return this.hasRole("moderator");
  }

  // Toast notifications
  addToast(toast) {
    const id = Date.now();
    this._proxy.toasts = [...this._proxy.toasts, { id, ...toast }];
    return id;
  }

  removeToast(id) {
    this._proxy.toasts = this._proxy.toasts.filter((t) => t.id !== id);
  }

  // Loading state
  setLoading(loading) {
    this._proxy.loading = loading;
  }

  // Error state
  setError(error) {
    this._proxy.error = error;
  }

  clearError() {
    this._proxy.error = null;
  }

  // Get full state (for debugging)
  getState() {
    return JSON.parse(JSON.stringify(this._proxy));
  }

  // Reset state
  reset() {
    this._proxy.isAuthenticated = false;
    this._proxy.user = null;
    this.setRoles([]);
    this._proxy.accessToken = null;
    this._proxy.refreshToken = null;
    this._proxy.loading = false;
    this._proxy.error = null;
    this._proxy.toasts = [];
  }
}

// Singleton instance
export const store = new Store();
