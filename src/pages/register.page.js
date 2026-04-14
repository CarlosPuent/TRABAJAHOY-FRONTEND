// Register Candidate Page Controller
import { authService } from "@services/auth.service";
import { config } from "@core/config";
import { getDashboardRouteForRoles } from "@core/roles";
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

export async function initRegisterPage(params, query) {
  const { isAuthenticated, roles } = getAuthUiContext();
  if (isAuthenticated) {
    window.location.hash = `#${getDashboardRouteForRoles(roles, config.ROUTES.VACANCIES)}`;
    return;
  }

  showLoading("Cargando...");
  renderRegisterPage();
  initRegisterEvents();
}

function renderRegisterPage() {
  const navbar = renderNavbar({ activeRoute: "" });

<<<<<<< HEAD
  const mainContent = `
    <div class="register-page">
      <div class="register-page__logo-container">
        <a href="#/">
          <img src="${import.meta.env.BASE_URL}logoPortal.png" alt="Logo TrabajaHoy" class="register-page__logo" />
        </a>
      </div>
      <div class="register-page__container">
        <header class="register-page__header">
          <h1 class="register-page__title">Crear Cuenta</h1>
          <p class="register-page__subtitle">¿Ya tienes cuenta? <a href="#/login" class="register-page__link">Iniciar Sesión</a></p>
        </header>
        <form class="register-form" id="register-form">
          <div class="register-form__error" id="register-error" style="display:none;"></div>
          <div class="register-form__fields">
            <div class="form-row">
              <div class="form-group">
                <input type="text" id="register-firstname" class="form-input" placeholder="Nombre" required />
              </div>
              <div class="form-group">
                <input type="text" id="register-lastname" class="form-input" placeholder="Apellido" required />
              </div>
            </div>
            <div class="form-group">
              <input type="email" id="register-email" class="form-input" placeholder="Correo Electrónico" required />
            </div>
            <div class="form-group form-group--password">
              <input type="password" id="register-password" class="form-input" placeholder="Contraseña" required minlength="8" />
              <button type="button" class="form-password-toggle" id="toggle-password" aria-label="Mostrar contraseña">
                <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2" fill="none">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
            <div class="form-group form-group--password">
              <input type="password" id="register-confirm-password" class="form-input" placeholder="Confirmar Contraseña" required />
            </div>
            <div class="form-checkbox">
              <input type="checkbox" id="accept-terms" class="form-checkbox__input" required />
              <label for="accept-terms" class="form-checkbox__label">Acepto los <a href="#">Términos y Condiciones</a></label>
            </div>
=======
  const form = `
    <form class="auth-form" id="register-form" novalidate>
      ${renderAuthErrorBlock("register-error")}

      <div class="auth-form__fields">
        <div class="auth-form__row">
          <div class="auth-field">
            <label class="sr-only" for="register-firstname">Nombre</label>
            <input type="text" id="register-firstname" class="auth-input" placeholder="Nombre" autocomplete="given-name" required />
>>>>>>> puente
          </div>
          <div class="auth-field">
            <label class="sr-only" for="register-lastname">Apellido</label>
            <input type="text" id="register-lastname" class="auth-input" placeholder="Apellido" autocomplete="family-name" required />
          </div>
        </div>

        <div class="auth-field">
          <label class="sr-only" for="register-email">Correo electrónico</label>
          <input type="email" id="register-email" class="auth-input" placeholder="Correo electrónico" autocomplete="email" required />
        </div>

        <div class="auth-field auth-field--password">
          <label class="sr-only" for="register-password">Contraseña</label>
          <input type="password" id="register-password" class="auth-input" placeholder="Contraseña" autocomplete="new-password" required minlength="8" />
          <button type="button" class="auth-password-toggle" id="toggle-password" aria-label="Mostrar contraseña" aria-pressed="false">
            <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2" fill="none">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
        </div>

        <div class="auth-field">
          <label class="sr-only" for="register-confirm-password">Confirmar contraseña</label>
          <input type="password" id="register-confirm-password" class="auth-input" placeholder="Confirmar contraseña" autocomplete="new-password" required />
        </div>

        <label class="auth-checkbox" for="accept-terms">
          <input type="checkbox" id="accept-terms" class="auth-checkbox__input" required />
          <span class="auth-checkbox__label">Acepto los <a href="#" class="auth-card__subtitle-link">Términos y Condiciones</a></span>
        </label>
      </div>

      <button type="submit" class="btn btn--primary btn--full-width auth-submit" id="register-btn">
        Crear Cuenta
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      </button>
    </form>
  `;

  const mainContent = renderAuthShell({
    variant: "register",
    cardClass: "auth-card--register",
    eyebrow: "Nuevo Perfil",
    title: "Crear Cuenta",
    subtitle:
      'Regístrate como candidato para postular a ofertas y dar visibilidad a tu perfil. ¿Ya tienes cuenta? <a href="#/login" class="auth-card__subtitle-link">Iniciar Sesión</a>',
    form,
    footer:
      "Solo pedimos la información mínima para crear tu cuenta de candidato.",
  });

  document.getElementById("app").innerHTML = renderPage({
    navbar,
    main: mainContent,
  });
}

function initRegisterEvents() {
  const form = document.getElementById("register-form");
  const passwordInput = document.getElementById("register-password");
  const confirmPasswordInput = document.getElementById(
    "register-confirm-password",
  );
  const submitBtn = document.getElementById("register-btn");
  const togglePasswordBtn = document.getElementById("toggle-password");
  const errorDiv = document.getElementById("register-error");
  const firstNameInput = document.getElementById("register-firstname");
  const lastNameInput = document.getElementById("register-lastname");
  const emailInput = document.getElementById("register-email");
  const termsInput = document.getElementById("accept-terms");

  const setSubmitting = createSubmitStateController({
    submitButton: submitBtn,
    controls: [
      firstNameInput,
      lastNameInput,
      emailInput,
      passwordInput,
      confirmPasswordInput,
      termsInput,
    ],
    loadingHtml: '<span class="auth-spinner"></span> Creando cuenta...',
  });

  bindPasswordToggle(togglePasswordBtn, passwordInput);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const firstName = document
      .getElementById("register-firstname")
      .value.trim();
    const lastName = document.getElementById("register-lastname").value.trim();
    const email = document.getElementById("register-email").value.trim();
    const password = passwordInput.value;
    const confirm = confirmPasswordInput.value;

    if (password !== confirm) {
      setFormError(errorDiv, "Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 8) {
      setFormError(errorDiv, "La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setSubmitting(true);
    setFormError(errorDiv);

    try {
      await authService.registerCandidate({
        email,
        password,
        firstName,
        lastName,
      });
      const { roles } = getAuthUiContext();
      window.location.hash = `#${getDashboardRouteForRoles(roles, config.ROUTES.VACANCIES)}`;
    } catch (error) {
      console.error("Register error:", error);
      const message = resolveRequestErrorMessage(
        error,
        "Error al crear la cuenta.",
      );
      setFormError(errorDiv, message);
      setSubmitting(false);
    }
  });
}
