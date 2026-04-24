import { adminService } from "@services/admin.service";
import { companyService } from "@services/company.service";
import { config } from "@core/config";
import {
  getAuthUiContext,
  renderNavbar,
  renderPage,
  renderRoleShell,
  renderContentState,
  showLoading,
} from "@utils/ui";

/* =========================
   STATE
========================= */
let currentFilter = "all";
let state = {
  companies: [],
  loading: false,
};

/* =========================
   UI HELPERS (MODALS & TOASTS)
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

function customConfirm(
  title,
  message,
  confirmText = "Confirmar",
  isDanger = false,
) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "custom-modal-overlay";
    overlay.innerHTML = `
      <div class="custom-modal-card">
        <div class="custom-modal-header">
          <h2>${title}</h2>
        </div>
        <div class="custom-modal-body">
          <p>${message}</p>
        </div>
        <div class="custom-modal-footer">
          <button class="admin-btn" id="custom-modal-cancel">Cancelar</button>
          <button class="admin-btn ${isDanger ? "btn-danger" : "admin-btn--primary"}" id="custom-modal-confirm">${confirmText}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = (val) => {
      overlay.remove();
      resolve(val);
    };

    overlay.querySelector("#custom-modal-cancel").onclick = () => close(false);
    overlay.querySelector("#custom-modal-confirm").onclick = () => close(true);
  });
}

function customPrompt(title, message, placeholder = "Escribe aquí...") {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "custom-modal-overlay";
    overlay.innerHTML = `
      <div class="custom-modal-card">
        <div class="custom-modal-header">
          <h2>${title}</h2>
        </div>
        <div class="custom-modal-body">
          <p style="margin-bottom: 12px; color: #475569; font-size: 14px;">${message}</p>
          <textarea id="custom-modal-input" class="custom-textarea" placeholder="${placeholder}"></textarea>
        </div>
        <div class="custom-modal-footer">
          <button class="admin-btn" id="custom-modal-cancel">Cancelar</button>
          <button class="admin-btn btn-danger" id="custom-modal-confirm">Continuar</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const input = overlay.querySelector("#custom-modal-input");
    input.focus();

    const close = (val) => {
      overlay.remove();
      resolve(val);
    };

    overlay.querySelector("#custom-modal-cancel").onclick = () => close(null);
    overlay.querySelector("#custom-modal-confirm").onclick = () => {
      const val = input.value.trim();
      if (!val) {
        input.style.borderColor = "#ef4444";
        return;
      }
      close(val);
    };
  });
}

// Formulario de Creación
function showCreateCompanyModal() {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "custom-modal-overlay";
    overlay.innerHTML = `
      <div class="custom-modal-card">
        <div class="custom-modal-header">
          <h2>Crear Nueva Empresa</h2>
        </div>
        <div class="custom-modal-body" style="display:flex; flex-direction:column; gap:16px;">
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
          <button class="admin-btn admin-btn--primary" id="cc-submit">Guardar Empresa</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const nameInput = overlay.querySelector("#cc-name");
    const websiteInput = overlay.querySelector("#cc-website");
    nameInput.focus();

    const close = (val) => {
      overlay.remove();
      resolve(val);
    };

    overlay.querySelector("#cc-cancel").onclick = () => close(null);
    overlay.querySelector("#cc-submit").onclick = () => {
      const name = nameInput.value.trim();
      const website = websiteInput.value.trim();

      if (!name) {
        nameInput.style.borderColor = "#ef4444";
        return;
      }

      close({ name, website });
    };
  });
}

// Modal de Edición de Empresa
function showEditCompanyModal(company) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "custom-modal-overlay";
    overlay.innerHTML = `
      <div class="custom-modal-card">
        <div class="custom-modal-header">
          <h2>Editar Empresa: ${company.name}</h2>
        </div>
        <div class="custom-modal-body" style="display:flex; flex-direction:column; gap:16px;">
          <div>
            <label style="font-size:12px; font-weight:700; color:#475569; display:block; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.05em;">Nombre de la Empresa</label>
            <input type="text" id="ce-name" class="custom-input" value="${company.name || ""}" placeholder="Ej: TechCorp S.A." />
          </div>
          <div>
            <label style="font-size:12px; font-weight:700; color:#475569; display:block; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.05em;">Sitio Web</label>
            <input type="url" id="ce-website" class="custom-input" value="${company.website || ""}" placeholder="Ej: https://techcorp.com" />
          </div>
        </div>
        <div class="custom-modal-footer">
          <button class="admin-btn" id="ce-cancel">Cancelar</button>
          <button class="admin-btn admin-btn--primary" id="ce-submit">Actualizar Datos</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const nameInput = overlay.querySelector("#ce-name");
    const websiteInput = overlay.querySelector("#ce-website");
    nameInput.focus();

    const close = (val) => {
      overlay.remove();
      resolve(val);
    };

    overlay.querySelector("#ce-cancel").onclick = () => close(null);
    overlay.querySelector("#ce-submit").onclick = () => {
      const name = nameInput.value.trim();
      const website = websiteInput.value.trim();
      if (!name) {
        nameInput.style.borderColor = "#ef4444";
        return;
      }
      close({ name, website });
    };
  });
}

function showDocumentsModal(company) {
  return new Promise((resolve) => {
    // Intentamos extraer los documentos de la solicitud más reciente
    const submissions = company.verificationSubmissions || [];
    const latestSubmission = submissions[0] || {};
    const docs = latestSubmission.documents || [];

    let docsHtml = "";
    if (docs.length === 0) {
      docsHtml = `<p style="color: #ef4444; font-size: 14px;">No se encontraron documentos adjuntos para esta empresa.</p>`;
    } else {
      docsHtml = docs
        .map((doc) => {
          // 1. Obtenemos la ruta que guardó la BD
          const rawUrl = doc.fileUrl || doc.file_url;

          // 2. ARMAMOS LA URL PÚBLICA DE SUPABASE
          let finalUrl = rawUrl;
          if (rawUrl && !rawUrl.startsWith("http")) {
            finalUrl = `https://nnrllwyuunrfnpyprfqt.supabase.co/storage/v1/object/public/CompanyDocs/${rawUrl}`;
          }

          return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 8px;">
          <span style="font-size: 14px; font-weight: 500; color: #334155; word-break: break-all;">
            Documento (${doc.documentType || "Archivo"})
          </span>
          <a href="${finalUrl}" target="_blank" rel="noopener noreferrer" class="admin-btn admin-btn--primary" style="text-decoration: none; font-size: 12px; padding: 6px 12px;">
            Ver/Descargar
          </a>
        </div>
      `;
        })
        .join("");
    }

    const overlay = document.createElement("div");
    overlay.className = "custom-modal-overlay";
    overlay.innerHTML = `
      <div class="custom-modal-card">
        <div class="custom-modal-header">
          <h2>Documentos de Verificación</h2>
        </div>
        <div class="custom-modal-body" style="max-height: 300px; overflow-y: auto;">
          <p style="margin-bottom: 16px; font-size: 14px; color: #64748b;">
            Empresa: <strong>${company.name}</strong>
          </p>
          ${docsHtml}
        </div>
        <div class="custom-modal-footer">
          <button class="admin-btn" id="docs-modal-close">Cerrar</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => {
      overlay.remove();
      resolve(true);
    };

    overlay.querySelector("#docs-modal-close").onclick = close;
  });
}

/* =========================
   LOGIC HELPERS
========================= */

