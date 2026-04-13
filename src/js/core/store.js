// Global State Management using Proxy Pattern

class Store {
  constructor() {
    this._state = {
      // Authentication
      isAuthenticated: false,
      user: null,
      roles: [],
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
    const keys = path.split('.');
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
    const keys = path.split('.');
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
      this._subscribers[path] = this._subscribers[path].filter(cb => cb !== callback);
    };
  }

  // Notify subscribers
  _notify(path, newValue, oldValue) {
    const subscribers = this._subscribers[path] || [];
    subscribers.forEach(callback => callback(newValue, oldValue));
  }

  // Authentication helpers
  setAuth(tokens, user) {
    this._proxy.isAuthenticated = true;
    this._proxy.accessToken = tokens.accessToken;
    this._proxy.refreshToken = tokens.refreshToken;
    this._proxy.user = user;
  }

  clearAuth() {
    this._proxy.isAuthenticated = false;
    this._proxy.accessToken = null;
    this._proxy.refreshToken = null;
    this._proxy.user = null;
    this._proxy.roles = [];
  }

  hasRole(roleName) {
    return this._proxy.roles.includes(roleName);
  }

  isCandidate() {
    return this.hasRole('candidate');
  }

  isRecruiter() {
    return this.hasRole('recruiter');
  }

  isAdmin() {
    return this.hasRole('admin');
  }

  isModerator() {
    return this.hasRole('moderator');
  }

  // Toast notifications
  addToast(toast) {
    const id = Date.now();
    this._proxy.toasts = [...this._proxy.toasts, { id, ...toast }];
    return id;
  }

  removeToast(id) {
    this._proxy.toasts = this._proxy.toasts.filter(t => t.id !== id);
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
    this._proxy.roles = [];
    this._proxy.accessToken = null;
    this._proxy.refreshToken = null;
    this._proxy.loading = false;
    this._proxy.error = null;
    this._proxy.toasts = [];
  }
}

// Singleton instance
export const store = new Store();
