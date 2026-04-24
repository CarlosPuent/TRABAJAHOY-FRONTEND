import { config } from "@core/config";
import { store } from "@core/store";
import { authService } from "@services/auth.service";
import { companyService } from "@services/company.service";
import {
  getAuthUiContext,
  renderNavbar,
  renderPage,
  renderRoleShell,
  resolveRequestErrorMessage,
  showLoading,
} from "@utils/ui";

/* =========================
   Helpers
========================= */

function normalizeArray(input) {
  if (Array.isArray(input)) return input;
  if (Array.isArray(input?.data)) return input.data;
  return [];
}

function getFullName(user = {}) {
  return (
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "Sin nombre"
  );
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "-" : d.toLocaleDateString();
}

function getRoleBadge(role) {
  return `<span class="role-badge role-${role}">${role}</span>`;
}

function showToast(message) {
  const el = document.createElement("div");
  el.className = "toast";
  el.innerText = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

/* =========================
   Resolver empresa
========================= */

async function resolveCompanyContext() {
  const user = store.get("user");

  try {
    const profile = await authService.fetchCurrentUserProfile();
    return profile?.user || user;
  } catch {
    return user;
  }
}

/* =========================
   Render
========================= */

function renderStats(state) {
  const total = state.members.length;
  const recruiters = state.members.filter((m) => m.role === "recruiter").length;
  const admins = state.members.filter((m) => m.role === "company_admin").length;

  return `
    
  `;
}

function renderTable(state) {
  if (!state.members.length)
    return `<p class="text-muted">No hay miembros en el equipo aún.</p>`;

  // Obtenemos el usuario logueado actualmente desde el store
  const currentUser = store.get("user");

  return `
    <div class="table-controls">
      <input id="search-member" placeholder="Buscar por nombre o email..." class="search"/>
    </div>

    <table class="admin-table">
      <thead>
        <tr>
          <th>Usuario</th>
          <th>Email</th>
          <th>Rol</th>
          <th>Ingreso</th>
          <th style="text-align: right;">Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${state.members
          .map((m) => {
            const isOwnerRow = m.role === "owner";
            const isMe = m.user?.id === currentUser?.id;

            return `
              <tr class="${isMe ? "row-highlight-me" : ""}">
                <td>
                  <div class="user-cell">
                    <div class="avatar" style="${isMe ? "background: #3b82f6;" : ""}">
                      ${getFullName(m.user).charAt(0)}
                    </div>
                    <div>
                      <strong>${getFullName(m.user)}</strong>
                      ${isMe ? '<br><span style="font-size:10px; color:#3b82f6; font-weight:700;">ACTUALMENTE LOGUEADO</span>' : ""}
                    </div>
                  </div>
                </td>
                <td>${m.user?.email || "-"}</td>
                <td>${getRoleBadge(m.role)}</td>
                <td>${formatDate(m.joinedAt)}</td>
                <td style="text-align: right;">
                  <div class="action-buttons-wrapper" style="display: flex; justify-content: flex-end; gap: 8px;">
                    ${
                      (state.isOwner || state.isAdmin) && !isOwnerRow && !isMe
                        ? `
                        <button class="admin-btn admin-btn--inline" data-edit="${m.id}">Editar</button>
                        <button class="admin-btn admin-btn--inline btn-danger" data-delete="${m.id}">Eliminar</button>
                      `
                        : isMe
                          ? `<span class="badge-me">Ese eres tú</span>`
                          : isOwnerRow
                            ? `<span class="text-muted" title="El propietario no puede ser modificado" style="font-size: 12px; cursor: help;">🔒 Protegido</span>`
                            : `<span class="text-muted">—</span>`
                    }
                  </div>
                </td>
              </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>
  `;
}

function renderHTML(authContext, state) {
  const navbar = renderNavbar({
    activeRoute: config.ROUTES.COMPANY_RECRUITERS,
    ...authContext,
  });

  const modal = `
    <div id="modal" class="modal hidden">
      <div class="modal-content">
        <h3 id="modal-title">Agregar miembro</h3>

        <input id="modal-email" placeholder="Email"/>
        
        <select id="modal-role">
          <option value="recruiter">Recruiter</option>
          <option value="company_admin">Admin</option>
        </select>

        <div class="modal-actions">
          <button id="modal-save">Guardar</button>
          <button id="modal-close">Cancelar</button>
        </div>

        <p id="modal-error" class="error"></p>
      </div>
    </div>
  `;

  const content = `
    <div class="card">
      <div class="header">
        <div>
          <h2>Equipo de reclutamiento</h2>
        </div>

        ${
          state.isOwner || state.isAdmin
            ? `<button id="add-btn">+ Agregar</button>`
            : ""
        }
      </div>

      ${renderStats(state)}
      ${renderTable(state)}
    </div>

    ${modal}
  `;

  const shell = renderRoleShell({
    title: "Reclutadores",
    subtitle: "Gestiona los miembros de tu empresa",
    roles: authContext.roles,
    primaryRole: authContext.primaryRole,
    content,
  });

  return renderPage({
    navbar,
    main: `<div class="container">${shell}</div>`,
    extraStyles: `
/* =========================
   Layout
========================= */

.card {
  background:#fff;
  padding:24px;
  border-radius:14px;
  border:1px solid #e5e7eb;
  box-shadow:0 6px 18px rgba(0,0,0,0.04);
}

.badge-me {
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
  text-transform: uppercase;
  border: 1px solid #bfdbfe;
}

.row-highlight-me {
  background-color: #f8fafc;
}

.text-muted {
  color: #94a3b8;
  font-style: italic;
}

.admin-btn--inline {
  padding: 4px 10px;
  font-size: 12px;
}
  
.header {
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:16px;
}

/* =========================
   Buttons
========================= */

button {
  cursor:pointer;
  font-weight:500;
}

#add-btn {
  background:#fd8a21;
  color:white;
  border:none;
  padding:10px 16px;
  border-radius:10px;
  transition:all .2s;
}

#add-btn:hover {
  background:#ea7a15;
}

