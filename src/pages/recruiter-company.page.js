import { config } from "@core/config";
import { store } from "@core/store";
import { authService } from "@services/auth.service";
import { companyService } from "@services/company.service";
import {
  getAuthUiContext,
  renderNavbar,
  renderPage,
  renderRoleShell,
  showLoading,
} from "@utils/ui";

/* =========================
   UI HELPERS (TOASTS & MODALS)
========================= */

function showToast(message, type = "success") {
  const el = document.createElement("div");
  el.className = `custom-toast custom-toast--${type}`;
  el.innerText = message;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

function showCreateCompanyModal() {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "custom-modal-overlay";
    overlay.innerHTML = `
      <div class="custom-modal-card">
        <div class="custom-modal-header">
          <h2>Crear Perfil de Empresa</h2>
        </div>
        <div class="custom-modal-body" style="display:flex; flex-direction:column; gap:16px;">
          <p style="color: #64748b; font-size: 14px; margin-bottom: 8px;">
            Para publicar vacantes, primero debes registrar los datos de tu empresa.
          </p>
          <div>
            <label style="font-size:12px; font-weight:700; color:#475569; display:block; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.05em;">Nombre de la Empresa *</label>
            <input type="text" id="cc-name" class="custom-input" placeholder="Ej: TechCorp S.A." autocomplete="off" />
          </div>
          <div>
            <label style="font-size:12px; font-weight:700; color:#475569; display:block; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.05em;">Sitio Web</label>
            <input type="url" id="cc-website" class="custom-input" placeholder="Ej: https://techcorp.com" autocomplete="off" />
          </div>
        </div>
        <div class="custom-modal-footer">
          <button class="admin-btn" id="cc-cancel">Cancelar</button>
          <button class="admin-btn admin-btn--primary" id="cc-submit">Registrar Empresa</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const nameInput = overlay.querySelector("#cc-name");
    nameInput.focus();

    const close = (val) => {
      overlay.remove();
      resolve(val);
    };

    overlay.querySelector("#cc-cancel").onclick = () => close(null);
    overlay.querySelector("#cc-submit").onclick = () => {
      const name = nameInput.value.trim();
      const website = overlay.querySelector("#cc-website").value.trim();

      if (!name) {
        nameInput.style.borderColor = "#ef4444";
        return;
      }
      close({ name, website });
    };
  });
}

// ... (tus imports y toasts se mantienen igual)

/* =========================
   NUEVO: MODAL DE EDICIÓN
========================= */
function showEditCompanyModal(currentData) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "custom-modal-overlay";
    overlay.innerHTML = `
      <div class="custom-modal-card">
        <div class="custom-modal-header"><h2>Editar Empresa</h2></div>
        <div class="custom-modal-body" style="display:flex; flex-direction:column; gap:16px;">
          <div>
            <label class="modal-label">Nombre Legal</label>
            <input type="text" id="ec-name" class="custom-input" value="${escapeHtml(currentData.name)}" />
          </div>
          <div>
            <label class="modal-label">Sitio Web</label>
            <input type="url" id="ec-website" class="custom-input" value="${escapeHtml(currentData.website || "")}" placeholder="https://ejemplo.com" />
          </div>
        </div>
        <div class="custom-modal-footer">
          <button class="admin-btn" id="ec-cancel">Cancelar</button>
          <button class="admin-btn admin-btn--primary" id="ec-submit">Guardar Cambios</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = (val) => {
      overlay.remove();
      resolve(val);
    };
    overlay.querySelector("#ec-cancel").onclick = () => close(null);
    overlay.querySelector("#ec-submit").onclick = () => {
      const name = overlay.querySelector("#ec-name").value.trim();
      const website = overlay.querySelector("#ec-website").value.trim();
      close({ name, website });
    };
  });
}

