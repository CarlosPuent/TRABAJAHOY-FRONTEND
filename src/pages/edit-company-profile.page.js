// Edit Company Profile Page Controller
import { companyService } from '@services/company.service';
import { authService } from '@services/auth.service';
import { store } from '@core/store';
import { showLoading, renderNavbar, renderPage } from '@utils/ui.js';

/** Extract companyId from any known field shape the backend might return. */
function resolveUserCompanyId(user) {
  if (!user) return null;
  const id =
    user.companyId ||
    user.company_id ||
    user.company?.id ||
    user.company?.companyId ||
    user.ownedCompany?.[0]?.id ||
    user.recruiterProfile?.companyId ||
    user.recruiter_profile?.company_id ||
    user.recruiter?.companyId ||
    user.membership?.companyId ||
    user.companyMembership?.companyId ||
    user.companyMembers?.[0]?.companyId ||
    user.companyMembers?.[0]?.company?.id ||
    user.companyMemberships?.[0]?.companyId ||
    user.companyMemberships?.[0]?.company?.id ||
    user.memberships?.[0]?.companyId ||
    user.memberships?.[0]?.company?.id ||
    '';
  return String(id).trim() || null;
}

export async function initEditCompanyProfilePage(params, query) {
  const isAuthenticated = store.get('isAuthenticated');
  let user = store.get('user');

  showLoading('Cargando editor de perfil...');

  try {
    let userCompanyId = resolveUserCompanyId(user);

    if (!userCompanyId) {
      try {
        const profileData = await authService.fetchCurrentUserProfile();
        user = store.get('user');
        userCompanyId = resolveUserCompanyId(profileData?.user || user);
      } catch (e) {
        console.warn('No se pudo refrescar el perfil del usuario:', e);
      }
    }

    let company = null;
    if (userCompanyId) {
      try {
        const raw = await companyService.getCompanyById(userCompanyId);
        company = raw?.data || raw || null;
      } catch (err) {
        console.warn('No se pudo cargar la empresa:', err);
      }
    }

    document.getElementById('app').innerHTML = getEditHTML(company, isAuthenticated, user);
    initEditEvents(company);
  } catch (error) {
    console.error('Error loading edit form:', error);
    document.getElementById('app').innerHTML = getEditHTML(null, isAuthenticated, user);
    initEditEvents(null);
  }
}

