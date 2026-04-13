// Register Candidate Page Controller
import { authService } from '@services/auth.service';
import { store } from '@core/store';
import { showLoading, renderNavbar, renderPage } from '@utils/ui.js';

export async function initRegisterPage(params, query) {
  if (store.get('isAuthenticated')) {
    const roles = store.get('roles') || [];
    window.location.hash = roles.includes('candidate') ? '#/candidate/dashboard' : '#/company/dashboard';
    return;
  }

  showLoading('Cargando...');
  renderRegisterPage();
  initRegisterEvents();
}

function renderRegisterPage() {
  const navbar = renderNavbar({ activeRoute: '' });

  const mainContent = `
    <div class="register-page">
      <div class="register-page__logo-container">
        <a href="#/">
          <img src="/logoPortal.png" alt="Logo TrabajaHoy" class="register-page__logo" />
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
          </div>
          <button type="submit" class="btn btn--primary btn--full-width" id="register-btn">
            Crear Cuenta
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
    .register-page {
      min-height: calc(100vh - 70px); display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;
    }
    .register-page__logo-container { margin-bottom: 32px; }
    .register-page__logo { height: 60px; width: auto; cursor: pointer; }
    .register-page__container {
      background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      padding: 48px; max-width: 600px; width: 100%;
    }
    .register-page__header { text-align: center; margin-bottom: 32px; }
    .register-page__title { font-size: 32px; font-weight: 700; color: #111827; margin: 0 0 12px; }
    .register-page__subtitle { color: #6b7280; margin: 0; font-size: 15px; }
    .register-page__link { color: #3b82f6; text-decoration: none; font-weight: 500; }
    .register-page__link:hover { text-decoration: underline; }
    .register-form { margin-bottom: 24px; }
    .register-form__fields { display: flex; flex-direction: column; gap: 20px; margin-bottom: 24px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
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
    .form-checkbox { display: flex; align-items: center; gap: 8px; cursor: pointer; }
    .form-checkbox__input { width: 18px; height: 18px; cursor: pointer; accent-color: #3b82f6; }
    .form-checkbox__label { font-size: 14px; color: #374151; }
    .register-form__error {
      background: #fee2e2; color: #dc2626; padding: 12px; border-radius: 6px;
      margin-bottom: 16px; font-size: 14px;
    }
    .register-form__error:not(:empty) { display: block; }
    .spinner {
      display: inline-block; width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3);
      border-radius: 50%; border-top-color: #fff; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 768px) {
      .register-page__container { padding: 32px 24px; }
      .register-page__title { font-size: 28px; }
      .form-row { grid-template-columns: 1fr; }
    }
  `;

  document.getElementById('app').innerHTML = renderPage({ navbar, main: mainContent, extraStyles: styles });
}

function initRegisterEvents() {
  const form = document.getElementById('register-form');
  const passwordInput = document.getElementById('register-password');
  const confirmPasswordInput = document.getElementById('register-confirm-password');
  const submitBtn = document.getElementById('register-btn');
  const togglePasswordBtn = document.getElementById('toggle-password');
  const errorDiv = document.getElementById('register-error');

  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
      passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const firstName = document.getElementById('register-firstname').value.trim();
    const lastName = document.getElementById('register-lastname').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = passwordInput.value;
    const confirm = confirmPasswordInput.value;

    if (password !== confirm) {
      errorDiv.textContent = 'Las contraseñas no coinciden';
      errorDiv.style.display = 'block';
      return;
    }
    if (password.length < 8) {
      errorDiv.textContent = 'La contraseña debe tener al menos 8 caracteres';
      errorDiv.style.display = 'block';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Creando cuenta...';
    errorDiv.style.display = 'none';

    try {
      await authService.registerCandidate({ email, password, firstName, lastName });
      window.location.hash = '#/candidate/dashboard';
    } catch (error) {
      console.error('Register error:', error);
      errorDiv.textContent = error.response?.data?.message || 'Error al crear la cuenta.';
      errorDiv.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.innerHTML = `Crear Cuenta <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;
    }
  });
}