function getFilterFromUrl() {
  const hash = window.location.hash;
  const query = hash.split("?")[1];
  if (!query) return "all";

  const params = new URLSearchParams(query);
  return params.get("filter") || "all";
}

function normalizeCompaniesResponse(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

function filterCompanies(companies) {
  if (currentFilter === "pending") {
    return companies.filter((c) => c.verificationStatus === "pending");
  }
  if (currentFilter === "verified") {
    return companies.filter((c) => c.verificationStatus === "approved");
  }
  return companies;
}

/* =========================
   UI COMPONENTS
========================= */

function renderTabs() {
  const counts = {
    all: state.companies.length,
    pending: state.companies.filter((c) => c.verificationStatus === "pending")
      .length,
    verified: state.companies.filter((c) => c.verificationStatus === "approved")
      .length,
  };

  return `
    <div class="admin-tabs-pill">
      ${tab(`Todas (${counts.all})`, "all")}
      ${tab(`Pendientes (${counts.pending})`, "pending")}
      ${tab(`Verificadas (${counts.verified})`, "verified")}
    </div>
  `;
}

function tab(label, value) {
  return `
    <button 
      class="tab-pill ${currentFilter === value ? "active" : ""}" 
      data-filter="${value}"
    >
      ${label}
    </button>
  `;
}

function renderCompanyCard(c) {
  const statusMap = {
    pending: { label: "Pendiente", class: "pending" },
    approved: { label: "Verificada", class: "verified" },
    rejected: { label: "Rechazada", class: "rejected" },
    none: { label: "Sin verificación", class: "none" },
  };

  const status = statusMap[c.verificationStatus] || statusMap.none;

  return `
    <article class="company-card">
      <div class="company-card__header">
        <h3 class="company-card__title" title="${c.name || "Empresa"}">${c.name || "Nombre no disponible"}</h3>
        <span class="card-badge card-badge--${status.class}">
          ${status.label}
        </span>
      </div>

      <div class="company-card__meta">
        ${c.ownerEmail || "Sin email"} <span style="margin: 0 4px; color: #cbd5e1;">|</span> ${c.website || "Sin sitio web"}
      </div>

      <div class="company-card__actions">
        ${
          c.verificationStatus === "pending"
            ? `
              <button class="card-btn" style="border-color: #3b82f6; color: #3b82f6;" data-view-docs="${c.id}">Ver Docs</button>
              <button class="card-btn card-btn--approve" data-approve="${c.id}">Aprobar</button>
              <button class="card-btn card-btn--reject" data-reject="${c.id}">Rechazar</button>
            `
            : ""
        }
        <button class="card-btn" style="border-color: #0f172a;" data-edit-company="${c.id}">Editar</button>
        <button class="card-btn" data-delete="${c.id}">Eliminar</button>
      </div>
    </article>
  `;
}

function renderCompanyList(companies) {
  if (!companies.length) {
    return renderContentState({
      type: "empty",
      title: "Sin empresas",
      message: "No hay empresas que coincidan con este filtro en este momento.",
    });
  }

  return `
    <section class="companies-grid">
      ${companies.map(renderCompanyCard).join("")}
    </section>
  `;
}

/* =========================
   EVENTS
========================= */

function bindEvents() {
  // FILTERS
  document.querySelectorAll("[data-filter]").forEach((btn) => {
    btn.onclick = () => {
      window.location.hash = `#/admin/companies?filter=${btn.dataset.filter}`;
    };
  });

  // VIEW DOCS
  document.querySelectorAll("[data-view-docs]").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.viewDocs;
      const company = state.companies.find((c) => c.id === id);
      if (company) {
        showDocumentsModal(company);
      }
    };
  });

  // EDIT COMPANY
  document.querySelectorAll("[data-edit-company]").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.editCompany;
      const company = state.companies.find((c) => c.id === id);
      if (!company) return;

      const newData = await showEditCompanyModal(company);
      if (!newData) return;

      showLoading("Actualizando empresa...");
      try {
        // Usamos el servicio de administración para actualizar
        await adminService.updateCompany(id, newData);
        showToast("Empresa actualizada correctamente");
        await reloadCompanies();
      } catch (error) {
        showToast("Error al actualizar la empresa", "error");
        await reloadCompanies();
      }
    };
  });

  // CREATE COMPANY (FIXED: Usando initAdminCompaniesPage para reconstruir el DOM)
  const createBtn = document.getElementById("btn-create-company");
  if (createBtn) {
    createBtn.onclick = async () => {
      const data = await showCreateCompanyModal();
      if (!data) return; // Canceló

      showLoading("Creando empresa...");
      try {
        await companyService.createCompany(data);
        showToast("¡Empresa creada exitosamente!");
        // En lugar de reloadCompanies, reconstruimos toda la vista
        await initAdminCompaniesPage();
      } catch (error) {
        const msg =
          error.response?.data?.message ||
          error.message ||
          "Error al crear la empresa";
        showToast(msg, "error");
        // Recuperamos la vista reconstruyéndola
        await initAdminCompaniesPage();
      }
    };
  }

  // APPROVE
  document.querySelectorAll("[data-approve]").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.approve;
      const company = state.companies.find((c) => c.id === id);
      const name = company?.name || "esta empresa";

      const confirmed1 = await customConfirm(
        "Aprobar Empresa",
        `¿Deseas iniciar el proceso de aprobación para <strong>${name}</strong>?`,
        "Continuar",
      );
      if (!confirmed1) return;

      const confirmed2 = await customConfirm(
        "Doble Validación Requerida",
        `¿Confirmas definitivamente que <strong>${name}</strong> cumple todos los requisitos?`,
        "Sí, Aprobar Definitivamente",
      );
      if (!confirmed2) return;

      try {
        await adminService.approveCompany(id);
        showToast("Empresa aprobada exitosamente");
        await reloadCompanies();
      } catch (e) {
        showToast("Error al aprobar la empresa", "error");
      }
    };
  });

  // REJECT
  document.querySelectorAll("[data-reject]").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.reject;
      const company = state.companies.find((c) => c.id === id);
      const name = company?.name || "esta empresa";

      const reason = await customPrompt(
        "Rechazar Empresa",
        `Por favor, proporciona el motivo detallado por el cual estás rechazando a <strong>${name}</strong>.`,
        "Ej: Documentación incompleta...",
      );
      if (!reason) return;

      const confirmed2 = await customConfirm(
        "Confirmar Rechazo",
        `¿Estás absolutamente seguro de enviar este rechazo a <strong>${name}</strong>?`,
        "Sí, Rechazar Empresa",
        true,
      );
      if (!confirmed2) return;

      try {
        await adminService.rejectCompany(id, reason);
        showToast("Empresa rechazada exitosamente");
        await reloadCompanies();
      } catch (e) {
        showToast("Error al rechazar la empresa", "error");
      }
    };
  });

  // DELETE
  document.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.delete;
      const company = state.companies.find((c) => c.id === id);
      const name = company?.name || "esta empresa";

      const confirmed = await customConfirm(
        "Eliminar Empresa",
        `Esta acción eliminará permanentemente a <strong>${name}</strong>. ¿Deseas continuar?`,
        "Eliminar permanentemente",
        true,
      );
      if (!confirmed) return;

      try {
        await adminService.deleteCompany(id);
        showToast("Empresa eliminada exitosamente");
        await reloadCompanies();
      } catch (e) {
        showToast("Error al eliminar la empresa", "error");
      }
    };
  });
}

