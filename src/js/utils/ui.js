// UI Helpers
import "../../styles/global.css";
import {
  getDashboardRouteForRoles,
  getNavigationForRoles,
  getPrimaryRole,
  getRoleLabel,
  normalizeRoles,
} from "@core/roles";
import { store } from "@core/store";

// ============================================================
// Global Loading
// ============================================================
export function showLoading(message = "Cargando...") {
  const app = document.getElementById("app");
  if (app) {
    app.innerHTML = `
      <div class="app-loading">
        <div class="app-loading__spinner"></div>
        <p class="app-loading__text">${message}</p>
      </div>
    `;
  }
}

export function showError(title, message) {
  const app = document.getElementById("app");
  if (app) {
    app.innerHTML = `
      <div class="app-error">
        <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="#ef4444" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h2>${title}</h2>
        <p>${message}</p>
      </div>
    `;
  }
}

export function getAuthUiContext() {
  const isAuthenticated =
    typeof store.isAuthenticated === "function"
      ? store.isAuthenticated()
      : store.get("isAuthenticated") === true;
  const user = store.get("user") || null;
  const roles =
    typeof store.getRoles === "function"
      ? store.getRoles()
      : normalizeRoles(user?.roles || []);
  const primaryRole =
    typeof store.getPrimaryRole === "function"
      ? store.getPrimaryRole()
      : getPrimaryRole(roles);

  return {
    isAuthenticated,
    user,
    roles,
    primaryRole,
  };
}

export function resolveRequestErrorMessage(
  error,
  fallback = "Ocurrio un error inesperado.",
) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

export function renderSectionHeader({
  title = "",
  subtitle = "",
  actions = "",
  className = "",
} = {}) {
  return `
    <div class="th-section-header ${className}">
      <div>
        <h1 class="th-section-header__title">${title}</h1>
        ${subtitle ? `<p class="th-section-header__subtitle">${subtitle}</p>` : ""}
      </div>
      ${actions ? `<div class="th-section-header__actions">${actions}</div>` : ""}
    </div>
  `;
}

export function renderContentState({
  type = "empty",
  title = "Sin informacion",
  message = "",
  actionLabel = "",
  actionHref = "",
  icon = "briefcase",
  compact = false,
} = {}) {
  const iconSvg =
    icon === "alert"
      ? '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'
      : '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>';

  return `
    <div class="th-content-state th-content-state--${type}${compact ? " th-content-state--compact" : ""}">
      <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5">
        ${iconSvg}
      </svg>
      <h3>${title}</h3>
      ${message ? `<p>${message}</p>` : ""}
      ${actionHref && actionLabel ? `<a href="${actionHref}" class="btn btn--primary">${actionLabel}</a>` : ""}
    </div>
  `;
}

