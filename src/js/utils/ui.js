// UI Helpers

// ============================================================
// Global Loading
// ============================================================
export function showLoading(message = 'Cargando...') {
  const app = document.getElementById('app');
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
  const app = document.getElementById('app');
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

// ============================================================
// Shared Navbar
// ============================================================

const NAV_LINKS = [
  { href: '#/vacancies', label: 'Buscar empleos' },
  { href: '#/resources', label: 'Recursos' },
  { href: '#/forum', label: 'Foro' },
];

/**
 * Renders a consistent navbar across all pages.
 * @param {Object} options
 * @param {string} options.activeRoute - e.g. 'vacancies', 'resources', 'forum'
 * @param {boolean} options.isAuthenticated
 * @param {Object} [options.user]
 * @param {string} [options.extraHeaderContent] - Extra HTML inside header actions
 * @returns {string} HTML string
 */
export function renderNavbar({ activeRoute = '', isAuthenticated = false, user = null, extraHeaderContent = '' } = {}) {
  const fullName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';

  const navLinks = NAV_LINKS.map(link => {
    const isActive = link.href === `#/${activeRoute}`;
    return `<a href="${link.href}" class="site-header__nav-link${isActive ? ' site-header__nav-link--active' : ''}">${link.label}</a>`;
  }).join('\n');

  const authSection = isAuthenticated
    ? `<a href="#/candidate/dashboard" class="site-header__nav-link">Mi Panel</a>
       <span class="site-header__username">${fullName}</span>
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
          ${extraHeaderContent || ''}
        </div>
      </div>
    </header>
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
export function renderPage({ navbar, main, pageClass = '', extraStyles = '' } = {}) {
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
        .site-header__username {
          display: none;
        }
      }

      ${extraStyles}
    </style>
  `;
}
