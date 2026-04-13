// Client-side Router
import { config } from "@core/config";
import { store } from "@core/store";
import { getDashboardRouteForRoles } from "@core/roles";

class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.beforeEachHooks = [];
    this.afterEachHooks = [];
  }

  // Register a route
  on(path, handler, options = {}) {
    this.routes[path] = {
      handler,
      requiresAuth: options.requiresAuth || false,
      roles: options.roles || [],
      redirectIfAuth: options.redirectIfAuth || false,
    };
  }

  // Navigate to a route
  navigate(path) {
    window.location.hash = `#${path}`;
  }

  // Get current path from hash
  getPath() {
    const hash = window.location.hash.slice(1) || "/";
    return hash.split("?")[0]; // Remove query params
  }

  // Get query parameters
  getQueryParams() {
    const hash = window.location.hash || "";
    const queryString = hash.split("?")[1];
    if (!queryString) return {};

    return queryString.split("&").reduce((params, param) => {
      const [key, value] = param.split("=");
      params[key] = decodeURIComponent(value || "");
      return params;
    }, {});
  }

  // Get route parameters (e.g., /vacancies/:id)
  getRouteParams(path, route) {
    const pathParts = path.split("/");
    const routeParts = route.split("/");
    const params = {};

    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(":")) {
        const paramName = routeParts[i].slice(1);
        params[paramName] = pathParts[i];
      }
    }

    return params;
  }

  // Match route
  matchRoute(path) {
    // Exact match
    if (this.routes[path]) {
      return { route: this.routes[path], path, params: {} };
    }

    // Dynamic route matching
    for (const routePath in this.routes) {
      if (this.isRouteMatch(path, routePath)) {
        const params = this.getRouteParams(path, routePath);
        return { route: this.routes[routePath], path: routePath, params };
      }
    }

    return null;
  }

  // Check if path matches route pattern
  isRouteMatch(path, route) {
    const pathParts = path.split("/");
    const routeParts = route.split("/");

    if (pathParts.length !== routeParts.length) {
      return false;
    }

    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(":")) {
        continue; // Dynamic segment, always matches
      }
      if (pathParts[i] !== routeParts[i]) {
        return false;
      }
    }

    return true;
  }

  // Before each navigation hook
  beforeEach(hook) {
    this.beforeEachHooks.push(hook);
  }

  // After each navigation hook
  afterEach(hook) {
    this.afterEachHooks.push(hook);
  }

  // Run before hooks
  async runBeforeEach(to, from) {
    for (const hook of this.beforeEachHooks) {
      const result = await hook(to, from);
      if (result === false) {
        return false; // Navigation cancelled
      }
    }
    return true;
  }

  // Run after hooks
  runAfterEach(to, from) {
    this.afterEachHooks.forEach((hook) => hook(to, from));
  }

  // Authentication guard
  async authGuard(to) {
    const route = to.route;

    // Check if route requires authentication
    if (route.requiresAuth && !store.get("isAuthenticated")) {
      return "/login";
    }

    // Check if route requires specific roles
    if (route.roles && route.roles.length > 0) {
      const userRoles = store.get("roles") || [];
      const hasRequiredRole = route.roles.some((role) =>
        userRoles.includes(role),
      );

      if (!hasRequiredRole) {
        return getDashboardRouteForRoles(userRoles, config.ROUTES.LANDING);
      }
    }

    // Redirect authenticated users away from login/register
    if (route.redirectIfAuth && store.get("isAuthenticated")) {
      const userRoles = store.get("roles") || [];
      return getDashboardRouteForRoles(userRoles, config.ROUTES.LANDING);
    }

    return true;
  }

  // Initialize router
  init() {
    // Add default auth guard
    this.beforeEach(async (to) => {
      return await this.authGuard(to);
    });

    // Handle initial route
    const handleRoute = async () => {
      const path = this.getPath();
      const matched = this.matchRoute(path);

      if (!matched) {
        // Route not found, redirect to landing
        this.navigate(config.ROUTES.LANDING);
        return;
      }

      const from = this.currentRoute;
      const to = { ...matched, query: this.getQueryParams() };

      // Run before hooks
      const guardResult = await this.runBeforeEach(to, from);
      if (guardResult === false) return; // Navigation cancelled

      // Handle redirect from guard
      if (typeof guardResult === "string") {
        this.navigate(guardResult);
        return;
      }

      // Execute route handler
      this.currentRoute = to;
      matched.route.handler(to.params, to.query);

      // Run after hooks
      this.runAfterEach(to, from);

      // Scroll to top
      window.scrollTo(0, 0);
    };

    // Listen to hash changes
    window.addEventListener("hashchange", handleRoute);

    // Handle initial load
    handleRoute();
  }
}

// Singleton instance
export const router = new Router();
