// My Vacancies Page Controller - Fixed by Puente
import { config } from "@core/config";
import { vacancyService } from "@services/vacancy.service";
import { companyService } from "@services/company.service";
import { authService } from "@services/auth.service";
import {
  getAuthUiContext,
  renderContentState,
  renderNavbar,
  renderPage,
  renderRoleShell,
  showLoading,
  resolveRequestErrorMessage,
} from "@utils/ui";

/* =========================
   HELPERS & UI
========================= */

function normalizeVacanciesResponse(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.items)) return result.items;
  return [];
}

function getStatusMeta(status) {
  const map = {
    published: { label: "Publicada", color: "#10b981" },
    draft: { label: "Borrador", color: "#9ca3af" },
    closed: { label: "Cerrada", color: "#f59e0b" },
    archived: { label: "Archivada", color: "#64748b" },
  };
  return map[status] || map.draft;
}

function customConfirm(
  title,
  message,
  confirmText = "Confirmar",
  isDanger = false,
) {
  return new Promise((resolve) => {
    const modalHtml = `
      <div id="custom-modal" class="modal-overlay">
        <div class="modal-card">
          <h3>${title}</h3>
          <p>${message}</p>
          <div class="modal-actions">
            <button class="btn btn--outline" id="modal-cancel">Cancelar</button>
            <button class="btn ${isDanger ? "btn--danger" : "btn--primary"}" id="modal-confirm">${confirmText}</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", modalHtml);

    const modal = document.getElementById("custom-modal");
    modal.querySelector("#modal-cancel").onclick = () => {
      modal.remove();
      resolve(false);
    };
    modal.querySelector("#modal-confirm").onclick = () => {
      modal.remove();
      resolve(true);
    };
  });
}

function showToast(message, type = "success") {
  const el = document.createElement("div");
  el.className = `toast toast--${type}`;
  el.innerText = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

/* =========================
   COMPONENTS (RENDERS)
========================= */

// 1. Renderiza la CARD individual
function renderVacancyCard(v) {
  const status = getStatusMeta(v.status);
  const count = v.applicationsCount || 0;

  return `
    <article class="vacancy-card ${v.status === "published" ? "vacancy-card--active" : ""}">
      <div class="vacancy-card__header">
        <h3>${v.title || "Sin título"}</h3>
        <span class="badge" style="background:${status.color}15; color:${status.color}">
          ${status.label}
        </span>
      </div>
      <div class="vacancy-card__meta">
        <span>📍 ${[v.city, v.country].filter(Boolean).join(", ") || "Ubicación no definida"}</span>
      </div>
      <div class="vacancy-card__stats">
        <span class="stat">👥 ${count} candidatos</span>
      </div>
      <div class="vacancy-card__actions">
        ${
          v.status === "published"
            ? `<button class="btn btn--primary btn--block" data-view-applicants="${v.id}">Ver candidatos</button>`
            : `<div class="inactive-badge">Vacante Pausada</div>`
        }
        <div class="vacancy-card__secondary">
          <button class="btn btn--outline btn--sm" data-edit="${v.id}">Editar</button>
          
          ${
            v.status === "published"
              ? `<button class="btn btn--outline btn--sm btn-warn-text" data-close="${v.id}">Cerrar</button>`
              : v.status === "closed" || v.status === "draft"
                ? `<button class="btn btn--outline btn--sm btn-success-text" data-reopen="${v.id}">Publicar</button>`
                : ""
          }

          <button class="btn btn--outline btn--sm" data-archive="${v.id}" title="Archivar">📁</button>
          <button class="btn btn--outline btn--sm btn-danger-icon" data-delete="${v.id}" title="Eliminar">🗑️</button>
        </div>
      </div>
    </article>
  `;
}

// 2. Renderiza la LISTA completa (ESTA ERA LA QUE FALTABA)
function renderVacancyList(vacancies = []) {
  if (!vacancies.length) {
    return renderContentState({
      title: "Sin vacantes",
      message: "Crea tu primera vacante para comenzar.",
      actionLabel: "Crear vacante",
      actionHref: `#${config.ROUTES.CREATE_VACANCY}`,
    });
  }

  return `
    <section class="vacancies-grid">
      ${vacancies.map(renderVacancyCard).join("")}
    </section>
  `;
}

/* =========================
   EVENTS
========================= */