/* =========================
   EVENTS (ACTUALIZADO)
========================= */
function bindEvents(authContext, companyId, currentCompanyData) {
  // 1. Evento Editar — redirige al formulario completo de christian
  const editBtn = document.getElementById("btn-edit-company");
  if (editBtn && companyId) {
    editBtn.onclick = () => {
      window.location.hash = "#/company/profile/edit";
    };
  }

  // 2. Crear Empresa
  const createBtn = document.getElementById("btn-onboarding-create");
  if (createBtn) {
    createBtn.onclick = async () => {
      const data = await showCreateCompanyModal();
      if (!data) return;

      showLoading("Registrando empresa...");
      try {
        await companyService.createCompany(data);
        await authService.fetchCurrentUserProfile();
        showToast("¡Tu empresa ha sido registrada!");
        await initRecruiterCompanyPage();
      } catch (error) {
        showToast("Error al registrar empresa", "error");
      }
    };
  }

  // 3. Verificación (Mismo código que tenías)
  const verifyBtn = document.getElementById("btn-submit-verification");
  if (verifyBtn && companyId) {
    verifyBtn.onclick = async () => {
      const formData = await showVerificationModal();
      if (!formData) return;
      showLoading("Enviando documentos...");
      try {
        await companyService.submitVerification(companyId, formData);
        showToast("Documentos enviados para revisión");
        await initRecruiterCompanyPage();
      } catch (error) {
        showToast("Error al enviar documentos", "error");
      }
    };
  }
}

