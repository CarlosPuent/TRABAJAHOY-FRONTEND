import { api } from "@services/api";
import { store } from "@core/store";
import { renderNavbar, renderPage, renderRoleShell } from "@utils/ui";

export async function initAdminDashboardPage() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <div class="app-loading" style="min-height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <div class="app-loading__spinner" style="width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <p style="margin-top: 16px; color: #64748b; font-weight: 500;">Cargando panel de control...</p>
    </div>
    <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
  `;

  try {
    const response = await api.get("/admin/dashboard");
    const raw = response.data?.data || response.data || {};

    // 🔥 NORMALIZACIÓN ARREGLADA (Compatible con el nuevo backend)
    const data = normalizeDashboard(raw);

    const user = store.get("user");
    const roles = store.getRoles();
    const primaryRole = store.getPrimaryRole();

    const navbar = renderNavbar({
      activeRoute: "/admin/dashboard",
      isAuthenticated: true,
      user,
      roles,
      primaryRole,
    });

    /* =========================
       KPIs (Tarjetas superiores)
    ========================= */
    const statsHtml = `
      <div class="admin-stats-grid">
        ${statCard("Usuarios Totales", data.kpis.users, "Métricas de plataforma")}
        ${statCard("Empresas Registradas", data.kpis.companies, "Total en el sistema")}
        ${statCard("Pendientes de Revisión", data.kpis.pendingCompanies, "Requieren tu atención", data.kpis.pendingCompanies > 0 ? "warning" : "normal")}
        ${statCard("Vacantes Publicadas", data.kpis.vacancies, "Activas en el portal")}
      </div>
    `;

    /* =========================
       ACCIONES RÁPIDAS
    ========================= */
    const actionsHtml = `
      <div class="admin-actions-bar">
        <h3 class="section-title">Acciones rápidas</h3>
        <div class="actions-row">
          <a href="#/admin/users" class="action-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            Gestionar usuarios
          </a>
          <a href="#/admin/companies" class="action-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>
            Ver empresas
          </a>
          <a href="#/admin/companies?filter=pending" class="action-btn action-btn--primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="M12 8v4l3 3"></path></svg>
            Revisar pendientes (${data.kpis.pendingCompanies})
          </a>
        </div>
      </div>
    `;

    /* =========================
       EMPRESAS PENDIENTES
    ========================= */
    const pendingHtml = `
      <div class="list-section">
        <div class="list-section__header">
          <h3 class="section-title">Empresas pendientes de verificación</h3>
          <a href="#/admin/companies?filter=pending" class="view-all-link">Ver todas</a>
        </div>
        <div class="list-card">
          ${
            data.pendingCompanies.length > 0
              ? data.pendingCompanies
                  .map(
                    (c) => `
                <div class="list-item">
                  <div class="list-item__icon list-item__icon--warning">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                  </div>
                  <div class="list-item__content">
                    <div class="list-item__title">${escapeHtml(c.name || "Empresa sin nombre")}</div>
                    <div class="list-item__subtitle">Enviado: ${formatDate(c.submittedAt)}</div>
                  </div>
                  <a href="#/admin/companies?filter=pending" class="list-btn">Revisar</a>
                </div>
              `,
                  )
                  .join("")
              : `
                <div class="empty-state">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  <p>No hay empresas pendientes. ¡Todo al día!</p>
                </div>
              `
          }
        </div>
      </div>
    `;

    /* =========================
       USUARIOS RECIENTES
    ========================= */
    const activityHtml = `
      <div class="list-section">
        <div class="list-section__header">
          <h3 class="section-title">Nuevos usuarios registrados</h3>
          <a href="#/admin/users" class="view-all-link">Ver todos</a>
        </div>
        <div class="list-card">
          ${
            data.recentUsers.length > 0
              ? data.recentUsers
                  .map(
                    (u) => `
                <div class="list-item">
                  <div class="list-item__avatar">
                    ${(u.name || u.email || "U")[0].toUpperCase()}
                  </div>
                  <div class="list-item__content">
                    <div class="list-item__title">${escapeHtml(u.name || "Usuario nuevo")}</div>
                    <div class="list-item__subtitle">${escapeHtml(u.email)}</div>
                  </div>
                  <div class="list-item__meta">${formatDate(u.createdAt)}</div>
                </div>
              `,
                  )
                  .join("")
              : `
                <div class="empty-state">
                  <p>No hay actividad reciente de usuarios.</p>
                </div>
              `
          }
        </div>
      </div>
    `;

    const shell = renderRoleShell({
      title: "Admin Dashboard",
      subtitle: "Centro de control general del sistema",
      roles,
      primaryRole,
      content: `
        ${statsHtml}
        ${actionsHtml}
        <div class="dashboard-columns">
          ${pendingHtml}
          ${activityHtml}
        </div>
      `,
    });

    app.innerHTML = renderPage({
      navbar,
      main: `<div class="container admin-container-centered">${shell}</div>`,
      pageClass: "admin-dashboard-page",
      extraStyles: styles,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    app.innerHTML = `
      <div class="container admin-container-centered">
        <div style="background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 20px; border-radius: 12px; margin-top: 40px;">
          <h2 style="margin:0 0 10px;">Oops, algo salió mal</h2>
          <p>No pudimos cargar la información del panel de control. Por favor intenta recargar la página.</p>
        </div>
      </div>
    `;
  }
}

/* =========================
   🔥 NORMALIZADOR CLAVE
========================= */

function normalizeDashboard(raw) {
  // Aseguramos que si no viene nada, al menos tengamos un objeto vacío para evitar crashes
  const kpis = raw.kpis || {};

  // Extraemos la longitud si nos mandan un Array, de lo contrario usamos el número o 0
  const parseCount = (val) =>
    Array.isArray(val) ? val.length : Number(val) || 0;

  return {
    kpis: {
      users: kpis.users ?? parseCount(raw.totalUsers) ?? 0,
      companies: kpis.companies ?? parseCount(raw.totalCompanies) ?? 0,
      vacancies: kpis.vacancies ?? parseCount(raw.totalVacancies) ?? 0,
      pendingCompanies:
        kpis.pendingCompanies ?? parseCount(raw.pendingCompanies) ?? 0,
    },
    // Protegemos las listas para que siempre sean un Array y no rompan el map()
    pendingCompanies: Array.isArray(raw.pendingCompanies)
      ? raw.pendingCompanies
      : [],
    recentUsers: Array.isArray(raw.recentUsers) ? raw.recentUsers : [],
  };
}

/* =========================
   HELPERS
========================= */

function formatDate(dateValue) {
  if (!dateValue) return "Fecha desconocida";
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return "Fecha desconocida";

  return d.toLocaleDateString("es-SV", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* =========================
   COMPONENTS
========================= */

function statCard(label, value, subtitle, status = "normal") {
  const valueColor = status === "warning" ? "#dc2626" : "#0f172a";

  return `
    <div class="stat-card">
      <div class="stat-card__label">${label}</div>
      <div class="stat-card__value" style="color: ${valueColor};">${value}</div>
      <div class="stat-card__subtitle">${subtitle}</div>
    </div>
  `;
}

/* =========================
   STYLES
========================= */

const styles = `
/* Layout Base */
.admin-container-centered {
  max-width: 1100px;
  margin: 0 auto;
  padding: 30px 15px;
}

