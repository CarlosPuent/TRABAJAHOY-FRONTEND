import { config } from "@core/config";
import { ROLE } from "@core/roles";
import { adminService } from "@services/admin.service";
import {
  getAuthUiContext,
  renderContentState,
  renderNavbar,
  renderPage,
  renderRoleShell,
  resolveRequestErrorMessage,
  showLoading,
} from "@utils/ui";

const DEFAULT_LIMIT = 10;

function showToast(message) {
  const el = document.createElement("div");
  el.className = "toast";
  el.innerText = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

const ROLE_FILTER_OPTIONS = [
  "all",
  ROLE.ADMIN,
  ROLE.RECRUITER,
  ROLE.CANDIDATE,
  ROLE.MODERATOR,
];

const ROLE_LABELS = {
  [ROLE.ADMIN]: "ADMINISTRADOR",
  [ROLE.RECRUITER]: "RECLUTADOR",
  [ROLE.CANDIDATE]: "CANDIDATO",
  [ROLE.MODERATOR]: "MODERADOR",
};

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(dateValue) {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("es-SV", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function setGlobalFeedback(state, message, type = "info") {
  state.feedback = { message, type };
}

/* =========================================================
   🔥 COMPONENTES UI
========================================================= */

function renderRoleBadges(roles = []) {
  if (!Array.isArray(roles) || roles.length === 0) {
    return '<span class="admin-role-tag admin-role-tag--empty">SIN ROLES</span>';
  }

  return roles
    .map((role) => {
      const normalized = normalizeRoleName(role);
      return `<span class="admin-role-tag admin-role-tag--${escapeHtml(normalized)}">${escapeHtml(getRoleLabel(normalized))}</span>`;
    })
    .join(" ");
}

function renderUsersTable(state) {
  if (state.errorMessage) {
    return renderContentState({
      type: "error",
      title: "No se pudieron cargar usuarios",
      message: state.errorMessage,
    });
  }

  if (state.loadingUsers) {
    return `<div class="admin-users-loading"><p>Cargando usuarios...</p></div>`;
  }

  if (!state.visibleUsers.length) {
    return `<div class="admin-users-loading"><p>No se encontraron usuarios</p></div>`;
  }

  return `
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Roles</th>
            <th>Fecha creación</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${state.visibleUsers
            .map(
              (u) => `
            <tr>
              <td class="col-id">${escapeHtml(u.id)}</td>
              <td>${escapeHtml(u.name)}</td>
              <td>${escapeHtml(u.email)}</td>
              <td>${renderRoleBadges(u.roles)}</td>
              <td>${formatDate(u.createdAtTs || u.raw?.createdAt)}</td>
              <td>
                <div class="action-buttons">
                  <button class="admin-btn admin-btn--inline" data-edit="${u.id}">Editar</button>
                  <button class="admin-btn admin-btn--inline btn-danger" data-delete="${u.id}">Eliminar</button>
                  <button class="admin-btn admin-btn--inline" data-manage-roles="${u.id}">Roles</button>
                </div>
              </td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderEditModal(state) {
  if (!state.editModal.open || !state.editModal.user) return "";
  const u = state.editModal.user;

  return `
    <div class="modal-overlay active" id="admin-edit-modal-overlay">
      <div class="modal-card admin-roles-modal">
        <div class="modal-header">
          <h2>Editar usuario</h2>
          <button class="modal-close" id="edit-close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <p class="th-feedback th-feedback--${state.editModal.feedback?.type}" ${state.editModal.feedback?.message ? "" : 'style="display:none;"'}>${escapeHtml(state.editModal.feedback?.message || "")}</p>
          <div class="admin-modal-block" style="margin-bottom: 15px;">
            <label>Nombre</label>
            <input class="admin-select" id="edit-firstName" value="${escapeHtml(u.raw?.firstName || u.name.split(" ")[0] || "")}" placeholder="Nombre"/>
          </div>
          <div class="admin-modal-block">
            <label>Apellido</label>
            <input class="admin-select" id="edit-lastName" value="${escapeHtml(u.raw?.lastName || u.name.split(" ").slice(1).join(" ") || "")}" placeholder="Apellido"/>
          </div>
          <div style="margin-top: 24px; display: flex; gap: 10px;">
            <button class="admin-btn" style="background: #0f172a; color: #fff;" id="edit-save">Guardar cambios</button>
            <button class="admin-btn" id="edit-cancel">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getAdminSidebar() {
  return `
    <aside class="admin-users-sidebar">
      <h3 class="admin-users-sidebar__title">Panel de<br>Administrador</h3>
      <nav class="admin-users-sidebar__nav">
        <a href="#${config.ROUTES.ADMIN_DASHBOARD}" class="admin-users-sidebar__link">Vista general</a>
        <a href="#${config.ROUTES.ADMIN_USERS}" class="admin-users-sidebar__link admin-users-sidebar__link--active">Gestion de usuarios</a>
        <span class="admin-users-sidebar__link admin-users-sidebar__link--muted">Moderacion de foro</span>
        <span class="admin-users-sidebar__link admin-users-sidebar__link--muted">Gestion de recursos</span>
      </nav>
    </aside>
  `;
}

function renderPagination(state) {
  if (state.totalPages <= 1) return "";

  const startItem = state.total === 0 ? 0 : (state.page - 1) * state.limit + 1;
  const endItem = Math.min(state.page * state.limit, state.total);

  return `
    <div class="admin-pagination">
      <p class="admin-pagination__summary">Mostrando ${startItem}-${endItem} de ${state.total} usuarios</p>
      <div class="admin-pagination__actions">
        <button class="admin-btn admin-btn--inline" id="admin-users-prev-page" ${state.page <= 1 ? "disabled" : ""}>Anterior</button>
        <span class="admin-pagination__page">Página ${state.page} de ${state.totalPages}</span>
        <button class="admin-btn admin-btn--inline" id="admin-users-next-page" ${state.page >= state.totalPages ? "disabled" : ""}>Siguiente</button>
      </div>
    </div>
  `;
}

function renderRolesModal(state) {
  if (!state.modal.open || !state.modal.user) return "";

  const user = state.modal.user;
  const currentRoles = state.modal.roles;
  const availableToAdd = state.catalogRoles.filter(
    (role) => !currentRoles.includes(role),
  );

  return `
    <div class="modal-overlay active" id="admin-roles-modal-overlay">
      <div class="modal-card admin-roles-modal">
        <div class="modal-header">
          <h2>Gestionar roles</h2>
          <button class="modal-close" id="admin-roles-close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="modal-body">
          <div class="admin-modal-user">
            <p><strong>Nombre:</strong> ${escapeHtml(user.name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(user.email || "-")}</p>
            <p><strong>Roles actuales:</strong> ${renderRoleBadges(currentRoles)}</p>
          </div>

          <p class="th-feedback th-feedback--${state.modal.feedback.type}" id="admin-roles-feedback" ${state.modal.feedback.message ? "" : 'style="display:none;"'}>${escapeHtml(state.modal.feedback.message || "")}</p>

          <div class="admin-modal-grid">
            <div class="admin-modal-block">
              <label>Agregar rol</label>
              <select id="admin-role-add-select" class="admin-select" ${state.modal.loading ? "disabled" : ""}>
                <option value="">Selecciona un rol</option>
                ${availableToAdd.map((role) => `<option value="${escapeHtml(role)}">${escapeHtml(getRoleLabel(role))}</option>`).join("")}
              </select>
              <button class="admin-btn" style="background: #0f172a; color:#fff; margin-top: 8px;" id="admin-role-assign-btn" ${state.modal.loading || state.modal.submitting ? "disabled" : ""}>Asignar rol</button>
            </div>

            <div class="admin-modal-block">
              <label>Quitar rol</label>
              <select id="admin-role-remove-select" class="admin-select" ${state.modal.loading ? "disabled" : ""}>
                <option value="">Selecciona un rol</option>
                ${currentRoles.map((role) => `<option value="${escapeHtml(role)}">${escapeHtml(getRoleLabel(role))}</option>`).join("")}
              </select>
              <button class="admin-btn" style="margin-top: 8px;" id="admin-role-remove-btn" ${state.modal.loading || state.modal.submitting ? "disabled" : ""}>Quitar rol</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderAdminUsersHTML(authContext, state) {
  const { isAuthenticated, user, roles, primaryRole } = authContext;

  const navbar = renderNavbar({
    activeRoute: config.ROUTES.ADMIN_USERS,
    isAuthenticated,
    user,
    roles,
    primaryRole,
  });

  const content = `
    <div class="admin-users-layout">
      ${getAdminSidebar()}

      <section class="admin-users-main">
        <h2 class="admin-users-main__title">Gestion de Usuarios</h2>
        <p class="th-feedback th-feedback--${state.feedback.type}" ${state.feedback.message ? "" : 'style="display:none; padding: 12px; border-radius: 8px; margin-bottom: 16px; background: #fee2e2; color: #991b1b; border: 1px solid #fecaca;"'}>${escapeHtml(state.feedback.message || "")}</p>

        <div class="admin-filters">
          <select id="admin-users-order-direction" class="admin-select">
            <option value="asc" ${state.orderDirection === "asc" ? "selected" : ""}>Ascendente</option>
            <option value="desc" ${state.orderDirection === "desc" ? "selected" : ""}>Descendente</option>
          </select>

          <select id="admin-users-order-field" class="admin-select">
            <option value="name" ${state.orderField === "name" ? "selected" : ""}>Nombre</option>
            <option value="createdAt" ${state.orderField === "createdAt" ? "selected" : ""}>Fecha creacion</option>
          </select>

          <select id="admin-users-role-filter" class="admin-select">
            ${ROLE_FILTER_OPTIONS.map((role) => `<option value="${role}" ${state.roleFilter === role ? "selected" : ""}>${role === "all" ? "Todos los roles" : getRoleLabel(role)}</option>`).join("")}
          </select>

          <div class="admin-filters__spacer"></div>
          <button class="admin-btn" id="admin-users-export-btn">Exportar Reporte</button>
        </div>

        ${renderUsersTable(state)}
        ${renderPagination(state)}
      </section>
    </div>
    ${renderRolesModal(state)}
    ${renderEditModal(state)}
  `;

  const shell = renderRoleShell({
    title: "Administracion",
    subtitle: "Gestiona usuarios y sus roles en la plataforma.",
    roles,
    primaryRole,
    content,
    actions: `<a href="#${config.ROUTES.ADMIN_DASHBOARD}" class="btn btn--outline btn--sm">Volver al dashboard</a>`,
    shellClass: "admin-users-shell",
  });

  const extraStyles = `
    .admin-users-page { min-height: calc(100vh - 70px); background: #f8fafc; padding: 26px 0; }
    .admin-users-shell .role-shell__content { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 0; overflow: hidden; }
    .admin-users-layout { display: flex; min-height: 560px; }
    
    .admin-users-sidebar { width: 260px; border-right: 1px solid #e5e7eb; padding: 24px 0; flex-shrink: 0; }
    .admin-users-sidebar__title { margin: 0; padding: 0 22px; font-size: 20px; color: #0f172a; line-height: 1.2; font-weight: 700; }
    .admin-users-sidebar__nav { margin-top: 24px; display: flex; flex-direction: column; }
    .admin-users-sidebar__link { display: block; padding: 12px 22px; text-decoration: none; color: #475569; font-size: 15px; border-left: 4px solid transparent; font-weight: 500; }
    .admin-users-sidebar__link:hover { background: #f8fafc; }
    .admin-users-sidebar__link--active { border-left-color: #fd8a21; background: #fff7ed; color: #0f172a; font-weight: 700; }
    .admin-users-sidebar__link--muted { color: #94a3b8; cursor: not-allowed; }
    
    .admin-users-main { flex: 1; padding: 26px 32px 30px; min-width: 0; }
    .admin-users-main__title { margin: 0 0 24px; color: #0f172a; font-size: 28px; font-weight: 700; }
    .admin-filters { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
    .admin-select { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 14px; font: inherit; background: #fff; color: #0f172a; font-size: 14px; outline: none; }
    .admin-select:focus { border-color: #94a3b8; }
    .admin-filters__spacer { flex: 1; }
    
    .admin-btn { border: 1px solid #0f172a; border-radius: 8px; padding: 10px 16px; background: #fff; color: #0f172a; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; outline: none; }
    .admin-btn:hover { background: #f8fafc; }
    .admin-btn--inline { padding: 6px 12px; font-size: 12px; border-color: #cbd5e1; font-weight: 500; }
    .admin-btn--inline:hover { border-color: #94a3b8; }
    .btn-danger { color: #dc2626; border-color: #fca5a5; }
    .btn-danger:hover { background: #fef2f2; border-color: #f87171; }
    
    .admin-table-wrap { overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; }
    .admin-table { width: 100%; border-collapse: collapse; min-width: 900px; text-align: left; }
    .admin-table thead { background: #0f172a; color: #fff; }
    .admin-table th { padding: 16px; font-size: 14px; font-weight: 600; letter-spacing: 0.02em; }
    .admin-table td { padding: 16px; font-size: 14px; color: #334155; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    .admin-table tbody tr:last-child td { border-bottom: none; }
    .admin-table tbody tr:hover { background: #f8fafc; }
    .col-id { font-family: monospace; font-size: 13px; color: #64748b; max-width: 120px; word-wrap: break-word; }
    .action-buttons { display: flex; gap: 6px; flex-wrap: wrap; }
    
    .admin-role-tag { display: inline-flex; border-radius: 999px; padding: 4px 12px; border: 1px solid transparent; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
    .admin-role-tag--admin { background: #fef2f2; border-color: #fecaca; color: #b91c1c; }
    .admin-role-tag--recruiter { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }
    .admin-role-tag--candidate { background: #ecfdf5; border-color: #bbf7d0; color: #15803d; }
    .admin-role-tag--moderator { background: #f5f3ff; border-color: #ddd6fe; color: #6d28d9; }
    .admin-role-tag--empty { background: #f1f5f9; border-color: #cbd5e1; color: #64748b; }
    
    .admin-pagination { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; font-size: 14px; color: #475569; }
    .modal-overlay { display: none; position: fixed; inset: 0; background: rgba(15,23,42,0.6); z-index: 1200; align-items: center; justify-content: center; backdrop-filter: blur(2px); }
    .modal-overlay.active { display: flex; }
    .modal-card { background: #fff; border-radius: 16px; width: 100%; max-width: 540px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #e2e8f0; }
    .modal-header h2 { margin: 0; font-size: 20px; color: #0f172a; font-weight: 700; }
    .modal-close { background: transparent; border: none; cursor: pointer; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; color: #64748b; border-radius: 8px; }
    .modal-close:hover { background: #f1f5f9; color: #0f172a; }
    .modal-body { padding: 24px; }
    .admin-modal-user { margin-bottom: 20px; background: #f8fafc; padding: 16px; border-radius: 10px; border: 1px solid #e2e8f0; }
    .admin-modal-user p { margin: 0 0 8px; font-size: 14px; color: #334155; }
    .admin-modal-user p:last-child { margin-bottom: 0; }
    .admin-modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .admin-modal-block { display: flex; flex-direction: column; gap: 8px; }
    .admin-modal-block label { font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; }
  `;

  return renderPage({
    navbar,
    main: `<div class="container">${shell}</div>`,
    pageClass: "admin-users-page",
    extraStyles,
  });
}

/* =========================================================
   🔥 LOGICA DE DATOS Y NORMALIZACIÓN
========================================================= */

function pickFirstArray(source) {
  if (Array.isArray(source)) return source;
  if (!source || typeof source !== "object") return null;
  const keys = ["items", "users", "results", "rows", "records"];
  for (const key of keys) if (Array.isArray(source[key])) return source[key];
  if (Array.isArray(source.data)) return source.data;
  if (source.data && typeof source.data === "object")
    return pickFirstArray(source.data);
  if (source.payload && typeof source.payload === "object")
    return pickFirstArray(source.payload);
  return null;
}

function normalizeRoleName(roleName) {
  return String(roleName || "")
    .trim()
    .toLowerCase();
}

function getRoleLabel(role) {
  return ROLE_LABELS[normalizeRoleName(role)] || role || "SIN ROLES";
}

function normalizeRoleList(input) {
  if (!input) return [];
  const roles = [];
  if (Array.isArray(input)) {
    input.forEach((entry) => {
      if (typeof entry === "string") {
        const role = normalizeRoleName(entry);
        if (role) roles.push(role);
      } else if (entry && typeof entry === "object") {
        const role = normalizeRoleName(
          entry.roleName || entry.name || entry.value || entry.code,
        );
        if (role) roles.push(role);
      }
    });
  } else if (typeof input === "string") {
    input
      .split(",")
      .map(normalizeRoleName)
      .filter(Boolean)
      .forEach((entry) => roles.push(entry));
  }
  return [...new Set(roles)];
}

function normalizeUser(item = {}, index = 0) {
  const rawId = item.id || item.userId || item.uuid || item._id || "";
  const id = String(rawId || index + 1);

  const cleanStr = (str) => {
    if (!str || String(str).toLowerCase() === "undefined") return "";
    return String(str).trim();
  };

  const firstName = cleanStr(
    item.firstName || item.first_name || item.nameFirst,
  );
  const lastName = cleanStr(item.lastName || item.last_name || item.nameLast);

  const fullNameFromParts = [firstName, lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  let fullName =
    fullNameFromParts ||
    cleanStr(item.fullName || item.name || item.username) ||
    "Usuario sin nombre";

  const email = cleanStr(item.email || item.mail || item.userEmail) || "-";
  const roles = normalizeRoleList(item.roles || item.userRoles || item.role);

  const createdDate = new Date(item.createdAt || item.created_at || "");
  const createdAtTs = Number.isNaN(createdDate.getTime())
    ? 0
    : createdDate.getTime();

  return { id, name: fullName, email, roles, createdAtTs, raw: item };
}

function sortUsers(users, field, direction) {
  const factor = direction === "desc" ? -1 : 1;
  return [...users].sort((a, b) => {
    if (field === "createdAt") return (a.createdAtTs - b.createdAtTs) * factor;
    return a.name.localeCompare(b.name, "es", { sensitivity: "base" }) * factor;
  });
}

function applyRoleFilter(users, roleFilter) {
  if (!roleFilter || roleFilter === "all") return [...users];
  return users.filter((user) =>
    user.roles.some(
      (role) => normalizeRoleName(role) === normalizeRoleName(roleFilter),
    ),
  );
}

function recomputeVisibleUsers(state) {
  const filtered = applyRoleFilter(state.users, state.roleFilter);
  const sorted = sortUsers(filtered, state.orderField, state.orderDirection);

  if (state.pagination.hasServerPagination) {
    state.visibleUsers = sorted;
    return;
  }

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / Math.max(state.limit, 1)));
  if (state.page > totalPages) state.page = totalPages;

  const start = (state.page - 1) * state.limit;
  state.visibleUsers = sorted.slice(start, start + state.limit);
  state.total = total;
  state.totalPages = totalPages;
}
async function loadUsers(state) {
  state.loadingUsers = true;
  state.errorMessage = "";

  try {
    // 1. Preparamos los parámetros base (incluyendo el search que esté en el state)
    const params = {
      page: state.page,
      limit: state.limit,
      search: state.searchQuery || "", // 🔥 ESTO es lo que le faltaba a tu código
    };

    // 2. Ejecutamos la llamada según si hay filtro de rol o no
    const result =
      state.roleFilter !== "all"
        ? await adminService.getUsersByRole(state.roleFilter, params)
        : await adminService.getUsers(params);

    // 3. Procesamos la respuesta (tu lógica actual que está perfecta)
    const rawData = pickFirstArray(result) || [];
    state.users = rawData.map((u, i) => normalizeUser(u, i));

    // Mantenemos tu lógica de paginación local si así lo prefieres
    state.pagination = { hasServerPagination: false };
    recomputeVisibleUsers(state);
  } catch (error) {
    state.users = [];
    state.errorMessage = resolveRequestErrorMessage(
      error,
      "Intenta nuevamente.",
    );
  } finally {
    state.loadingUsers = false;
  }
}

/* =========================================================
   GESTIÓN DE ESTADO Y EVENTOS
========================================================= */

function renderAndBind(state, authContext) {
  const app = document.getElementById("app");
  app.innerHTML = renderAdminUsersHTML(authContext, state);
  bindAllEvents(state, authContext);
}

function bindAllEvents(state, authContext) {
  const app = document.getElementById("app");

  // Filtros
  document
    .getElementById("admin-users-order-direction")
    ?.addEventListener("change", (e) => {
      state.orderDirection = e.target.value;
      recomputeVisibleUsers(state);
      renderAndBind(state, authContext);
    });

  document
    .getElementById("admin-users-order-field")
    ?.addEventListener("change", (e) => {
      state.orderField = e.target.value;
      recomputeVisibleUsers(state);
      renderAndBind(state, authContext);
    });

  document
    .getElementById("admin-users-role-filter")
    ?.addEventListener("change", async (e) => {
      state.roleFilter = e.target.value;
      state.page = 1;
      await loadUsers(state);
      renderAndBind(state, authContext);
    });

  // Paginación
  document
    .getElementById("admin-users-prev-page")
    ?.addEventListener("click", () => {
      if (state.page > 1) {
        state.page--;
        recomputeVisibleUsers(state);
        renderAndBind(state, authContext);
      }
    });

  document
    .getElementById("admin-users-next-page")
    ?.addEventListener("click", () => {
      if (state.page < state.totalPages) {
        state.page++;
        recomputeVisibleUsers(state);
        renderAndBind(state, authContext);
      }
    });

  // Acciones de Tabla (Eliminar)
  app.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.onclick = async () => {
      const userId = btn.dataset.delete;

      // ✅ 6. Evitar borrar a sí mismo
      if (authContext.user && String(userId) === String(authContext.user.id)) {
        alert("No puedes eliminar tu propio usuario.");
        return;
      }

      // ✅ 3. Fix Delete User UX
      if (
        !confirm(
          "⚠️ Esta acción eliminará el usuario permanentemente. ¿Continuar?",
        )
      )
        return;

      try {
        await adminService.deleteUser(userId);
        showToast("Usuario eliminado correctamente");

        // ✅ 5. Refresh después de cambios
        await loadUsers(state);
        renderAndBind(state, authContext);
      } catch (error) {
        // ✅ 4. Manejo de Errores
        const msg = resolveRequestErrorMessage(
          error,
          "Error inesperado al eliminar el usuario",
        );
        setGlobalFeedback(state, msg, "error");
        renderAndBind(state, authContext);
      }
    };
  });

  // Acciones de Tabla (Editar)
  app.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.onclick = () => {
      state.editModal.user = state.visibleUsers.find(
        (u) => u.id === btn.dataset.edit,
      );
      state.editModal.open = true;
      state.editModal.feedback = {}; // Limpiar errores pasados
      renderAndBind(state, authContext);
    };
  });

  document.getElementById("edit-close")?.addEventListener("click", () => {
    state.editModal.open = false;
    renderAndBind(state, authContext);
  });
  document.getElementById("edit-cancel")?.addEventListener("click", () => {
    state.editModal.open = false;
    renderAndBind(state, authContext);
  });

  document.getElementById("edit-save")?.addEventListener("click", async () => {
    const firstName = document.getElementById("edit-firstName").value;
    const lastName = document.getElementById("edit-lastName").value;

    try {
      // ✅ 2. Fix Update User: Enviando SOLO {firstName, lastName} y NO los roles
      await adminService.updateUser(state.editModal.user.id, {
        firstName,
        lastName,
      });
      showToast("Usuario actualizado correctamente");
      state.editModal.open = false;

      // ✅ 5. Refresh después de cambios
      await loadUsers(state);
      renderAndBind(state, authContext);
    } catch (error) {
      // ✅ 4. Manejo de Errores
      const msg = resolveRequestErrorMessage(
        error,
        "Error inesperado al actualizar el usuario",
      );
      state.editModal.feedback = { message: msg, type: "error" };
      renderAndBind(state, authContext);
    }
  });

  // Modal Roles (Abrir)
  app.querySelectorAll("[data-manage-roles]").forEach((btn) => {
    btn.onclick = () => {
      const u = state.visibleUsers.find(
        (user) => user.id === btn.dataset.manageRoles,
      );
      state.modal = {
        open: true,
        user: u,
        roles: u.roles || [],
        loading: false,
        feedback: {},
      };
      renderAndBind(state, authContext);
    };
  });

  document
    .getElementById("admin-roles-close")
    ?.addEventListener("click", () => {
      state.modal.open = false;
      renderAndBind(state, authContext);
    });

  // Modal Roles (Asignar)
  document
    .getElementById("admin-role-assign-btn")
    ?.addEventListener("click", async () => {
      const roleName = document.getElementById("admin-role-add-select").value;
      if (!roleName) return;

      try {
        // ✅ 1. Fix para Roles: .toUpperCase()
        await adminService.assignRole(
          state.modal.user.id,
          roleName.toUpperCase(),
        );
        showToast("Rol asignado correctamente");
        state.modal.open = false;

        // ✅ 5. Refresh después de cambios
        await loadUsers(state);
        renderAndBind(state, authContext);
      } catch (error) {
        // ✅ 4. Manejo de Errores
        const msg = resolveRequestErrorMessage(
          error,
          "Error inesperado al asignar el rol",
        );
        state.modal.feedback = { message: msg, type: "error" };
        renderAndBind(state, authContext);
      }
    });

  // Modal Roles (Remover)
  document
    .getElementById("admin-role-remove-btn")
    ?.addEventListener("click", async () => {
      const roleName = document.getElementById(
        "admin-role-remove-select",
      ).value;
      if (!roleName) return;

      try {
        // ✅ 1. Fix para Roles: .toUpperCase()
        await adminService.removeRole(
          state.modal.user.id,
          roleName.toUpperCase(),
        );
        showToast("Rol removido correctamente");
        state.modal.open = false;

        // ✅ 5. Refresh después de cambios
        await loadUsers(state);
        renderAndBind(state, authContext);
      } catch (error) {
        // ✅ 4. Manejo de Errores
        const msg = resolveRequestErrorMessage(
          error,
          "Error inesperado al remover el rol",
        );
        state.modal.feedback = { message: msg, type: "error" };
        renderAndBind(state, authContext);
      }
    });
}

export async function initAdminUsersPage() {
  const authContext = getAuthUiContext();
  showLoading();

  const state = {
    users: [],
    visibleUsers: [],
    page: 1,
    limit: DEFAULT_LIMIT,
    total: 0,
    totalPages: 1,
    orderField: "createdAt",
    orderDirection: "desc",
    roleFilter: "all",
    pagination: { hasServerPagination: false },
    loadingUsers: true,
    errorMessage: "",
    feedback: { message: "", type: "info" },
    catalogRoles: ROLE_FILTER_OPTIONS.filter((r) => r !== "all"),
    modal: { open: false, user: null, roles: [], feedback: {} },
    editModal: { open: false, user: null, feedback: {} },
  };

  await loadUsers(state);
  renderAndBind(state, authContext);
}
