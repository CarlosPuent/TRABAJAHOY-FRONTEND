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
    const s = status.toLowerCase();
    return `<span class="status-pill pill-${s}">${status.toUpperCase()}</span>`;
  },
};

/* =========================
   COMPONENTES PREMIUM
========================= */

function renderMetricCard(label, value, trend = "") {
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
    const companyId = user?.companyId || user?.company?.id || user?.company_id;

    if (!companyId || companyId === "undefined") {
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
                    applications.length > 0
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
      title: "Dashboard",
      subtitle: user?.company?.name || "Enterprise Management",
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
    app.innerHTML = `<div class="container-error-premium">Error de sincronización con el servidor.</div>`;
  }
}

/* =========================
   ESTILOS Y GRÁFICOS
========================= */

function initializeAnalytics(data) {
  const ctx = document.getElementById("applicationsChart");
  if (!ctx || !data || Object.keys(data).length === 0) return;

  // Paleta Premium: Azul noche, Naranja acento, Grises profundos
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
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            usePointStyle: true,
            padding: 20,
            font: { size: 12, family: "'Inter', sans-serif" },
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

    /* Metric Cards */
    .metrics-grid-premium { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; }
    .metric-card-premium { 
      background: #fff; 
      padding: 24px; 
      border-radius: 12px; 
      border: 1px solid var(--border-soft);
      position: relative;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .metric-decoration { 
      position: absolute; bottom: 0; left: 0; width: 100%; height: 4px; 
      background: linear-gradient(90deg, var(--brand-blue) 0%, var(--brand-orange) 100%); 
    }
    .metric-label { font-size: 13px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.025em; }
    .metric-value { font-size: 36px; font-weight: 800; color: var(--brand-blue); margin-top: 8px; }

    /* Layout Data */
    .main-data-layout { display: grid; grid-template-columns: 380px 1fr; gap: 24px; }
    @media (max-width: 1024px) { .main-data-layout { grid-template-columns: 1fr; } }

    .premium-card { background: #fff; border-radius: 12px; border: 1px solid var(--border-soft); padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .card-header-premium { margin-bottom: 24px; }
    .card-header-premium h3 { font-size: 18px; font-weight: 700; color: var(--brand-blue); }
    .card-header-premium p { font-size: 14px; color: var(--text-muted); }

    /* Table Styles */
    .premium-table { width: 100%; border-collapse: separate; border-spacing: 0; }
    .premium-table th { 
      background: #f1f5f9; 
      padding: 12px 16px; 
      text-align: left; 
      font-size: 12px; 
      font-weight: 600; 
      color: var(--text-muted);
      border-top: 1px solid var(--border-soft);
      border-bottom: 1px solid var(--border-soft);
    }
    .premium-table td { padding: 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; vertical-align: middle; }
    
    .user-cell { display: flex; align-items: center; gap: 12px; }
    .user-avatar-mini { 
      width: 32px; height: 32px; background: var(--brand-blue); color: #fff; 
      border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px;
    }
    .user-name { font-weight: 600; color: var(--brand-blue); }
    .td-vacancy { color: var(--text-main); font-weight: 500; }
    .td-date { color: var(--text-muted); font-size: 13px; }

    /* Status Pills */
    .status-pill { 
      padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; display: inline-block;
      background: #f1f5f9; color: #475569;
    }
    .pill-pending { background: #fff7ed; color: #c2410c; } /* Orange soft */
    .pill-interview { background: #eff6ff; color: #1d4ed8; } /* Blue soft */
    .pill-accepted { background: #f0fdf4; color: #15803d; } /* Green soft */
    .pill-rejected { background: #fef2f2; color: #b91c1c; } /* Red soft */

    .chart-wrapper-premium { height: 300px; }
    .empty-row { text-align: center; padding: 48px !important; color: var(--text-muted); font-style: italic; }
  `;
}
