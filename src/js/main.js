// TrabajaHoy - Main Application Entry Point
import { store } from "./core/store.js";
import { config } from "./core/config.js";
import { router } from "./core/router.js";
import { storage } from "./utils/storage.js";
import { authService } from "./services/auth.service.js";
import { api } from "./services/api.js";
import {
  ROLE,
  getDashboardRouteForRoles,
  resolveRolesFromPayload,
} from "./core/roles.js";
import { renderNavbar, renderPage, renderRoleShell } from "./utils/ui.js";

// Page controllers
import { initLandingPage } from "@pages/landing.page.js";
import { initLoginPage } from "@pages/login.page.js";
import { initRegisterPage } from "@pages/register.page.js";
import { initVacanciesPage } from "@pages/vacancies.page.js";
import { initVacancyDetailPage } from "@pages/vacancy-detail.page.js";
import { initCandidateDashboardPage } from "@pages/candidate-dashboard.page.js";
import { initMyProfilePage } from "@pages/my-profile.page.js";
import { initEditMyProfilePage } from "@pages/edit-my-profile.page.js";
import { initSavedJobsPage } from "@pages/saved-jobs.page.js";
import { initApplicationsPage } from "@pages/applications.page.js";
import { initResourcesPage } from "@pages/resources.page.js";
import { initForumPage } from "@pages/forum.page.js";
import { initCVPage } from "@pages/cv.page.js";
import { initCreateVacancyPage } from "@pages/create-vacancy.page.js";
import { initMyVacanciesPage } from "@pages/my-vacancies.page.js";

let logoutInProgress = false;

// ============================================================
// Loading Helpers
// ============================================================
function showLoading(message = "Cargando...") {
  document.getElementById("app").innerHTML = `
    <div class="app-loading">
      <div class="app-loading__spinner"></div>
      <p class="app-loading__text">${message}</p>
    </div>
  `;
}

// ============================================================
// API Health Check
// ============================================================
async function checkApiHealth() {
  try {
    const response = await api.get("/health");
    const isHealthy =
      response?.status === "success" ||
      response?.success === true ||
      response?.data?.success === true;
    store.set("apiHealthy", isHealthy);
    return isHealthy;
  } catch (error) {
    console.error("API health check failed:", error.message);
    store.set("apiHealthy", false);
    return false;
  }
}

