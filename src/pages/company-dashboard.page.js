import { config } from "@core/config";
import { store } from "@core/store";
import { companyService } from "@services/company.service";
import { authService } from "@services/auth.service";
import {
  getAuthUiContext,
  renderNavbar,
  renderPage,
  renderRoleShell,
  showLoading,
} from "@utils/ui";

/* =========================
   UTILIDADES DE FORMATO
========================= */

const formatters = {
  date: (val) =>
    val
      ? new Date(val).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "-",
  name: (u) =>
    [u?.firstName, u?.lastName].filter(Boolean).join(" ") ||
    u?.email ||
    "Candidato",
  badge: (status) => {
    const s = status ? status.toLowerCase() : "pending";
    return `<span class="status-pill pill-${s}">${s.toUpperCase()}</span>`;
  },
};

/* =========================
   COMPONENTES PREMIUM
========================= */

function renderMetricCard(label, value) {
  return `
    <div class="metric-card-premium">
      <div class="metric-content">
        <span class="metric-label">${label}</span>
        <h2 class="metric-value">${value ?? 0}</h2>
      </div>
      <div class="metric-decoration"></div>
    </div>
  `;
}

/* =========================
   LÓGICA PRINCIPAL
========================= */

export async function initCompanyDashboardPage() {
  const app = document.getElementById("app");
  const authContext = getAuthUiContext();

  showLoading("Sincronizando registros operativos...");

  try {
    const profile = await authService.fetchCurrentUserProfile();
    const user = profile?.user || store.get("user");

    // Resolución de ID de empresa desde múltiples fuentes posibles
    const companyId = user?.companyId || user?.company?.id || user?.company_id;

    // 🔥 FIX: Validación de existencia de empresa
    if (!companyId || companyId === "undefined" || companyId === "null") {
      renderSetupRequired(app, authContext);
      return;
    }

    const [stats, distribution, applications] = await Promise.all([
      companyService.getDashboard(companyId),
      companyService.getApplicationsByStatus(companyId),
      companyService.getRecentApplications(companyId),
    ]);

    const navbar = renderNavbar({
      activeRoute: config.ROUTES.COMPANY_DASHBOARD,
      ...authContext,
    });

    const content = `
      <div class="dashboard-premium">
        <div class="metrics-grid-premium">
          ${renderMetricCard("Vacantes Activas", stats.vacancies)}
          ${renderMetricCard("Postulaciones Totales", stats.applications)}
          ${renderMetricCard("Candidatos en Proceso", stats.candidatesInProcess)}
          ${renderMetricCard("Contrataciones", stats.hires)}
        </div>

        <div class="main-data-layout">
          <section class="premium-card chart-section">
            <div class="card-header-premium">
              <h3>Distribución de Talento</h3>
              <p>Estado actual de los procesos</p>
            </div>
            <div class="chart-wrapper-premium">
              <canvas id="applicationsChart"></canvas>
            </div>
          </section>

          <section class="premium-card table-section">
            <div class="card-header-premium">
              <h3>Actividad Reciente</h3>
              <p>Últimas interacciones de candidatos</p>
            </div>
            <div class="table-responsive">
              <table class="premium-table">
                <thead>
                  <tr>
                    <th>Candidato</th>
                    <th>Posición Solicitada</th>
                    <th>Estado de Gestión</th>
                    <th>Fecha de Registro</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    applications && applications.length > 0
                      ? applications
                          .map(
                            (a) => `
                      <tr>
                        <td>
                           <div class="user-cell">
                             <div class="user-avatar-mini">${formatters.name(a.user)[0]}</div>
                             <span class="user-name">${formatters.name(a.user)}</span>
                           </div>
                        </td>
                        <td class="td-vacancy">${a.vacancy?.title || "N/A"}</td>
                        <td>${formatters.badge(a.status)}</td>
                        <td class="td-date">${formatters.date(a.appliedAt)}</td>
                      </tr>`,
                          )
                          .join("")
                      : `<tr><td colspan="4" class="empty-row">No hay actividad reciente procesada.</td></tr>`
                  }
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    `;

    const shell = renderRoleShell({
      title: "Dashboard Operativo",
      subtitle: user?.company?.name || "Gestión Corporativa",
      roles: authContext.roles,
      primaryRole: authContext.primaryRole,
      content,
    });

    app.innerHTML = renderPage({
      navbar,
      main: `<div class="container">${shell}</div>`,
      extraStyles: getEnterpriseStyles(),
    });

    initializeAnalytics(distribution);
  } catch (error) {
    console.error("Dashboard Sync Error:", error);
    app.innerHTML = `
      <div class="container" style="padding-top: 50px;">
        <div class="premium-card" style="text-align:center; padding: 60px;">
           <h2 style="color: #0f172a; margin-bottom: 16px;">Error de Sincronización</h2>
           <p style="color: #64748b;">No pudimos recuperar las métricas en este momento. Por favor, intente de nuevo más tarde.</p>
           <button onclick="location.reload()" class="btn-enterprise-primary" style="margin-top: 24px; cursor: pointer;">Reintentar</button>
        </div>
      </div>
    `;
  }
}

/* =========================
   VISTA DE CONFIGURACIÓN REQUERIDA
========================= */

