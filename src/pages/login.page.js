// Login Page Controller
import { authService } from '@services/auth.service';
import { store } from '@core/store';
import { showLoading, renderNavbar, renderPage } from '@utils/ui.js';

export async function initLoginPage(params, query) {
  // Redirect if already authenticated
  if (store.get('isAuthenticated')) {
    const roles = store.get('roles') || [];
    window.location.hash = roles.includes('candidate') ? '#/candidate/dashboard' : '#/company/dashboard';
    return;
  }

  showLoading('Cargando...');
  renderLoginPage();
  initLoginEvents();
}

function renderLoginPage() {
  const navbar = renderNavbar({ activeRoute: '' });

  const mainContent = `
    <div class="login-page">
      <div class="login-page__logo-container">
        <a href="#/">
          <img src="${import.meta.env.BASE_URL}logoPortal.png" alt="Logo TrabajaHoy" class="login-page__logo" />
        </a>
      </div>
      <div class="login-page__container">
        <header class="login-page__header">
          <h1 class="login-page__title">Iniciar Sesión</h1>
          <p class="login-page__subtitle">¿No tienes cuenta? <a href="#/register" class="login-page__link">Crear Cuenta</a></p>
        </header>
        <form class="login-form" id="login-form">
          <div class="login-form__error" id="login-error" style="display:none;"></div>
          <div class="login-form__fields">
            <div class="form-group">
              <input type="email" id="login-email" class="form-input" placeholder="Correo Electrónico" required />
            </div>
            <div class="form-group form-group--password">
              <input type="password" id="login-password" class="form-input" placeholder="Contraseña" required />
              <button type="button" class="form-password-toggle" id="toggle-password" aria-label="Mostrar contraseña">
                <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2" fill="none">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
            <div class="form-actions">
              <label class="form-checkbox">
                <input type="checkbox" id="remember-me" class="form-checkbox__input" />
                <span class="form-checkbox__label">Recuérdame</span>
              </label>
              <a href="#" class="form-link">Olvidé la contraseña</a>
            </div>
          </div>
          <button type="submit" class="btn btn--primary btn--full-width" id="login-btn">
            Iniciar Sesión
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </form>
      </div>
    </div>
  `;

  const styles = `
    .login-page {
      min-height: calc(100vh - 70px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
    }
    .login-page__logo-container { margin-bottom: 32px; }
    .login-page__logo { height: 60px; width: auto; cursor: pointer; }
    .login-page__container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      padding: 48px;
      max-width: 500px;
      width: 100%;
    }
    .login-page__header { text-align: center; margin-bottom: 32px; }
    .login-page__title { font-size: 32px; font-weight: 700; color: #111827; margin: 0 0 12px; }
    .login-page__subtitle { color: #6b7280; margin: 0; font-size: 15px; }
    .login-page__link { color: #3b82f6; text-decoration: none; font-weight: 500; }
    .login-page__link:hover { text-decoration: underline; }
    .login-form { margin-bottom: 24px; }
    .login-form__fields { display: flex; flex-direction: column; gap: 20px; margin-bottom: 24px; }
    .form-input {
      width: 100%; padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 8px;
      font-size: 15px; transition: all 0.2s; font-family: inherit;
    }
    .form-input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    .form-group--password { position: relative; }
    .form-password-toggle {
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; color: #6b7280; padding: 4px;
      display: flex; align-items: center; justify-content: center;
    }
    .form-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .form-checkbox { display: flex; align-items: center; gap: 8px; cursor: pointer; }
    .form-checkbox__input { width: 18px; height: 18px; cursor: pointer; accent-color: #3b82f6; }
    .form-checkbox__label { font-size: 14px; color: #374151; }
    .form-link { color: #3b82f6; text-decoration: none; font-size: 14px; }
    .form-link:hover { text-decoration: underline; }
    .login-form__error {
      background: #fee2e2; color: #dc2626; padding: 12px; border-radius: 6px;
      margin-bottom: 16px; font-size: 14px;
    }
    .login-form__error:not(:empty) { display: block; }
    .spinner {
      display: inline-block; width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3);
      border-radius: 50%; border-top-color: #fff; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 768px) {
      .login-page__container { padding: 32px 24px; }
      .login-page__title { font-size: 28px; }
    }
  `;

  document.getElementById('app').innerHTML = renderPage({ navbar, main: mainContent, extraStyles: styles });
}

function initLoginEvents() {
  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const submitBtn = document.getElementById('login-btn');
  const togglePasswordBtn = document.getElementById('toggle-password');
  const errorDiv = document.getElementById('login-error');

  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
      passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      errorDiv.textContent = 'Por favor, completa todos los campos';
      errorDiv.style.display = 'block';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Iniciando sesión...';
    errorDiv.style.display = 'none';

    try {
      await authService.login({ email, password });
      const roles = store.get('roles') || [];
      window.location.hash = roles.includes('candidate') ? '#/candidate/dashboard' : '#/company/dashboard';
    } catch (error) {
      console.error('Login error:', error);
      errorDiv.textContent = error.response?.data?.message || error.response?.data?.error || 'Error de autenticación. Verifica tus credenciales.';
      errorDiv.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.innerHTML = `Iniciar Sesión <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;
    }
  });
}
