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
// ── Public pages ────────────────────────────────────────────────────────────
import { initLandingPage } from "@pages/landing.page.js";
import { initLoginPage } from "@pages/login.page.js";
import { initLoginCompanyPage } from "@pages/login-company.page.js";
import { initRegisterPage } from "@pages/register.page.js";
import { initVacanciesPage } from "@pages/vacancies.page.js";
import { initVacancyDetailPage } from "@pages/vacancy-detail.page.js";
import { initResourcesPage } from "@pages/resources.page.js";
import { initResourceDetailPage } from "@pages/resource-detail.page.js";
import { initForumPage } from "@pages/forum.page.js";
import { initForumThreadPage } from "@pages/forum-thread.page.js";

// ── Company public profile (any user) ───────────────────────────────────────
import { initCompanyPublicProfilePage } from "@pages/company-public-profile.page.js";

// ── Candidate pages ──────────────────────────────────────────────────────────
import { initCandidateDashboardPage } from "@pages/candidate-dashboard.page.js";
import { initMyProfilePage } from "@pages/my-profile.page.js";
import { initEditMyProfilePage } from "@pages/edit-my-profile.page.js";
import { initSavedJobsPage } from "@pages/saved-jobs.page.js";
import { initApplicationsPage } from "@pages/applications.page.js";
import { initCandidateApplicationDetailPage } from "@pages/candidate-application-detail.page.js";
import { initCVPage } from "@pages/cv.page.js";

// ── Recruiter / company pages ────────────────────────────────────────────────
import { initEditCompanyProfilePage } from "@pages/edit-company-profile.page.js";
import { initMyVacanciesPage } from "@pages/my-vacancies.page.js";
import { initCreateVacancyPage } from "@pages/create-vacancy.page.js";
import { initEditVacancyPage } from "@pages/edit-vacancy.page.js";
import { initCompanyApplicantsPage } from "@pages/company-applicants.page.js";
import { initApplicantDetailPage } from "@pages/applicant-detail.page.js";
import { initCandidatePublicProfilePage } from "@pages/candidate-public-profile.page.js";
import { initCompanyMembersPage } from "@pages/company-members.page.js";
import { initCompanyDashboardPage } from "@pages/company-dashboard.page.js";
import { initRecruiterManagementPage } from "@pages/recruiter-management.page.js";
import { initRecruiterCompanyPage } from "@pages/recruiter-company.page.js";