export function renderVacancyCard({
  vacancy = {},
  showSaveAction = true,
  detailHref = "",
  saveButtonLabel = "Guardar",
  saveButtonClass = "btn btn--outline",
} = {}) {
  const modalityLabels = {
    remote: "Remoto",
    hybrid: "Híbrido",
    onsite: "Presencial",
  };

  const typeLabels = {
    "full-time": "Tiempo completo",
    "part-time": "Medio tiempo",
    contract: "Contrato",
    freelance: "Freelance",
    internship: "Prácticas",
  };

  const levelLabels = {
    junior: "Junior",
    mid: "Mid",
    senior: "Senior",
    lead: "Lead",
    manager: "Manager",
    director: "Director",
  };

  const resolvedHref = detailHref || `#/vacancies/${vacancy.id}`;

  return `
    <article class="vacancy-card" data-vacancy-id="${vacancy.id}" tabindex="0" role="article" aria-label="Vacante ${vacancy.title || "Puesto"}">
      <div class="vacancy-card__header">
        <div class="vacancy-card__logo">${(vacancy.companyName || "C")[0]}</div>
        <div class="vacancy-card__info">
          <p class="vacancy-card__company">${vacancy.companyName || "Empresa"}</p>
          <h3 class="vacancy-card__title">${vacancy.title || "Puesto"}</h3>
        </div>
      </div>

      <div class="vacancy-card__meta">
        ${
          vacancy.city
            ? `<span class="vacancy-card__meta-item"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>${vacancy.city}${vacancy.country ? `, ${vacancy.country}` : ""}</span>`
            : ""
        }
        ${vacancy.modality ? `<span class="vacancy-card__meta-item">${modalityLabels[vacancy.modality] || vacancy.modality}</span>` : ""}
        ${vacancy.type ? `<span class="vacancy-card__meta-item">${typeLabels[vacancy.type] || vacancy.type}</span>` : ""}
        ${vacancy.level ? `<span class="vacancy-card__meta-item">${levelLabels[vacancy.level] || vacancy.level}</span>` : ""}
      </div>

      ${vacancy.salaryMin ? `<div class="vacancy-card__salary">$${vacancy.salaryMin.toLocaleString()} - $${(vacancy.salaryMax || vacancy.salaryMin).toLocaleString()} ${vacancy.currency || ""}</div>` : ""}

      <div class="vacancy-card__actions">
        <a href="${resolvedHref}" class="btn btn--primary">Ver Detalles</a>
        ${showSaveAction ? `<button class="${saveButtonClass}" data-save-job="${vacancy.id}">${saveButtonLabel}</button>` : ""}
      </div>
    </article>
  `;
}

export function renderAuthShell({
  variant = "login",
  cardClass = "",
  eyebrow = "",
  title = "",
  subtitle = "",
  form = "",
  footer = "",
} = {}) {
  return `
    <section class="auth-page auth-page--${variant}">
      <div class="auth-page__glow auth-page__glow--left"></div>
      <div class="auth-page__glow auth-page__glow--right"></div>

      <div class="auth-brand">
        <a href="#/" aria-label="Volver al inicio">
          <img src="/logoPortal.png" alt="Logo TrabajaHoy" class="auth-brand__logo" />
        </a>
      </div>

      <section class="auth-card ${cardClass}" aria-labelledby="auth-title">
        <header class="auth-card__header">
          ${eyebrow ? `<p class="auth-card__eyebrow">${eyebrow}</p>` : ""}
          <h1 class="auth-card__title" id="auth-title">${title}</h1>
          ${subtitle ? `<p class="auth-card__subtitle">${subtitle}</p>` : ""}
        </header>

        ${form}
        ${footer ? `<div class="auth-card__footer">${footer}</div>` : ""}
      </section>
    </section>
  `;
}

export function renderAuthErrorBlock(id = "auth-form-error") {
  return `<div class="auth-form__error" id="${id}" role="alert" aria-live="polite" style="display:none;"></div>`;
}

// ============================================================
// Shared Navbar
// ============================================================

function toRoutePath(activeRoute = "") {
  if (!activeRoute) return "";
  return activeRoute.startsWith("/") ? activeRoute : `/${activeRoute}`;
}