function showVerificationModal() {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "custom-modal-overlay";
    overlay.innerHTML = `
      <div class="custom-modal-card">
        <div class="custom-modal-header">
          <h2>Solicitar Verificación</h2>
        </div>
        <div class="custom-modal-body" style="display:flex; flex-direction:column; gap:16px;">
          <p style="color: #64748b; font-size: 14px;">
            Sube un documento legal que acredite la existencia de tu empresa (Ej: NIT, Registro de Comercio, Recibo de servicios).
          </p>
          <div>
            <label style="font-size:12px; font-weight:700; color:#475569; display:block; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.05em;">Documento (PDF, JPG, PNG) *</label>
            <input type="file" id="cv-file" class="custom-input" accept=".pdf,image/*" style="padding: 8px;" />
          </div>
          <div>
            <label style="font-size:12px; font-weight:700; color:#475569; display:block; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.05em;">Notas adicionales (Opcional)</label>
            <textarea id="cv-notes" class="custom-textarea" placeholder="Información extra para el administrador..." style="min-height: 60px;"></textarea>
          </div>
        </div>
        <div class="custom-modal-footer">
          <button class="admin-btn" id="cv-cancel">Cancelar</button>
          <button class="admin-btn admin-btn--primary" id="cv-submit">Enviar Documentos</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = (val) => {
      overlay.remove();
      resolve(val);
    };

    overlay.querySelector("#cv-cancel").onclick = () => close(null);

    // 🚀 LÓGICA MEJORADA DE ENVÍO
    overlay.querySelector("#cv-submit").onclick = () => {
      const fileInput = overlay.querySelector("#cv-file");
      const file = fileInput.files[0];

      if (!file) {
        fileInput.style.borderColor = "#ef4444";
        return;
      }

      // DEBUG: Para verificar que el archivo está cargado antes de cerrar el modal
      console.log(
        "Archivo capturado en Modal:",
        file.name,
        "| Tamaño:",
        file.size,
      );

      const formData = new FormData();
      // El nombre del campo 'documents' debe coincidir con lo que espera el backend
      formData.append("documents", file);

      const notesInput = overlay.querySelector("#cv-notes");
      if (notesInput && notesInput.value.trim()) {
        formData.append("notes", notesInput.value.trim());
      }

      close(formData);
    };
  });
}

/* =========================
   LOGIC HELPERS
========================= */

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getCompanyIdFromUser(user) {
  if (!user) return null;
  return user.companyId || user.company_id || user.company?.id || null;
}

/* =========================
   VIEWS
========================= */

function renderNoCompanyView() {
  return `
    <div class="empty-state-wrapper">
      <div class="empty-state-box">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>
        </div>
        <h2>Aún no tienes una empresa registrada</h2>
        <p>Para poder publicar vacantes y buscar candidatos, el primer paso es registrar los datos básicos de tu compañía.</p>
        <button class="btn btn--primary" id="btn-onboarding-create" style="margin-top: 16px; padding: 12px 24px;">
          Crear mi Empresa
        </button>
      </div>
    </div>
  `;
}

function renderCompanyDashboardView(company) {
  const statusMap = {
    pending: {
      label: "En Revisión",
      class: "pending",
      desc: "Tus documentos están siendo evaluados por un administrador.",
    },
    approved: {
      label: "Verificada",
      class: "verified",
      desc: "Tu empresa está verificada. Tus vacantes son públicas.",
    },
    rejected: {
      label: "Rechazada",
      class: "rejected",
      desc: "La verificación fue rechazada. Por favor sube documentos válidos.",
    },
    none: {
      label: "Sin verificación",
      class: "none",
      desc: "Debes verificar tu empresa para que tus vacantes sean visibles.",
    },
  };

  const status = statusMap[company.verificationStatus] || statusMap.none;
  const canVerify =
    company.verificationStatus === "none" ||
    company.verificationStatus === "rejected";

  // ✅ Corregido: return (sin la r extra) y estructura de divs cerrada correctamente
  return `
    <div class="company-dashboard-grid">
      <div class="company-card-pro">
        <div class="company-card-pro__header">
          <h3>Detalles de la Empresa</h3>
          <button class="btn-icon" title="Editar empresa" id="btn-edit-company">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        </div>
        
        <div class="company-card-pro__body">
          <div class="info-row">
            <span class="info-label">Nombre Legal</span>
            <span class="info-value" style="font-size: 18px; font-weight: 700; color: #0f172a;">
              ${escapeHtml(company.name)}
            </span>
          </div>
          
          <div class="info-row">
            <span class="info-label">Sitio Web</span>
            <span class="info-value">
              ${
                company.website
                  ? `<a href="${company.website}" target="_blank" style="color: #3b82f6; text-decoration: none;">${escapeHtml(company.website)}</a>`
                  : '<span style="color:#94a3b8;">No especificado</span>'
              }
            </span>
          </div>
          
          <div class="info-row">
            <span class="info-label">Estado de Cuenta</span>
            <span class="info-value">
              ${company.isVerified ? "✅ Verificada" : "⏳ Pendiente de Verificación"}
            </span>
          </div>
        </div>
      </div>

      <div class="company-card-pro verification-card ${status.class}">
        <div class="company-card-pro__header">
          <h3>Estatus de Verificación</h3>
          <span class="status-badge status-badge--${status.class}">${status.label}</span>
        </div>
        <div class="company-card-pro__body" style="display:flex; flex-direction:column; justify-content:space-between; min-height: 120px;">
          <p style="color: #475569; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
            ${status.desc}
          </p>
          ${
            canVerify
              ? `
            <button class="btn btn--primary" id="btn-submit-verification" style="width: 100%;">
              Subir Documentos de Verificación
            </button>
          `
              : ""
          }
        </div>
      </div>
    </div>
  `;
}

/* =========================
   MAIN
========================= */

export async function initRecruiterCompanyPage() {
  const app = document.getElementById("app");
  showLoading("Cargando perfil de empresa...");

  try {
    const authContext = getAuthUiContext();
    const { isAuthenticated, user, roles, primaryRole } = authContext;

    const freshProfile = await authService.fetchCurrentUserProfile();
    const currentUser = freshProfile?.user || user;

    const companyId = getCompanyIdFromUser(currentUser);
    let contentHtml = "";

    if (!companyId) {
      contentHtml = renderNoCompanyView();
    } else {
      const companyData = await companyService.getCompanyById(companyId);
      contentHtml = renderCompanyDashboardView(companyData);
    }

    const navbar = renderNavbar({
      activeRoute: config.ROUTES.COMPANY_DASHBOARD,
      isAuthenticated,
      user: currentUser,
      roles,
      primaryRole,
    });

    const shell = renderRoleShell({
      title: "Mi Empresa",
      subtitle: "Gestiona el perfil público y la verificación de tu compañía.",
      roles,
      primaryRole,
      content: contentHtml,
      shellClass: "recruiter-company-shell",
    });

    app.innerHTML = renderPage({
      navbar,
      main: `<div class="container">${shell}</div>`,
      pageClass: "recruiter-company-page",
      extraStyles: styles,
    });

    bindEvents(authContext, companyId);
  } catch (error) {
    console.error("Error loading recruiter company page:", error);
    app.innerHTML = `<div class="container" style="margin-top:40px; text-align:center;"><h2>Error de conexión</h2><p>No pudimos cargar tu información.</p></div>`;
  }
}

/* =========================
   STYLES
========================= */

const styles = `
.recruiter-company-page { min-height: calc(100vh - 70px); background: #f8fafc; padding: 28px 0; }
.recruiter-company-shell .role-shell__content { background: transparent; border: none; padding: 0; box-shadow: none; }
.empty-state-wrapper { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 60px 20px; display: flex; justify-content: center; align-items: center; }
.empty-state-box { text-align: center; max-width: 400px; }
.empty-icon { width: 64px; height: 64px; margin: 0 auto 20px; background: #eff6ff; color: #2563eb; border-radius: 16px; display: flex; align-items: center; justify-content: center; }
.empty-icon svg { width: 32px; height: 32px; }
.empty-state-box h2 { font-size: 20px; color: #0f172a; margin: 0 0 12px; }
.empty-state-box p { color: #64748b; font-size: 14px; line-height: 1.5; margin: 0 0 24px; }
.company-dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; }
.company-card-pro { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; display: flex; flex-direction: column; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.company-card-pro__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px; }
.company-card-pro__header h3 { margin: 0; font-size: 16px; font-weight: 700; color: #0f172a; }
.company-card-pro__body { display: flex; flex-direction: column; gap: 16px; }
.info-row { display: flex; flex-direction: column; gap: 4px; }
.info-label { font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
.info-value { font-size: 15px; color: #334155; }
.btn-icon { background: transparent; border: none; color: #64748b; cursor: pointer; padding: 4px; border-radius: 6px; transition: all 0.2s; }
.btn-icon:hover:not(:disabled) { background: #f1f5f9; color: #0f172a; }
.btn-icon:disabled { opacity: 0.4; cursor: not-allowed; }
.verification-card.pending { background: #fffbeb; border-color: #fde68a; }
.verification-card.verified { background: #ecfdf5; border-color: #a7f3d0; }
.verification-card.rejected { background: #fef2f2; border-color: #fecaca; }
.verification-card.none { background: #f8fafc; border-color: #e2e8f0; }
.status-badge { font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 999px; text-transform: uppercase; }
.status-badge--pending { background: #fde68a; color: #b45309; }
.status-badge--verified { background: #d1fae5; color: #047857; }
.status-badge--rejected { background: #fecaca; color: #b91c1c; }
.status-badge--none { background: #e2e8f0; color: #475569; }
.btn { display: inline-flex; justify-content: center; align-items: center; padding: 10px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; text-decoration: none; }
.btn--primary { background: #2563eb; color: #ffffff; border: none; }
.btn--primary:hover { background: #1d4ed8; }
.custom-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.65); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(3px); animation: fadeIn 0.2s ease; }
.custom-modal-card { background: #ffffff; border-radius: 12px; width: 90%; max-width: 460px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); overflow: hidden; animation: slideUp 0.2s ease; }
.custom-modal-header { padding: 20px 24px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
.custom-modal-header h2 { margin: 0; font-size: 18px; color: #0f172a; font-weight: 700; }
.custom-modal-body { padding: 24px; }
.custom-modal-footer { padding: 16px 24px; border-top: 1px solid #e2e8f0; background: #f8fafc; display: flex; justify-content: flex-end; gap: 12px; }
.custom-input, .custom-textarea { width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-family: inherit; font-size: 14px; outline: none; transition: border-color 0.2s; box-sizing: border-box; }
.custom-input:focus, .custom-textarea:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
.admin-btn { padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; background: #ffffff; border: 1px solid #cbd5e1; color: #334155; transition: all 0.2s; }
.admin-btn:hover { background: #f1f5f9; }
.admin-btn--primary { background: #2563eb; color: white; border: none; }
.admin-btn--primary:hover { background: #1d4ed8; }
.custom-toast { position: fixed; bottom: 24px; right: 24px; padding: 14px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; color: white; z-index: 10000; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); transition: opacity 0.3s ease; }
.custom-toast--success { background: #10b981; }
.custom-toast--error { background: #ef4444; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { transform: translateY(15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
`;