// ── Admin / moderator pages ──────────────────────────────────────────────────
import { initAdminResourcesPage } from "@pages/admin-resources.page.js";
import { initAdminForumPage } from "@pages/admin-forum.page.js";
import { initAdminDashboardPage } from "@pages/admin-dashboard.page.js";
import { initAdminCompaniesPage } from "@pages/admin-companies.page.js";
import { initAdminUsersPage } from "@pages/admin-users.page.js";

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
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f9fafb;padding:40px 20px;">
      <div style="background:white;border-radius:16px;padding:48px;max-width:500px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.1);text-align:center;">
        <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="#ef4444" stroke-width="1.5" style="margin-bottom:24px;">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h1 style="font-size:24px;margin-bottom:12px;color:#111827;">No se puede conectar con el servidor</h1>
        <p style="color:#6b7280;margin-bottom:24px;">Verifica tu conexión a internet e intenta de nuevo.</p>
        <button id="retry-btn" style="padding:12px 32px;background:#3b82f6;color:white;border:none;border-radius:8px;font-size:16px;cursor:pointer;">
          Reintentar
        </button>
      </div>
    </div>
  `;
  document.getElementById("retry-btn").addEventListener("click", async () => {
    const healthy = await checkApiHealth();
    if (healthy) window.location.reload();
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
    config.ROUTES.LOGIN_COMPANY,
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
  // ── Public ──────────────────────────────────────────────────────────────
  router.on(config.ROUTES.LANDING, initLandingPage, { redirectIfAuth: true });
  router.on(config.ROUTES.LOGIN, initLoginPage, { redirectIfAuth: true });
  router.on(config.ROUTES.LOGIN_COMPANY, initLoginCompanyPage, {
    redirectIfAuth: true,
  });
  router.on(config.ROUTES.REGISTER_CANDIDATE, initRegisterPage, {
    redirectIfAuth: true,
  });

  router.on(config.ROUTES.VACANCIES, initVacanciesPage);

  router.on(config.ROUTES.VACANCY_DETAIL, async (params) => {
    await initVacancyDetailPage(params.id);
  });

  router.on(config.ROUTES.RESOURCES, initResourcesPage);

  router.on(config.ROUTES.RESOURCE_DETAIL, async (params) => {
    await initResourceDetailPage(params.id);
  });

  router.on(config.ROUTES.FORUM, initForumPage);

  router.on(config.ROUTES.FORUM_THREAD, async (params) => {
    await initForumThreadPage(params.id);
  });

  // Public company profile (any visitor can view)
  router.on(config.ROUTES.COMPANY_PUBLIC_PROFILE, async (params) => {
    await initCompanyPublicProfilePage(params.id);
  });

  // ── Candidate ────────────────────────────────────────────────────────────
  router.on(config.ROUTES.CANDIDATE_DASHBOARD, initCandidateDashboardPage, {
    requiresAuth: true,
    roles: [ROLE.CANDIDATE],
  });

  // Recruiter/admin: view a candidate's public profile by userId
  // MUST be registered BEFORE MY_PROFILE (/candidate/profile) to avoid :userId being shadowed
  router.on(config.ROUTES.CANDIDATE_PUBLIC_PROFILE, async (params) => {
    await initCandidatePublicProfilePage(params.userId);
  }, {
    requiresAuth: true,
    roles: [ROLE.RECRUITER, ROLE.ADMIN],
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

  router.on(config.ROUTES.APPLICATION_DETAIL, async (params) => {
    await initCandidateApplicationDetailPage(params.id);
  }, {
    requiresAuth: true,
    roles: [ROLE.CANDIDATE],
  });

  // ── Recruiter / Company ───────────────────────────────────────────────────
  // Company dashboard — puente's new dashboard with charts & stats
  router.on(config.ROUTES.COMPANY_DASHBOARD, initCompanyDashboardPage, {
    requiresAuth: true,
    roles: [ROLE.RECRUITER, ROLE.ADMIN],
  });

  // Company profile (internal) — puente's new recruiter company page
  router.on(config.ROUTES.COMPANY_PROFILE, initRecruiterCompanyPage, {
    requiresAuth: true,
    roles: [ROLE.RECRUITER, ROLE.ADMIN],
  });

  router.on(
    config.ROUTES.EDIT_COMPANY_PROFILE,
    (params, query) => initEditCompanyProfilePage(params, query),
    {
      requiresAuth: true,
      roles: [ROLE.RECRUITER, ROLE.ADMIN],
    },
  );

  router.on(config.ROUTES.MY_VACANCIES, initMyVacanciesPage, {
    requiresAuth: true,
    roles: [ROLE.RECRUITER, ROLE.ADMIN],
  });

  router.on(config.ROUTES.CREATE_VACANCY, initCreateVacancyPage, {
    requiresAuth: true,
    roles: [ROLE.RECRUITER, ROLE.ADMIN],
  });

  router.on(
    config.ROUTES.EDIT_VACANCY,
    async (params) => {
      await initEditVacancyPage(params.id);
    },
    {
      requiresAuth: true,
      roles: [ROLE.RECRUITER, ROLE.ADMIN],
    },
  );

  // IMPORTANT: register the more-specific /create route BEFORE /:id/applicants
  // Use christian's company applicants page (maintains postulation handling)
  router.on(config.ROUTES.VACANCY_APPLICANTS, async (params) => {
    await initCompanyApplicantsPage(params.id);
  }, {
    requiresAuth: true,
    roles: [ROLE.RECRUITER, ROLE.ADMIN],
  });

  router.on(config.ROUTES.APPLICANT_DETAIL, async (params) => {
    await initApplicantDetailPage(params.id);
  }, {
    requiresAuth: true,
    roles: [ROLE.RECRUITER, ROLE.ADMIN],
  });

  router.on(config.ROUTES.COMPANY_MEMBERS, initCompanyMembersPage, {
    requiresAuth: true,
    roles: [ROLE.RECRUITER, ROLE.ADMIN],
  });

  router.on(config.ROUTES.COMPANY_RECRUITERS, initRecruiterManagementPage, {
    requiresAuth: true,
    roles: [ROLE.RECRUITER, ROLE.ADMIN],
  });

  // ── Admin / Moderator ─────────────────────────────────────────────────────
  router.on(config.ROUTES.ADMIN_DASHBOARD, initAdminDashboardPage, {
    requiresAuth: true,
    roles: [ROLE.ADMIN],
  });

  router.on(config.ROUTES.ADMIN_COMPANIES, initAdminCompaniesPage, {
    requiresAuth: true,
    roles: [ROLE.ADMIN],
  });

  router.on(config.ROUTES.ADMIN_USERS, initAdminUsersPage, {
    requiresAuth: true,
    roles: [ROLE.ADMIN],
  });

  router.on(
    config.ROUTES.ADMIN_RESOURCES,
    (params, query) => initAdminResourcesPage(params, query),
    {
      requiresAuth: true,
      roles: [ROLE.ADMIN, ROLE.MODERATOR],
    },
  );

  router.on(
    config.ROUTES.ADMIN_FORUM,
    (params, query) => initAdminForumPage(params, query),
    {
      requiresAuth: true,
      roles: [ROLE.ADMIN, ROLE.MODERATOR],
    },
  );
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
    return;
  }

  // Register all routes
  registerRoutes();

  // Initialize the router (handles initial route + hash changes)
  router.init();
}

// Start the application
init();
