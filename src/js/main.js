// TrabajaHoy - Main Application Entry Point
import { store } from './core/store.js';
import { config } from './core/config.js';
import { router } from './core/router.js';
import { storage } from './utils/storage.js';
import { authService } from './services/auth.service.js';
import { api } from './services/api.js';

// Page controllers
import { initLandingPage } from '@pages/landing.page.js';
import { initLoginPage } from '@pages/login.page.js';
import { initRegisterPage } from '@pages/register.page.js';
import { initVacanciesPage } from '@pages/vacancies.page.js';
import { initVacancyDetailPage } from '@pages/vacancy-detail.page.js';
import { initCandidateDashboardPage } from '@pages/candidate-dashboard.page.js';
import { initMyProfilePage } from '@pages/my-profile.page.js';
import { initEditMyProfilePage } from '@pages/edit-my-profile.page.js';
import { initSavedJobsPage } from '@pages/saved-jobs.page.js';
import { initApplicationsPage } from '@pages/applications.page.js';
import { initResourcesPage } from '@pages/resources.page.js';
import { initForumPage } from '@pages/forum.page.js';
import { initCVPage } from '@pages/cv.page.js';

// ============================================================
// Loading Helpers
// ============================================================
function showLoading(message = 'Cargando...') {
  document.getElementById('app').innerHTML = `
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
    const response = await api.get('/health');
    const isHealthy = response.data?.success === true;
    store.set('apiHealthy', isHealthy);
    console.log('API Health:', isHealthy ? 'OK' : 'DEGRADED', response.data);
    return isHealthy;
  } catch (error) {
    console.error('API Health Check FAILED:', error.message);
    store.set('apiHealthy', false);
    return false;
  }
}

function renderApiError() {
  document.getElementById('app').innerHTML = `
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

  document.getElementById('retry-btn').addEventListener('click', async () => {
    const healthy = await checkApiHealth();
    if (healthy) {
      window.location.reload();
    }
  });
}

// ============================================================
// Restore Session
// ============================================================
function restoreSession() {
  const token = storage.getAccessToken();
  const user = storage.getUser();
  
  if (token && user) {
    store.setAuth(
      { accessToken: token, refreshToken: storage.getRefreshToken() },
      user
    );
    store.set('roles', storage.getRoles());
    console.log('Session restored:', user.email);
    return true;
  }
  return false;
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
    roles: ['candidate'],
  });

  router.on(config.ROUTES.MY_PROFILE, initMyProfilePage, {
    requiresAuth: true,
    roles: ['candidate'],
  });

  router.on(config.ROUTES.EDIT_PROFILE, initEditMyProfilePage, {
    requiresAuth: true,
    roles: ['candidate'],
  });

  router.on(config.ROUTES.MANAGE_CV, initCVPage, {
    requiresAuth: true,
    roles: ['candidate'],
  });

  router.on(config.ROUTES.SAVED_JOBS, initSavedJobsPage, {
    requiresAuth: true,
    roles: ['candidate'],
  });

  router.on(config.ROUTES.MY_APPLICATIONS, initApplicationsPage, {
    requiresAuth: true,
    roles: ['candidate'],
  });

  // Public content routes
  router.on(config.ROUTES.RESOURCES, initResourcesPage);
  router.on(config.ROUTES.FORUM, initForumPage);

  // Company routes
  router.on(config.ROUTES.COMPANY_DASHBOARD, createPlaceholderPage('Panel de Empresa', 'Gestiona tus ofertas de empleo.'), {
    requiresAuth: true,
    roles: ['recruiter', 'admin'],
  });

  router.on(config.ROUTES.COMPANY_PROFILE, createPlaceholderPage('Perfil de Empresa', 'Información de tu empresa.'), {
    requiresAuth: true,
    roles: ['recruiter', 'admin'],
  });

  router.on(config.ROUTES.CREATE_VACANCY, createPlaceholderPage('Crear Vacante', 'Publica una nueva oferta de empleo.'), {
    requiresAuth: true,
    roles: ['recruiter', 'admin'],
  });

  // Admin routes
  router.on(config.ROUTES.ADMIN_DASHBOARD, createPlaceholderPage('Panel de Admin', 'Administración del sistema.'), {
    requiresAuth: true,
    roles: ['admin'],
  });

  router.on(config.ROUTES.ADMIN_USERS, createPlaceholderPage('Gestión de Usuarios', 'Administra los usuarios del sistema.'), {
    requiresAuth: true,
    roles: ['admin'],
  });
}

// Helper to create a simple placeholder page
function createPlaceholderPage(title, description) {
  return async function(params, query) {
    const app = document.getElementById('app');
    const isAuthenticated = store.get('isAuthenticated');
    const user = store.get('user');
    const fullName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Usuario';

    app.innerHTML = `
      <header class="site-header">
        <div class="container site-header__container">
          <a href="#/" class="site-header__logo-link" aria-label="Inicio">
            <img src="/logoPortal.png" alt="TrabajaHoy" class="site-header__logo" />
          </a>
          <nav class="site-header__nav" aria-label="Navegación principal">
            <a href="#/vacancies" class="site-header__nav-link">Buscar empleos</a>
            <a href="#/resources" class="site-header__nav-link">Recursos</a>
            <a href="#/forum" class="site-header__nav-link">Foro</a>
          </nav>
          <div class="site-header__actions">
            ${isAuthenticated
              ? `<a href="#/candidate/dashboard" class="btn btn--outline">Mi Panel</a>
                 <span style="color: #374151; font-size: 14px;">${fullName}</span>
                 <button id="logout-btn" style="background: none; border: 1px solid #d1d5db; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 14px;">Salir</button>`
              : `<a href="#/login" class="btn btn--login">Login</a>
                 <a href="#/register" class="btn btn--register">Registrarse</a>`
            }
          </div>
        </div>
      </header>

      <main style="min-height: calc(100vh - 70px); display: flex; align-items: center; justify-content: center; background: #f9fafb;">
        <div style="text-align: center; padding: 60px 20px;">
          <svg viewBox="0 0 24 24" width="80" height="80" fill="none" stroke="#d1d5db" stroke-width="1.5" style="margin-bottom: 24px;">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="9" x2="15" y2="15"></line>
            <line x1="15" y1="9" x2="9" y2="15"></line>
          </svg>
          <h1 style="font-size: 28px; color: #111827; margin-bottom: 12px;">${title}</h1>
          <p style="color: #6b7280; font-size: 16px; margin-bottom: 32px;">${description}</p>
          <p style="color: #9ca3af; font-size: 14px;">Esta sección estará disponible próximamente.</p>
        </div>
      </main>
    `;

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          await authService.logout();
          window.location.hash = '#/';
        } catch (error) {
          console.error('Logout error:', error);
        }
      });
    }
  };
}

// ============================================================
// Initialize Application
// ============================================================
async function init() {
  console.log('=== TrabajaHoy App Starting ===');
  console.log('API URL:', config.API_BASE_URL);

  // Restore session
  restoreSession();

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

  console.log('=== TrabajaHoy App Ready ===');
}

// Start the application
init();