function getEditHTML(company, isAuthenticated, user) {
  const navbar = renderNavbar({ activeRoute: '', isAuthenticated, user });
  const isNew = !company;

  const mainContent = `
    <div class="ecp-container">
      <div class="ecp-header">
        <a href="#/company/profile" class="ecp-back">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Volver al perfil
        </a>
        <h1 class="ecp-title">${isNew ? 'Registrar Empresa' : 'Editar Perfil de Empresa'}</h1>
        <p class="ecp-subtitle">${isNew ? 'Completa la información de tu empresa' : 'Actualiza la información de tu empresa'}</p>
      </div>

      <form id="company-form" class="ecp-form">
        <div class="ecp-card">
          <h2 class="ecp-card__title">Información General</h2>
          <div class="ecp-form-grid">
            <div class="ecp-field">
              <label class="ecp-label" for="company-name">Nombre de la empresa *</label>
              <input type="text" id="company-name" class="ecp-input" value="${company?.name || ''}" required placeholder="Ej: TrabajaHoy Inc." />
            </div>
            <div class="ecp-field">
              <label class="ecp-label" for="company-industry">Industria</label>
              <input type="text" id="company-industry" class="ecp-input" value="${company?.industry || ''}" placeholder="Ej: Tecnología" />
            </div>
            <div class="ecp-field">
              <label class="ecp-label" for="company-size">Tamaño</label>
              <select id="company-size" class="ecp-input">
                <option value="">Seleccionar...</option>
                ${['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'].map(s => 
                  `<option value="${s}" ${company?.size === s ? 'selected' : ''}>${s} empleados</option>`
                ).join('')}
              </select>
            </div>
            <div class="ecp-field">
              <label class="ecp-label" for="company-founded">Año de fundación</label>
              <input type="number" id="company-founded" class="ecp-input" value="${company?.foundedYear || ''}" placeholder="Ej: 2020" min="1900" max="${new Date().getFullYear()}" />
            </div>
            <div class="ecp-field ecp-field--full">
              <label class="ecp-label" for="company-desc">Descripción</label>
              <textarea id="company-desc" class="ecp-input ecp-textarea" rows="4" placeholder="Describe tu empresa, cultura y misión...">${company?.description || ''}</textarea>
            </div>
          </div>
        </div>

        <div class="ecp-card">
          <h2 class="ecp-card__title">Presencia Online</h2>
          <div class="ecp-form-grid">
            <div class="ecp-field">
              <label class="ecp-label" for="company-website">Sitio Web</label>
              <input type="url" id="company-website" class="ecp-input" value="${company?.websiteUrl || ''}" placeholder="https://www.tuempresa.com" />
            </div>
            <div class="ecp-field">
              <label class="ecp-label" for="company-logo">URL del Logo</label>
              <input type="url" id="company-logo" class="ecp-input" value="${company?.logoUrl || ''}" placeholder="https://..." />
            </div>
            <div class="ecp-field ecp-field--full">
              <label class="ecp-label" for="company-cover">URL de Imagen de Portada</label>
              <input type="url" id="company-cover" class="ecp-input" value="${company?.coverImageUrl || ''}" placeholder="https://..." />
            </div>
          </div>
        </div>

        <div class="ecp-actions">
          <a href="#/company/profile" class="btn btn--outline">Cancelar</a>
          <button type="submit" class="btn btn--primary" id="save-company-btn">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
            ${isNew ? 'Crear Empresa' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  `;

  const styles = `
    .ecp-page { min-height: calc(100vh - 70px); background: #f3f4f6; padding: 24px 0 60px; }
    .ecp-container { max-width: 800px; margin: 0 auto; padding: 0 24px; }
    .ecp-back { display: inline-flex; align-items: center; gap: 6px; color: #6b7280; text-decoration: none; font-size: 14px; margin-bottom: 16px; transition: color 0.15s; }
    .ecp-back:hover { color: #111827; }
    .ecp-header { margin-bottom: 32px; }
    .ecp-title { font-size: 28px; font-weight: 700; color: #111827; margin: 0 0 6px; }
    .ecp-subtitle { color: #6b7280; margin: 0; font-size: 15px; }
    .ecp-card { background: #fff; border-radius: 12px; padding: 28px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom: 20px; }
    .ecp-card__title { font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 20px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb; }
    .ecp-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .ecp-field { display: flex; flex-direction: column; gap: 6px; }
    .ecp-field--full { grid-column: 1 / -1; }
    .ecp-label { font-size: 14px; font-weight: 500; color: #374151; }
    .ecp-input { padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; font-family: inherit; transition: border-color 0.15s, box-shadow 0.15s; outline: none; }
    .ecp-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
    .ecp-textarea { resize: vertical; min-height: 100px; }
    .ecp-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
    @media (max-width: 768px) {
      .ecp-form-grid { grid-template-columns: 1fr; }
    }
  `;

  return renderPage({ navbar, main: mainContent, pageClass: 'ecp-page', extraStyles: styles });
}

function initEditEvents(company) {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try { await authService.logout(); window.location.hash = '#/'; } catch (e) { console.error(e); }
    });
  }

  const form = document.getElementById('company-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('save-company-btn');
      btn.disabled = true;
      btn.textContent = 'Guardando...';

      const data = {
        name: document.getElementById('company-name').value.trim(),
        industry: document.getElementById('company-industry').value.trim() || undefined,
        size: document.getElementById('company-size').value || undefined,
        foundedYear: document.getElementById('company-founded').value ? parseInt(document.getElementById('company-founded').value) : undefined,
        description: document.getElementById('company-desc').value.trim() || undefined,
        websiteUrl: document.getElementById('company-website').value.trim() || undefined,
        logoUrl: document.getElementById('company-logo').value.trim() || undefined,
        coverImageUrl: document.getElementById('company-cover').value.trim() || undefined,
      };

      try {
        if (company) {
          await companyService.updateCompany(company.id, data);
          store.addToast({ type: 'success', message: 'Perfil de empresa actualizado' });
        } else {
          await companyService.createCompany(data);
          store.addToast({ type: 'success', message: 'Empresa registrada exitosamente' });
        }
        window.location.hash = '#/company/profile';
      } catch (err) {
        console.error('Error saving company:', err);
        store.addToast({ type: 'error', message: err.response?.data?.message || 'Error al guardar' });
        btn.disabled = false;
        btn.textContent = company ? 'Guardar Cambios' : 'Crear Empresa';
      }
    });
  }
}