function isActiveLink(href, activePath) {
  const hrefPath = href.replace(/^#/, "");
  if (!activePath) return hrefPath === "/";
  if (hrefPath === "/") return activePath === "/";
  return activePath === hrefPath || activePath.startsWith(`${hrefPath}/`);
}

/**
 * Renders a consistent navbar across all pages.
 * @param {Object} options
 * @param {string} options.activeRoute - e.g. 'vacancies', 'resources', 'forum'
 * @param {boolean} options.isAuthenticated
 * @param {Object} [options.user]
 * @param {string[]} [options.roles]
 * @param {string|null} [options.primaryRole]
 * @param {string} [options.extraHeaderContent] - Extra HTML inside header actions
 * @returns {string} HTML string
 */
export function renderNavbar({
  activeRoute = "",
  isAuthenticated = false,
  user = null,
  roles = [],
  primaryRole = null,
  extraHeaderContent = "",
} = {}) {
  const activePath = toRoutePath(activeRoute);
  const fullName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
    : "";

  const fallbackStoreRoles =
    typeof store.getRoles === "function" ? store.getRoles() : [];
  const resolvedRoles = normalizeRoles(
    Array.isArray(roles) && roles.length > 0
      ? roles
      : Array.isArray(user?.roles)
        ? user.roles
        : fallbackStoreRoles,
  );
  const resolvedPrimaryRole =
    primaryRole ||
    (typeof store.getPrimaryRole === "function"
      ? store.getPrimaryRole()
      : null) ||
    getPrimaryRole(resolvedRoles);
  const dashboardRoute = getDashboardRouteForRoles(resolvedRoles, "/");
  const navigation = getNavigationForRoles(resolvedRoles, isAuthenticated);

  const navLinks = navigation
    .map((link) => {
      const isActive = isActiveLink(link.href, activePath);
      return `<a href="${link.href}" class="site-header__nav-link${isActive ? " site-header__nav-link--active" : ""}">${link.label}</a>`;
    })
    .join("\n");

  const authSection = isAuthenticated
    ? `<a href="#${dashboardRoute}" class="site-header__dashboard-link" aria-label="Ir al panel">Panel</a>
       <span class="site-header__role-badge site-header__role-badge--${resolvedPrimaryRole || "guest"}">${getRoleLabel(resolvedPrimaryRole)}</span>
       <span class="site-header__username">${fullName || "Usuario"}</span>
       <button class="site-header__logout-btn" id="logout-btn" aria-label="Cerrar sesión">
         <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
           <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
           <polyline points="16 17 21 12 16 7"></polyline>
           <line x1="21" y1="12" x2="9" y2="12"></line>
         </svg>
       </button>`
    : `<a href="#/login" class="btn btn--login">Login</a>
       <a href="#/register" class="btn btn--register">Registrarse</a>`;

  return `
    <header class="site-header">
      <div class="site-header__container">
        <a href="#/" class="site-header__logo-link" aria-label="Inicio">
          <img src="${import.meta.env.BASE_URL}logoPortal.png" alt="TrabajaHoy" class="site-header__logo" />
        </a>
        <nav class="site-header__nav" aria-label="Navegación principal">
          ${navLinks}
        </nav>
        <div class="site-header__actions">
          ${authSection}
          ${extraHeaderContent || ""}
        </div>
      </div>
    </header>
  `;
}

/**
 * Renders a shared authenticated shell header for role-based pages.
 * @param {Object} options
 * @param {string} options.title
 * @param {string} [options.subtitle]
 * @param {string} [options.content]
 * @param {string[]} [options.roles]
 * @param {string|null} [options.primaryRole]
 * @param {string} [options.actions]
 * @param {string} [options.shellClass]
 * @returns {string}
 */
export function renderRoleShell({
  title,
  subtitle = "",
  content = "",
  roles = [],
  primaryRole = null,
  actions = "",
  shellClass = "",
} = {}) {
  const fallbackStoreRoles =
    typeof store.getRoles === "function" ? store.getRoles() : [];
  const resolvedRoles = normalizeRoles(
    Array.isArray(roles) && roles.length ? roles : fallbackStoreRoles,
  );
  const resolvedPrimaryRole =
    primaryRole ||
    (typeof store.getPrimaryRole === "function"
      ? store.getPrimaryRole()
      : null) ||
    getPrimaryRole(resolvedRoles);

  return `
    <section class="role-shell ${shellClass}" data-role="${resolvedPrimaryRole || "guest"}">
      <header class="role-shell__header">
        <div>
          <div class="role-shell__badge role-shell__badge--${resolvedPrimaryRole || "guest"}">${getRoleLabel(resolvedPrimaryRole)}</div>
          <h1 class="role-shell__title">${title || "Panel"}</h1>
          ${subtitle ? `<p class="role-shell__subtitle">${subtitle}</p>` : ""}
        </div>
        ${actions ? `<div class="role-shell__actions">${actions}</div>` : ""}
      </header>
      <div class="role-shell__content">${content}</div>
    </section>
  `;
}

/**
 * Wraps content in a standard page layout with navbar and global styles.
 * @param {Object} options
 * @param {string} options.navbar - HTML from renderNavbar()
 * @param {string} options.main - Main page content
 * @param {string} [options.pageClass] - Extra class for main element
 * @param {string} [options.extraStyles] - Additional CSS
 * @returns {string} Full page HTML
 */
export function renderPage({
  navbar,
  main,
  pageClass = "",
  extraStyles = "",
} = {}) {
  return `
    ${navbar}
    <main class="${pageClass}">
      ${main}
    </main>

    <style>
      /* === Shared Navbar Styles === */
      .site-header {
        background: #fff;
        border-bottom: 1px solid #e5e7eb;
        padding: 0 0;
        position: sticky;
        top: 0;
        z-index: 100;
        box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      }
      .site-header__container {
        max-width: 1280px;
        margin: 0 auto;
        padding: 14px 32px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
      }
      .site-header__logo {
        height: 38px;
        width: auto;
      }
      .site-header__nav {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .site-header__nav-link {
        padding: 8px 16px;
        font-size: 14px;
        font-weight: 500;
        color: #4b5563;
        text-decoration: none;
        border-radius: 8px;
        transition: all 0.15s ease;
        white-space: nowrap;
      }
      .site-header__nav-link:hover {
        background: #f3f4f6;
        color: #111827;
      }
      .site-header__nav-link--active {
        background: #eff6ff;
        color: #2563eb;
      }
      .site-header__actions {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .site-header__dashboard-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 7px 14px;
        border-radius: 999px;
        border: 1px solid #d1d5db;
        color: #374151;
        text-decoration: none;
        font-size: 13px;
        font-weight: 600;
      }
      .site-header__dashboard-link:hover {
        background: #f3f4f6;
      }
      .site-header__role-badge {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.02em;
        padding: 4px 8px;
        border-radius: 999px;
      }
      .site-header__role-badge--candidate {
        background: #e0e7ff;
        color: #3730a3;
      }
      .site-header__role-badge--recruiter {
        background: #dcfce7;
        color: #166534;
      }
      .site-header__role-badge--admin {
        background: #fee2e2;
        color: #991b1b;
      }
      .site-header__role-badge--moderator {
        background: #fef3c7;
        color: #92400e;
      }
      .site-header__role-badge--guest {
        background: #f3f4f6;
        color: #4b5563;
      }
      .site-header__username {
        font-size: 14px;
        font-weight: 500;
        color: #374151;
        white-space: nowrap;
      }
      .site-header__logout-btn {
        background: none;
        border: none;
        color: #6b7280;
        cursor: pointer;
        padding: 8px;
        border-radius: 8px;
        transition: all 0.15s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .site-header__logout-btn:hover {
        background: #fee2e2;
        color: #dc2626;
      }

      /* === Shared Buttons === */
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 9px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        text-decoration: none;
        border: none;
        cursor: pointer;
        transition: all 0.15s ease;
        white-space: nowrap;
      }
      .btn--login {
        background: #fd8a21;
        color: #fff;
      }
      .btn--login:hover {
        background: #f07c12;
      }
      .btn--register {
        background: transparent;
        border: 1.5px solid #fd8a21;
        color: #fd8a21;
      }
      .btn--register:hover {
        background: #fff5eb;
      }
      .btn--primary {
        background: #3b82f6;
        color: #fff;
      }
      .btn--primary:hover {
        background: #2563eb;
      }
      .btn--outline {
        background: #fff;
        border: 1px solid #d1d5db;
        color: #374151;
      }
      .btn--outline:hover {
        background: #f9fafb;
      }
      .btn--sm {
        padding: 6px 14px;
        font-size: 13px;
      }
      .btn--full-width {
        width: 100%;
      }

      /* === Shared Role Shell === */
      .role-shell {
        max-width: 1100px;
        margin: 0 auto;
        padding: 28px 20px;
      }
      .role-shell__header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 22px;
      }
      .role-shell__badge {
        display: inline-flex;
        align-items: center;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        padding: 5px 10px;
        border-radius: 999px;
        margin-bottom: 10px;
      }
      .role-shell__badge--candidate {
        background: #e0e7ff;
        color: #3730a3;
      }
      .role-shell__badge--recruiter {
        background: #dcfce7;
        color: #166534;
      }
      .role-shell__badge--admin {
        background: #fee2e2;
        color: #991b1b;
      }
      .role-shell__badge--moderator {
        background: #fef3c7;
        color: #92400e;
      }
      .role-shell__badge--guest {
        background: #f3f4f6;
        color: #4b5563;
      }
      .role-shell__title {
        margin: 0;
        color: #111827;
        font-size: 30px;
      }
      .role-shell__subtitle {
        margin: 8px 0 0;
        color: #6b7280;
      }
      .role-shell__actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .role-shell__content {
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 14px;
        padding: 28px;
        box-shadow: 0 8px 20px rgba(17, 24, 39, 0.04);
      }

      /* === Shared Content Blocks === */
      .th-section-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 14px;
        margin-bottom: 22px;
      }
      .th-section-header__title {
        margin: 0;
        color: #111827;
        font-size: 28px;
        line-height: 1.2;
      }
      .th-section-header__subtitle {
        margin: 8px 0 0;
        color: #6b7280;
        font-size: 14px;
      }
      .th-section-header__actions {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }
      .th-content-state {
        text-align: center;
        background: #fff;
        border: 1px dashed #d1d5db;
        border-radius: 12px;
        padding: 48px 24px;
        color: #6b7280;
      }
      .th-content-state--error {
        border-style: solid;
        border-color: #fecaca;
        background: #fef2f2;
        color: #991b1b;
      }
      .th-content-state--compact {
        padding: 28px 20px;
      }
      .th-content-state svg {
        color: #c4c9d4;
        margin-bottom: 14px;
      }
      .th-content-state--error svg {
        color: #ef4444;
      }
      .th-content-state h3 {
        margin: 0;
        color: inherit;
        font-size: 18px;
      }
      .th-content-state p {
        margin: 10px auto 0;
        max-width: 560px;
        color: inherit;
        opacity: 0.9;
      }
      .th-content-state .btn {
        margin-top: 18px;
      }

      /* === Global Loading Screen === */
      .app-loading {
        position: fixed;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: #f9fafb;
        z-index: 9999;
        gap: 20px;
      }
      .app-loading__spinner {
        width: 52px;
        height: 52px;
        border: 4px solid #e5e7eb;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      .app-loading__text {
        color: #6b7280;
        font-size: 15px;
        font-weight: 500;
      }

      /* === Global Error Screen === */
      .app-error {
        position: fixed;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: #f9fafb;
        z-index: 9999;
        gap: 16px;
        padding: 20px;
        text-align: center;
      }
      .app-error h2 {
        font-size: 22px;
        color: #111827;
        margin: 0;
      }
      .app-error p {
        color: #6b7280;
        font-size: 15px;
        margin: 0;
        max-width: 400px;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      /* === Responsive Navbar === */
      @media (max-width: 768px) {
        .site-header__container {
          padding: 12px 16px;
          flex-wrap: wrap;
        }
        .site-header__nav {
          order: 3;
          width: 100%;
          overflow-x: auto;
          padding-bottom: 4px;
          gap: 4px;
        }
        .site-header__nav-link {
          padding: 6px 12px;
          font-size: 13px;
        }
        .site-header__role-badge {
          display: none;
        }
        .site-header__username {
          display: none;
        }
        .role-shell {
          padding: 20px 12px;
        }
        .role-shell__header {
          flex-direction: column;
        }
        .role-shell__content {
          padding: 20px;
        }
        .th-section-header {
          flex-direction: column;
        }
        .th-section-header__title {
          font-size: 24px;
        }
      }

      ${extraStyles}
    </style>
  `;
}