.role-shell__content {
  background: transparent;
  padding: 0;
  border: none;
  box-shadow: none;
}

/* KPIs Grid */
.admin-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
}

.stat-card__label {
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.stat-card__value {
  font-size: 36px;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-card__subtitle {
  font-size: 13px;
  color: #94a3b8;
}

/* Actions Bar */
.admin-actions-bar {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px 24px;
  margin-bottom: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.actions-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #334155;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
}

.action-btn svg {
  width: 16px;
  height: 16px;
}

.action-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.action-btn--primary {
  background: #2563eb;
  color: white;
}

.action-btn--primary:hover {
  background: #1d4ed8;
  color: white;
  box-shadow: 0 4px 6px rgba(37,99,235,0.2);
}

/* Two Columns Layout */
.dashboard-columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
}

/* List Sections */
.list-section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.view-all-link {
  font-size: 14px;
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
}

.view-all-link:hover {
  text-decoration: underline;
}

.list-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
}

.list-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.2s;
}

.list-item:last-child {
  border-bottom: none;
}

.list-item:hover {
  background: #f8fafc;
}

.list-item__icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
}

.list-item__icon--warning {
  background: #fffbeb;
  color: #d97706;
}

.list-item__icon svg {
  width: 20px;
  height: 20px;
}

.list-item__avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e0e7ff;
  color: #4f46e5;
  font-weight: 700;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
}

.list-item__content {
  flex: 1;
  min-width: 0;
}

.list-item__title {
  font-weight: 600;
  color: #0f172a;
  font-size: 15px;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list-item__subtitle {
  font-size: 13px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list-item__meta {
  font-size: 13px;
  color: #94a3b8;
  margin-left: 16px;
}

.list-btn {
  padding: 6px 14px;
  border-radius: 6px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #334155;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
  margin-left: 16px;
}

.list-btn:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #94a3b8;
}

.empty-state svg {
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
  color: #cbd5e1;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
}

/* Responsividad extra */
@media (max-width: 768px) {
  .dashboard-columns {
    grid-template-columns: 1fr;
  }
  
  .admin-actions-bar {
    flex-direction: column;
    align-items: flex-start;
  }
}
`;