button[data-edit] {
  background:#f1f5f9;
  border:none;
  padding:6px 10px;
  border-radius:8px;
}

button[data-edit]:hover {
  background:#e2e8f0;
}

button[data-delete] {
  background:#fee2e2;
  color:#b91c1c;
  border:none;
  padding:6px 10px;
  border-radius:8px;
}

button[data-delete]:hover {
  background:#fecaca;
}

/* =========================
   Search
========================= */

.search {
  width:100%;
  padding:10px 14px;
  border-radius:10px;
  border:1px solid #e2e8f0;
  margin:12px 0;
  font-size:14px;
  transition:all .2s;
}

.search:focus {
  outline:none;
  border-color:#fd8a21;
  box-shadow:0 0 0 3px rgba(253,138,33,0.15);
}

/* =========================
   Table
========================= */

.admin-table {
  width:100%;
  border-collapse:collapse;
  margin-top:10px;
}

.admin-table th {
  text-align:left;
  font-size:13px;
  color:#64748b;
  padding:10px;
  border-bottom:1px solid #e2e8f0;
}

.admin-table td {
  padding:14px 10px;
  border-bottom:1px solid #f1f5f9;
}

.admin-table tr:hover {
  background:#fafafa;
}

/* =========================
   User cell
========================= */

.user-cell {
  display:flex;
  align-items:center;
  gap:10px;
}

.avatar {
  width:36px;
  height:36px;
  background:#fd8a21;
  color:white;
  border-radius:50%;
  display:flex;
  align-items:center;
  justify-content:center;
  font-weight:bold;
}

/* =========================
   Role badges
========================= */

.role-badge {
  padding:5px 10px;
  border-radius:999px;
  font-size:12px;
  font-weight:600;
}

.role-recruiter {
  background:#e0f2fe;
  color:#0369a1;
}

.role-company_admin {
  background:#ede9fe;
  color:#5b21b6;
}

.role-owner {
  background:#fef3c7;
  color:#92400e;
}

/* =========================
   Modal
========================= */

.modal {
  position:fixed;
  inset:0;
  background:rgba(0,0,0,0.45);
  display:flex;
  justify-content:center;
  align-items:center;
  z-index:1000;
  animation:fadeIn .2s ease;
}

.hidden {
  display:none;
}

.modal-content {
  background:#fff;
  padding:24px;
  border-radius:14px;
  width:320px;
  box-shadow:0 20px 40px rgba(0,0,0,0.15);
  animation:scaleIn .2s ease;
}