function renderSetupRequired(container, authContext) {
  const navbar = renderNavbar({
    activeRoute: config.ROUTES.COMPANY_DASHBOARD,
    ...authContext,
  });

  const content = `
    <div class="setup-required-premium">
      <div class="premium-card setup-card">
        <div class="setup-icon">
          <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
        </div>
        <h2>Identidad Corporativa No Detectada</h2>
        <p>Para visualizar métricas de rendimiento y gestionar candidatos, es imperativo completar el registro legal de su organización.</p>
        <div class="setup-actions">
          <a href="#/company/profile" class="btn-enterprise-primary">Configurar Perfil de Empresa</a>
        </div>
      </div>
    </div>
  `;

  const shell = renderRoleShell({
    title: "Acceso Restringido",
    subtitle: "Configuración de Cuenta",
    roles: authContext.roles,
    primaryRole: authContext.primaryRole,
    content,
  });

  container.innerHTML = renderPage({
    navbar,
    main: `<div class="container">${shell}</div>`,
    extraStyles: `
      ${getEnterpriseStyles()}
      .setup-required-premium { display: flex; justify-content: center; padding: 60px 0; }
      .setup-card { max-width: 600px; text-align: center; padding: 64px; border-top: 4px solid var(--brand-orange); }
      .setup-icon { color: var(--brand-orange); margin-bottom: 32px; }
      .setup-card h2 { font-size: 28px; font-weight: 800; color: var(--brand-blue); margin-bottom: 16px; letter-spacing: -0.02em; }
      .setup-card p { color: var(--text-muted); margin-bottom: 40px; line-height: 1.6; font-size: 16px; }
      .btn-enterprise-primary { 
        background: var(--brand-blue); color: white; padding: 16px 32px; 
        border-radius: 8px; text-decoration: none; font-weight: 700; display: inline-block;
        transition: all 0.2s ease;
      }
      .btn-enterprise-primary:hover { background: #1e293b; transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
    `,
  });
}

/* =========================
   ESTILOS Y GRÁFICOS
========================= */

function initializeAnalytics(data) {
  const ctx = document.getElementById("applicationsChart");
  if (!ctx || !data || Object.keys(data).length === 0) return;

  const palette = ["#0f172a", "#f97316", "#334155", "#64748b", "#94a3b8"];

  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: Object.keys(data).map(
        (k) => k.charAt(0).toUpperCase() + k.slice(1),
      ),
      datasets: [
        {
          data: Object.values(data),
          backgroundColor: palette,
          hoverBackgroundColor: palette,
          borderWidth: 4,
          borderColor: "#ffffff",
        },
      ],
    },
    options: {
      cutout: "75%",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            usePointStyle: true,
            padding: 20,
            font: { size: 12, family: "'Inter', sans-serif", weight: "600" },
          },
        },
      },
    },
  });
}

function getEnterpriseStyles() {
  return `
    :root {
      --brand-blue: #0f172a;
      --brand-orange: #f97316;
      --bg-light: #f8fafc;
      --text-main: #1e293b;
      --text-muted: #64748b;
      --border-soft: #e2e8f0;
    }

    .dashboard-premium { display: flex; flex-direction: column; gap: 32px; background: var(--bg-light); }

    .metrics-grid-premium { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; }
    .metric-card-premium { 
      background: #fff; padding: 24px; border-radius: 12px; border: 1px solid var(--border-soft);
      position: relative; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .metric-decoration { 
      position: absolute; bottom: 0; left: 0; width: 100%; height: 4px; 
      background: linear-gradient(90deg, var(--brand-blue) 0%, var(--brand-orange) 100%); 
    }
    .metric-label { font-size: 13px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .metric-value { font-size: 36px; font-weight: 800; color: var(--brand-blue); margin-top: 8px; letter-spacing: -0.03em; }

    .main-data-layout { display: grid; grid-template-columns: 400px 1fr; gap: 24px; }
    @media (max-width: 1100px) { .main-data-layout { grid-template-columns: 1fr; } }

    .premium-card { background: #fff; border-radius: 12px; border: 1px solid var(--border-soft); padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .card-header-premium { margin-bottom: 32px; }
    .card-header-premium h3 { font-size: 20px; font-weight: 800; color: var(--brand-blue); letter-spacing: -0.02em; }
    .card-header-premium p { font-size: 14px; color: var(--text-muted); margin-top: 4px; }

    .premium-table { width: 100%; border-collapse: separate; border-spacing: 0; }
    .premium-table th { 
      background: #f8fafc; padding: 16px; text-align: left; font-size: 12px; 
      font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;
      border-top: 1px solid var(--border-soft); border-bottom: 2px solid var(--border-soft);
    }
    .premium-table td { padding: 20px 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; vertical-align: middle; }
    
    .user-cell { display: flex; align-items: center; gap: 12px; }
    .user-avatar-mini { 
      width: 36px; height: 36px; background: var(--brand-blue); color: #fff; 
      border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px;
    }
    .user-name { font-weight: 700; color: var(--brand-blue); }
    .td-vacancy { color: var(--text-main); font-weight: 600; }
    .td-date { color: var(--text-muted); font-size: 13px; font-weight: 500; }

    .status-pill { 
      padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 800; display: inline-block;
      background: #f1f5f9; color: #475569; letter-spacing: 0.02em;
    }
    .pill-pending { background: #fff7ed; color: #c2410c; }
    .pill-interview { background: #eff6ff; color: #1d4ed8; }
    .pill-accepted { background: #f0fdf4; color: #15803d; }
    .pill-rejected { background: #fef2f2; color: #b91c1c; }

    .chart-wrapper-premium { height: 320px; position: relative; }
    .empty-row { text-align: center; padding: 60px !important; color: var(--text-muted); font-style: italic; font-weight: 500; }
  `;
}
