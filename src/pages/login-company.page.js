// Company Login Page Controller
import { authService } from "@services/auth.service";
import { config } from "@core/config";
import { ROLE, getDashboardRouteForRoles, hasAnyRole } from "@core/roles";
import {
  bindPasswordToggle,
  createSubmitStateController,
  setFormError,
} from "@utils/auth-form";
import {
  getAuthUiContext,
  renderAuthErrorBlock,
  renderAuthShell,
  resolveRequestErrorMessage,
  showLoading,
  renderNavbar,
  renderPage,
} from "@utils/ui.js";

const COMPANY_ROLES = [ROLE.RECRUITER, ROLE.COMPANY_ADMIN, ROLE.ADMIN];

export async function initLoginCompanyPage(params, query) {
  const { isAuthenticated, roles } = getAuthUiContext();
  if (isAuthenticated) {
    window.location.hash = `#${getDashboardRouteForRoles(roles, config.ROUTES.VACANCIES)}`;
    return;
  }

  showLoading("Cargando...");
  renderLoginCompanyPage();
  initLoginCompanyEvents();
}

function renderLoginCompanyPage() {
  const navbar = renderNavbar({ activeRoute: "" });

  const form = `
    <form class="auth-form" id="login-company-form" novalidate>
      ${renderAuthErrorBlock("login-company-error")}

      <div class="auth-form__fields">
        <div class="auth-field">
          <label class="sr-only" for="login-company-email">Correo corporativo</label>
          <input type="email" id="login-company-email" class="auth-input" placeholder="Correo corporativo" autocomplete="email" required />
        </div>

        <div class="auth-field auth-field--password">
          <label class="sr-only" for="login-company-password">Contraseña</label>
          <input type="password" id="login-company-password" class="auth-input" placeholder="Contraseña" autocomplete="current-password" required />
          <button type="button" class="auth-password-toggle" id="toggle-password" aria-label="Mostrar contraseña" aria-pressed="false">
            <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2" fill="none">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
        </div>

        <div class="auth-form__actions">
          <label class="auth-checkbox" for="remember-me-company">
            <input type="checkbox" id="remember-me-company" class="auth-checkbox__input" />
            <span class="auth-checkbox__label">Recuérdame</span>
          </label>
          <span class="auth-form__hint" aria-hidden="true">Olvidé la contraseña</span>
        </div>
      </div>

      <button type="submit" class="btn btn--primary btn--full-width auth-submit" id="login-company-btn">
        Acceder al Panel Empresa
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      </button>
    </form>
  `;

  const mainContent = renderAuthShell({
    variant: "login",
    cardClass: "auth-card--login auth-card--company",
    eyebrow: "Acceso Empresa",
    title: "Portal Empresas",
    subtitle:
      'Gestiona vacantes, postulantes y tu perfil corporativo. ¿Aún no tienes cuenta empresarial? <a href="#/register-company" class="auth-card__subtitle-link">Registrar Empresa</a>',
    form,
    footer:
      "Usa las credenciales del reclutador o administrador asociadas a tu empresa.",
  });

  document.getElementById("app").innerHTML = renderPage({
    navbar,
    main: mainContent,
  });
}

function initLoginCompanyEvents() {
  const form = document.getElementById("login-company-form");
  const emailInput = document.getElementById("login-company-email");
  const passwordInput = document.getElementById("login-company-password");
  const submitBtn = document.getElementById("login-company-btn");
  const togglePasswordBtn = document.getElementById("toggle-password");
  const errorDiv = document.getElementById("login-company-error");
  const setSubmitting = createSubmitStateController({
    submitButton: submitBtn,
    controls: [emailInput, passwordInput],
    loadingHtml: '<span class="auth-spinner"></span> Iniciando sesión...',
  });

  bindPasswordToggle(togglePasswordBtn, passwordInput);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      setFormError(errorDiv, "Ingresa tu correo y contraseña para continuar.");
      return;
    }

    setSubmitting(true);
    setFormError(errorDiv);

    try {
      await authService.login({ email, password });
      const { roles } = getAuthUiContext();

      if (!hasAnyRole(roles, COMPANY_ROLES)) {
        await authService.logout();
        setFormError(
          errorDiv,
          "Esta cuenta no tiene acceso al portal empresas. Inicia sesión como candidato.",
        );
        setSubmitting(false);
        return;
      }

      window.location.hash = `#${getDashboardRouteForRoles(roles, config.ROUTES.COMPANY_DASHBOARD)}`;
    } catch (error) {
      console.error("Login company error:", error);
      const message = resolveRequestErrorMessage(
        error,
        "Error de autenticación. Verifica tus credenciales.",
      );
      setFormError(errorDiv, message);
      setSubmitting(false);
    }
  });
}