function bindEvents() {
  document.querySelectorAll("[data-view-applicants]").forEach((btn) => {
    btn.onclick = () =>
      (window.location.hash = `#/company/vacancies/${btn.dataset.viewApplicants}/applicants`);
  });

  document.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.onclick = () =>
      (window.location.hash = `#${config.ROUTES.EDIT_VACANCY.replace(":id", btn.dataset.edit)}`);
  });

  document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.onclick = async () => {
      const ok = await customConfirm(
        "Cerrar vacante",
        "¿Deseas pausar esta vacante?",
      );
      if (ok) {
        try {
          await vacancyService.updateVacancy(btn.dataset.close, {
            status: "closed",
          });
          showToast("Vacante cerrada");
          initMyVacanciesPage();
        } catch (e) {
          alert(resolveRequestErrorMessage(e));
        }
      }
    };
  });

  document.querySelectorAll("[data-reopen]").forEach((btn) => {
    btn.onclick = async () => {
      try {
        await vacancyService.updateVacancy(btn.dataset.reopen, {
          status: "published",
        });
        showToast("¡Vacante en línea!");
        initMyVacanciesPage();
      } catch (e) {
        alert(resolveRequestErrorMessage(e));
      }
    };
  });

  document.querySelectorAll("[data-archive]").forEach((btn) => {
    btn.onclick = async () => {
      const ok = await customConfirm(
        "Archivar",
        "Se ocultará de la lista principal.",
      );
      if (ok) {
        try {
          await vacancyService.updateVacancy(btn.dataset.archive, {
            status: "archived",
          });
          showToast("Vacante archivada");
          initMyVacanciesPage();
        } catch (e) {
          alert(resolveRequestErrorMessage(e));
        }
      }
    };
  });

  document.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.onclick = async () => {
      const ok = await customConfirm(
        "¿Eliminar?",
        "Esta acción es permanente.",
        "Eliminar",
        true,
      );
      if (ok) {
        try {
          await vacancyService.deleteVacancy(btn.dataset.delete);
          showToast("Vacante borrada", "error");
          initMyVacanciesPage();
        } catch (e) {
          alert(resolveRequestErrorMessage(e));
        }
      }
    };
  });
}

/* =========================
   MAIN INITIALIZATION
========================= */

export async function initMyVacanciesPage() {
  const app = document.getElementById("app");
  const authContext = getAuthUiContext();
  showLoading("Cargando tus vacantes...");

  try {
    const result = await vacancyService.getVacanciesForManagement();
    let vacancies = normalizeVacanciesResponse(result);

    // Filtramos las archivadas para que no salgan
    vacancies = vacancies.filter((v) => v.status !== "archived");

    const freshProfile = await authService.fetchCurrentUserProfile();
    const currentUser = freshProfile?.user || authContext.user;
    const companyId = currentUser?.companyId || currentUser?.company?.id;

    let isCompanyVerified = false;
    if (companyId) {
      const companyData = await companyService.getCompanyById(companyId);
      isCompanyVerified =
        companyData.isVerified === true ||
        companyData.verificationStatus === "approved";
    }

    const navbar = renderNavbar({
      activeRoute: config.ROUTES.MY_VACANCIES,
      ...authContext,
    });

    const shell = renderRoleShell({
      title: "Mis Vacantes",
      subtitle: "Gestiona y monitorea tus procesos de contratación",
      roles: authContext.roles,
      primaryRole: authContext.primaryRole,
      actions: isCompanyVerified
        ? `<a href="#${config.ROUTES.CREATE_VACANCY}" class="btn btn--primary">+ Nueva vacante</a>`
        : "",
      content: renderVacancyList(vacancies), // Aquí es donde se llamaba a la función faltante
    });

    app.innerHTML = renderPage({
      navbar,
      main: `<div class="container">${shell}</div>`,
      extraStyles: `
        .vacancies-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(320px,1fr)); gap:24px; }
        .vacancy-card { background:#fff; border-radius:18px; padding:22px; border:1px solid #e5e7eb; display:flex; flex-direction:column; gap:16px; transition:.25s ease; position:relative; }
        .vacancy-card:hover { transform:translateY(-4px); box-shadow:0 12px 24px rgba(0,0,0,0.06); }
        .vacancy-card--active { border-left: 4px solid #3b82f6; }
        .inactive-badge { background: #f3f4f6; color: #6b7280; text-align: center; padding: 10px; border-radius: 8px; font-size: 13px; font-weight: 600; border: 1px dashed #d1d5db; }
        .vacancy-card__secondary { display:flex; gap:8px; margin-top: 5px; }
        .btn-danger-icon { border-color: #fee2e2 !important; filter: grayscale(1); }
        .btn-danger-icon:hover { filter: grayscale(0); background: #fee2e2; }
        .btn-warn-text { color: #d97706; border-color: #fef3c7 !important; }
        .btn-success-text { color: #059669; border-color: #d1fae5 !important; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7); display: flex; align-items: center; justify-content: center; z-index: 10000; backdrop-filter: blur(4px); }
        .modal-card { background: white; padding: 32px; border-radius: 20px; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
        .modal-actions { display: flex; gap: 12px; justify-content: center; margin-top: 24px; }
        .toast { position: fixed; bottom: 20px; right: 20px; padding: 12px 24px; border-radius: 8px; color: white; font-weight: 600; z-index: 9999; }
        .toast--success { background: #10b981; }
        .toast--error { background: #ef4444; }
      `,
    });

    bindEvents();
  } catch (error) {
    app.innerHTML = `<div class="container">${renderContentState({ type: "error", title: "Error", message: resolveRequestErrorMessage(error) })}</div>`;
  }
}
