import { config } from "@core/config";
import { store } from "@core/store";
import { companyService } from "@services/company.service";
import {
  getAuthUiContext,
  renderNavbar,
  renderPage,
  renderRoleShell,
  showLoading,
} from "@utils/ui";

/* =========================
   HELPERS
========================= */

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "-" : d.toLocaleDateString();
}

function getFullName(user = {}) {
  return (
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "Sin nombre"
  );
}

function getStatusBadge(status) {
  return `<span class="status-badge status-${status}">${status}</span>`;
}

/* =========================
   KPI CARDS
========================= */

function renderCard(title, value) {
  return `
    <div class="kpi-card">
      <div class="kpi-title">${title}</div>
      <div class="kpi-value">${value}</div>
    </div>
  `;
}

/* =========================
   CHART
========================= */

function renderChart() {
  return `
    <div class="chart-card">
      <h3>Aplicaciones por estado</h3>
      <canvas id="applicationsChart"></canvas>
    </div>
  `;
}

/* =========================
   TABLE
========================= */

function renderTable(applications) {
  if (!applications.length) {
    return `<p>No hay aplicaciones recientes.</p>`;
  }

  return `
    <div class="table-card">
      <div class="table-header">
        <h3>Últimas aplicaciones</h3>
      </div>

      <table class="admin-table">
        <thead>
          <tr>
            <th>Candidato</th>
            <th>Vacante</th>
            <th>Estado</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          ${applications
            .map(
              (a) => `
            <tr class="table-row" data-id="${a.id}">
              <td>${getFullName(a.user)}</td>
              <td>${a.vacancy?.title || "-"}</td>
              <td>${getStatusBadge(a.status)}</td>
              <td>${formatDate(a.appliedAt)}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

/* =========================
   MAIN
========================= */

export async function initCompanyDashboardPage() {
  const app = document.getElementById("app");
  const authContext = getAuthUiContext();

  showLoading("Cargando dashboard...");

  try {
    const user = store.get("user");
    const companyId = user?.companyId || user?.company?.id;

    const [dashboard, statusData, recentApps] = await Promise.all([
      companyService.getDashboard(companyId),
      companyService.getApplicationsByStatus(companyId),
      companyService.getRecentApplications(companyId),
    ]);

    const navbar = renderNavbar({
      activeRoute: config.ROUTES.COMPANY_DASHBOARD,
      ...authContext,
    });

    const content = `
      <div class="dashboard">

        <div class="kpi-grid">
          ${renderCard("Vacantes", dashboard.vacancies)}
          ${renderCard("Aplicaciones", dashboard.applications)}
          ${renderCard("En proceso", dashboard.candidatesInProcess)}
          ${renderCard("Contratados", dashboard.hires)}
        </div>

        <div class="dashboard-row">
          ${renderChart()}
        </div>

        <div class="dashboard-row">
          ${renderTable(recentApps)}
        </div>

      </div>
    `;

    const shell = renderRoleShell({
      title: "Dashboard",
      subtitle: "Resumen general de tu empresa",
      roles: authContext.roles,
      primaryRole: authContext.primaryRole,
      content,
    });

    app.innerHTML = renderPage({
      navbar,
      main: `<div class="container">${shell}</div>`,
      extraStyles: `
        .dashboard {
          display:flex;
          flex-direction:column;
          gap:28px;
        }

        .kpi-grid {
          display:grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap:18px;
        }

        .kpi-card {
          background:#fff;
          padding:22px;
          border-radius:16px;
          border:1px solid #e5e7eb;
          position:relative;
          overflow:hidden;
          transition: all .2s ease;
        }

        .kpi-card::after {
          content:"";
          position:absolute;
          inset:0;
          background:linear-gradient(to right, transparent, rgba(0,0,0,0.03));
          opacity:0;
          transition:.2s;
        }

        .kpi-card:hover {
          transform:translateY(-4px);
          box-shadow:0 12px 28px rgba(0,0,0,0.08);
        }

        .kpi-card:hover::after {
          opacity:1;
        }

        .kpi-title {
          font-size:13px;
          color:#6b7280;
        }

        .kpi-value {
          font-size:30px;
          font-weight:800;
          margin-top:6px;
          color:#111827;
        }

        .dashboard-row {
          display:grid;
        }

        .chart-card, .table-card {
          background:#fff;
          padding:22px;
          border-radius:16px;
          border:1px solid #e5e7eb;
        }

        #applicationsChart {
          max-height:280px;
        }

        .admin-table {
          width:100%;
          border-collapse:collapse;
          margin-top:14px;
        }

        .admin-table th {
          text-align:left;
          font-size:12px;
          color:#6b7280;
          padding:12px;
          border-bottom:1px solid #eee;
        }

        .admin-table td {
          padding:12px;
          border-bottom:1px solid #f1f5f9;
        }

        .table-row:hover {
          background:#f9fafb;
          cursor:pointer;
        }

        .status-badge {
          padding:5px 10px;
          border-radius:999px;
          font-size:11px;
          font-weight:600;
          text-transform:capitalize;
        }

        .status-pending { background:#fef3c7; color:#92400e; }
        .status-reviewed { background:#dbeafe; color:#1e40af; }
        .status-interview { background:#e0e7ff; color:#3730a3; }
        .status-accepted { background:#dcfce7; color:#166534; }
        .status-rejected { background:#fee2e2; color:#991b1b; }
      `,
    });

    /* =========================
       CHART INIT
    ========================= */

    const ctx = document.getElementById("applicationsChart");

    if (ctx) {
      new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: Object.keys(statusData),
          datasets: [
            {
              data: Object.values(statusData),
              backgroundColor: [
                "#facc15",
                "#60a5fa",
                "#818cf8",
                "#22c55e",
                "#ef4444",
              ],
              borderWidth: 0,
            },
          ],
        },
        options: {
          cutout: "60%",
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                usePointStyle: true,
              },
            },
          },
        },
      });
    }
  } catch (error) {
    console.error(error);
    app.innerHTML = `<p>Error cargando dashboard</p>`;
  }
}