function renderApiError() {
  document.getElementById("app").innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f9fafb; padding: 40px 20px;">
      <div style="background: white; border-radius: 16px; padding: 48px; max-width: 500px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.1); text-align: center;">
        <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="#ef4444" stroke-width="1.5" style="margin-bottom: 24px;">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h1 style="font-size: 24px; margin-bottom: 12px; color: #111827;">No se puede conectar con el servidor</h1>
        <p style="color: #6b7280; margin-bottom: 24px;">Verifica tu conexión a internet e intenta de nuevo.</p>
        <button id="retry-btn" style="padding: 12px 32px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">
          Reintentar
        </button>
      </div>
    </div>
  `;

  document.getElementById("retry-btn").addEventListener("click", async () => {
    const healthy = await checkApiHealth();
    if (healthy) {
      window.location.reload();
    }
  });
}

function getCurrentPathFromHash() {
  const hash = window.location.hash.slice(1);
  return (hash || config.ROUTES.LANDING).split("?")[0];
}

function isAuthEntrypointPath(path) {
  return [
    config.ROUTES.LANDING,
    config.ROUTES.LOGIN,
    config.ROUTES.REGISTER_CANDIDATE,
  ].includes(path);
}

function bindGlobalAuthUiEvents() {
  document.addEventListener(
    "click",
    async (event) => {
      const logoutBtn = event.target.closest("#logout-btn");
      if (!logoutBtn) return;

      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }

      if (logoutInProgress) return;

      logoutInProgress = true;
      try {
        await authService.logout();
        window.location.hash = "#/";
      } catch (error) {
        console.error("Logout error:", error);
      } finally {
        logoutInProgress = false;
      }
    },
    true,
  );
}

// ============================================================
// Restore Session
// ============================================================
async function restoreSession() {
  const { accessToken, refreshToken, user, roles } = storage.getAuthSession();
  const storedRoles = Array.isArray(roles) ? roles : [];
  const resolvedRoles = resolveRolesFromPayload({ user, roles });
  const hasUserObject = Boolean(
    user && typeof user === "object" && !Array.isArray(user),
  );
  const hasAccessToken = Boolean(accessToken);
  const hasSessionArtifacts =
    hasAccessToken ||
    Boolean(refreshToken) ||
    hasUserObject ||
    storedRoles.length > 0;

  if (!hasAccessToken) {
    if (hasSessionArtifacts) {
      console.warn("Discarding stale auth artifacts: missing access token.");
      store.clearAuth();
      storage.clearAuthSession();
    }
    return false;
  }

  if (!hasUserObject) {
    console.warn("Discarding invalid session: missing user payload.");
    store.clearAuth();
    storage.clearAuthSession();
    return false;
  }

  store.setAuth({ accessToken, refreshToken }, user, resolvedRoles);
  storage.setAuthSession({
    accessToken,
    refreshToken,
    user,
    roles: store.getRoles(),
  });

  if (store.getRoles().length === 0) {
    try {
      const profile = await authService.fetchCurrentUserProfile();
      storage.setAuthSession({
        accessToken,
        refreshToken,
        user: profile.user,
        roles: profile.roles,
      });
    } catch (error) {
      console.warn("Session restoration failed:", error?.message || error);
      store.clearAuth();
      storage.clearAuthSession();
      return false;
    }

    if (store.getRoles().length === 0) {
      console.warn(
        "Discarding session: authenticated user has no assigned role.",
      );
      store.clearAuth();
      storage.clearAuthSession();
      return false;
    }
  }
  return true;
}

// ============================================================
// Register Routes
// ============================================================
function registerRoutes() {
  // Public routes
  router.on(config.ROUTES.LANDING, initLandingPage, {
    redirectIfAuth: true,
  });

  router.on(config.ROUTES.LOGIN, initLoginPage, {
    redirectIfAuth: true,
  });

  router.on(config.ROUTES.REGISTER_CANDIDATE, initRegisterPage, {
    redirectIfAuth: true,
  });

  router.on(config.ROUTES.VACANCIES, initVacanciesPage);

  // Dynamic route: /vacancies/:id
  router.on(config.ROUTES.VACANCY_DETAIL, async (params, query) => {
    await initVacancyDetailPage(params.id);
  });

  // Candidate routes (require auth + candidate role)
  router.on(config.ROUTES.CANDIDATE_DASHBOARD, initCandidateDashboardPage, {
    requiresAuth: true,
    roles: [ROLE.CANDIDATE],
  });

  router.on(config.ROUTES.MY_PROFILE, initMyProfilePage, {
    requiresAuth: true,
    roles: [ROLE.CANDIDATE],
  });

  router.on(config.ROUTES.EDIT_PROFILE, initEditMyProfilePage, {
    requiresAuth: true,
    roles: [ROLE.CANDIDATE],
  });

  router.on(config.ROUTES.MANAGE_CV, initCVPage, {
    requiresAuth: true,
    roles: [ROLE.CANDIDATE],
  });

  router.on(config.ROUTES.SAVED_JOBS, initSavedJobsPage, {
    requiresAuth: true,
    roles: [ROLE.CANDIDATE],
  });

  router.on(config.ROUTES.MY_APPLICATIONS, initApplicationsPage, {
    requiresAuth: true,
    roles: [ROLE.CANDIDATE],
  });

  // Public content routes
  router.on(config.ROUTES.RESOURCES, initResourcesPage);
  router.on(config.ROUTES.FORUM, initForumPage);

  // Company routes
  router.on(
    config.ROUTES.COMPANY_DASHBOARD,
    createPlaceholderPage(
      "Panel de Empresa",
      "Gestiona tus ofertas de empleo.",
    ),
    {
      requiresAuth: true,
      roles: [ROLE.RECRUITER, ROLE.ADMIN],
    },
  );

  router.on(config.ROUTES.MY_VACANCIES, initMyVacanciesPage, {
    requiresAuth: true,
    roles: [ROLE.RECRUITER, ROLE.ADMIN],
  });

  router.on(
    config.ROUTES.COMPANY_PROFILE,
    createPlaceholderPage("Perfil de Empresa", "Información de tu empresa."),
    {
      requiresAuth: true,
      roles: [ROLE.RECRUITER, ROLE.ADMIN],
    },
  );

  router.on(config.ROUTES.CREATE_VACANCY, initCreateVacancyPage, {
    requiresAuth: true,
    roles: [ROLE.RECRUITER, ROLE.ADMIN],
  });

  // Admin routes
  router.on(
    config.ROUTES.ADMIN_DASHBOARD,
    createPlaceholderPage("Panel de Admin", "Administración del sistema."),
    {
      requiresAuth: true,
      roles: [ROLE.ADMIN],
    },
  );

  router.on(
    config.ROUTES.ADMIN_USERS,
    createPlaceholderPage(
      "Gestión de Usuarios",
      "Administra los usuarios del sistema.",
    ),
    {
      requiresAuth: true,
      roles: [ROLE.ADMIN],
    },
  );
}

// Helper to create a simple placeholder page
function createPlaceholderPage(title, description) {
  return async function (params, query) {
    const app = document.getElementById("app");
    const isAuthenticated = store.get("isAuthenticated");
    const user = store.get("user");
    const userRoles = store.getRoles();
    const primaryRole = store.getPrimaryRole();
    const panelRoute = getDashboardRouteForRoles(
      userRoles,
      config.ROUTES.LANDING,
    );
    const fullName = user
      ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
      : "Usuario";

    const navbar = renderNavbar({
      activeRoute: panelRoute,
      isAuthenticated,
      user,
      roles: userRoles,
      primaryRole,
      extraHeaderContent: isAuthenticated
        ? `<span class="main-placeholder__user">${fullName}</span>`
        : "",
    });

    const shell = renderRoleShell({
      title,
      subtitle: description,
      roles: userRoles,
      primaryRole,
      actions: `<a href="#${panelRoute}" class="btn btn--outline">Volver al panel</a>`,
      content: `
        <div class="main-placeholder__empty">
          <svg viewBox="0 0 24 24" width="80" height="80" fill="none" stroke="#d1d5db" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="9" x2="15" y2="15"></line>
            <line x1="15" y1="9" x2="9" y2="15"></line>
          </svg>
          <p>Esta sección estará disponible próximamente.</p>
        </div>
      `,
    });

    const extraStyles = `
      .role-placeholder-page {
        min-height: calc(100vh - 70px);
        background: #f9fafb;
      }
      .main-placeholder__user {
        color: #6b7280;
        font-size: 13px;
      }
      .main-placeholder__empty {
        text-align: center;
        color: #9ca3af;
        padding: 26px 12px;
      }
      .main-placeholder__empty svg {
        margin-bottom: 16px;
      }
      .main-placeholder__empty p {
        margin: 0;
        font-size: 14px;
      }
      @media (max-width: 768px) {
        .main-placeholder__user {
          display: none;
        }
      }
    `;

    app.innerHTML = renderPage({
      navbar,
      main: shell,
      pageClass: "role-placeholder-page",
      extraStyles,
    });
  };
}

// ============================================================
// Initialize Application
// ============================================================
async function init() {
  bindGlobalAuthUiEvents();

  // Restore session
  const sessionRestored = await restoreSession();

  if (sessionRestored) {
    const currentPath = getCurrentPathFromHash();
    if (isAuthEntrypointPath(currentPath)) {
      const dashboardRoute = getDashboardRouteForRoles(
        store.getRoles(),
        config.ROUTES.LANDING,
      );
      window.location.hash = `#${dashboardRoute}`;
    }
  }

  // Check API health
  const apiHealthy = await checkApiHealth();
  if (!apiHealthy) {
    renderApiError();
    return; // Stop initialization if API is down
  }

  // Register all routes
  registerRoutes();

  // Initialize the router (handles initial route + hash changes)
  router.init();
}

// Start the application
init();