.modal-content h3 {
  margin-bottom:12px;
}

.modal-content input,
.modal-content select {
  width:100%;
  padding:10px;
  border-radius:8px;
  border:1px solid #e2e8f0;
  margin-bottom:10px;
}

.modal-actions {
  display:flex;
  justify-content:flex-end;
  gap:10px;
}

#modal-save {
  background:#fd8a21;
  color:white;
  border:none;
  padding:8px 14px;
  border-radius:8px;
}

#modal-close {
  background:#f1f5f9;
  border:none;
  padding:8px 14px;
  border-radius:8px;
}

/* =========================
   Toast
========================= */

.toast {
  position:fixed;
  bottom:20px;
  right:20px;
  background:#16a34a;
  color:white;
  padding:10px 16px;
  border-radius:10px;
  font-size:14px;
  box-shadow:0 10px 20px rgba(0,0,0,0.1);
  animation:slideUp .3s ease;
}

/* =========================
   Animations
========================= */

@keyframes fadeIn {
  from { opacity:0 }
  to { opacity:1 }
}

@keyframes scaleIn {
  from { transform:scale(.95); opacity:0 }
  to { transform:scale(1); opacity:1 }
}

@keyframes slideUp {
  from { transform:translateY(20px); opacity:0 }
  to { transform:translateY(0); opacity:1 }
}
`,
  });
}

/* =========================
   Main
========================= */

export async function initRecruiterManagementPage() {
  const app = document.getElementById("app");
  const authContext = getAuthUiContext();

  showLoading();

  const state = {
    members: [],
    company: null,
    isOwner: false,
    isAdmin: false,
  };

  try {
    const user = await resolveCompanyContext();
    const companyId = user?.companyId || user?.company?.id;

    const members = normalizeArray(await companyService.getMembers(companyId));

    state.company = { id: companyId };
    state.members = members;

    const me = members.find((m) => m.user?.id === user.id);

    state.isOwner = me?.role === "owner";
    state.isAdmin = me?.role === "company_admin";
  } catch (e) {
    app.innerHTML = resolveRequestErrorMessage(e);
    return;
  }

  app.innerHTML = renderHTML(authContext, state);
  bindEvents(state);
}

/* =========================
   Events
========================= */

function bindEvents(state) {
  const app = document.getElementById("app");

  // SEARCH
  app.querySelector("#search-member")?.addEventListener("input", (e) => {
    const val = e.target.value.toLowerCase();

    const rows = app.querySelectorAll("tbody tr");

    rows.forEach((row) => {
      row.style.display = row.innerText.toLowerCase().includes(val)
        ? ""
        : "none";
    });
  });

  // DELETE
  app.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm("Eliminar miembro?")) return;

      await companyService.removeMember(state.company.id, btn.dataset.delete);

      showToast("Eliminado");
      location.reload();
    };
  });

  // EDIT
  app.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.onclick = () => openModal(state, "edit", btn.dataset.edit);
  });

  // ADD
  document
    .getElementById("add-btn")
    ?.addEventListener("click", () => openModal(state, "add"));

  // MODAL CLOSE
  document.getElementById("modal-close")?.addEventListener("click", () => {
    document.getElementById("modal").classList.add("hidden");
  });

  // SAVE
  document.getElementById("modal-save")?.addEventListener("click", async () => {
    const email = document.getElementById("modal-email").value;
    const role = document.getElementById("modal-role").value;
    const errorEl = document.getElementById("modal-error");

    try {
      if (state.mode === "add") {
        await companyService.addMemberByEmail(state.company.id, {
          email,
          role,
        });
        showToast("Miembro agregado");
      } else {
        await companyService.updateMember(state.company.id, state.editId, {
          role,
        });
        showToast("Actualizado");
      }

      location.reload();
    } catch (e) {
      errorEl.textContent = resolveRequestErrorMessage(e);
    }
  });
}

/* =========================
   Modal Logic
========================= */

function openModal(state, mode, id = null) {
  state.mode = mode;
  state.editId = id;

  const modal = document.getElementById("modal");
  modal.classList.remove("hidden");

  const emailInput = document.getElementById("modal-email");

  if (mode === "edit") {
    emailInput.style.display = "none";
  } else {
    emailInput.style.display = "block";
    emailInput.value = "";
  }
}