/* =========================
   RENDER
========================= */

function render() {
  const filtered = filterCompanies(state.companies);

  const content = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      ${renderTabs()}
      <button class="admin-btn admin-btn--primary" id="btn-create-company" style="display: flex; align-items: center; gap: 6px;">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        Crear Empresa
      </button>
    </div>
    ${renderCompanyList(filtered)}
  `;

  const container = document.querySelector(".admin-companies-content");
  if (container) {
    container.innerHTML = content;
    bindEvents();
  }
}

/* =========================
   DATA
========================= */

async function reloadCompanies() {
  state.loading = true;
  try {
    const result = await adminService.getCompanies();
    state.companies = normalizeCompaniesResponse(result);
    render();
  } catch (error) {
    console.error(error);
  } finally {
    state.loading = false;
  }
}

/* =========================
   MAIN
========================= */

export async function initAdminCompaniesPage() {
  const app = document.getElementById("app");
  const authContext = getAuthUiContext();

  currentFilter = getFilterFromUrl();

  showLoading("Cargando empresas...");

  try {
    const result = await adminService.getCompanies();
    state.companies = normalizeCompaniesResponse(result);

    const navbar = renderNavbar({
      activeRoute: config.ROUTES.ADMIN_COMPANIES,
      ...authContext,
    });

    const shell = renderRoleShell({
      title: "Empresas",
      subtitle: "Gestión y verificación de empresas",
      roles: authContext.roles,
      primaryRole: authContext.primaryRole,
      content: `<div class="admin-companies-content"></div>`,
    });

    app.innerHTML = renderPage({
      navbar,
      main: `<div class="container admin-container-centered">${shell}</div>`,
      extraStyles: styles,
    });

    render();
  } catch (error) {
    app.innerHTML = `<p>Error cargando empresas</p>`;
  }
}

/* =========================
   STYLES
========================= */

const styles = `
/* Layout */
.admin-container-centered {
  max-width: 1100px;
  margin: 0 auto;
  padding: 30px 15px;
}

.role-shell__content {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  padding: 32px;
  border: 1px solid #e2e8f0;
}

/* Tabs (Pill Style) */
.admin-tabs-pill {
  display: flex;
  gap: 12px;
}

.tab-pill {
  padding: 8px 20px;
  border-radius: 999px;
  background: #f1f5f9;
  border: none;
  font-size: 14px;
  font-weight: 500;
  color: #334155;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-pill:hover { background: #e2e8f0; }

.tab-pill.active {
  background: #2563eb;
  color: #ffffff;
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
}

/* Grid & Cards */
.companies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.company-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.company-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
}

.company-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.company-card__title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.company-card__meta {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 24px;
}

.company-card__actions {
  display: flex;
  gap: 10px;
  margin-top: auto;
}

.card-btn {
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #334155;
  transition: all 0.2s ease;
}

.card-btn:hover {
  background: #f8fafc;
  border-color: #94a3b8;
}

.card-btn--approve { background: #2563eb; color: white; border: none; }
.card-btn--approve:hover { background: #1d4ed8; }

.card-btn--reject { color: #ef4444; border-color: #fca5a5; }
.card-btn--reject:hover { background: #fef2f2; }

/* Badges */
.card-badge {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  font-weight: 500;
  white-space: nowrap;
}

.card-badge--none { background: #f1f5f9; color: #94a3b8; }
.card-badge--rejected { background: #fef2f2; color: #ef4444; }
.card-badge--verified { background: #ecfdf5; color: #10b981; }
.card-badge--pending { background: #fffbeb; color: #d97706; }

/* =========================================
   M O D A L S   C S S
========================================= */

.custom-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(3px);
  animation: fadeIn 0.2s ease;
}

.custom-modal-card {
  background: #ffffff;
  border-radius: 12px;
  width: 90%;
  max-width: 440px;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
  overflow: hidden;
  animation: slideUp 0.2s ease;
}

.custom-modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.custom-modal-header h2 {
  margin: 0;
  font-size: 18px;
  color: #0f172a;
  font-weight: 700;
}

.custom-modal-body {
  padding: 24px;
  color: #334155;
  font-size: 15px;
  line-height: 1.5;
}

.custom-modal-body p { margin: 0; }

.custom-modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.custom-textarea, .custom-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.custom-textarea { min-height: 100px; resize: vertical; }
.custom-textarea:focus, .custom-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.admin-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #334155;
  transition: all 0.2s;
}
.admin-btn:hover { background: #f1f5f9; }

.admin-btn--primary { background: #2563eb; color: white; border: none; }
.admin-btn--primary:hover { background: #1d4ed8; }

.btn-danger { background: #ef4444; color: white; border: none; }
.btn-danger:hover { background: #dc2626; }

/* Toasts */
.custom-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 14px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  z-index: 10000;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
  transition: opacity 0.3s ease;
}
.custom-toast--success { background: #10b981; }
.custom-toast--error { background: #ef4444; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { transform: translateY(15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
`;
