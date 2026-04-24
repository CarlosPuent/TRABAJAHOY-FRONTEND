import { applicationService } from "@services/application.service";
import {
  getAuthUiContext,
  renderContentState,
  renderSectionHeader,
  showLoading,
  renderNavbar,
  renderPage,
} from "@utils/ui.js";

/* =========================
   MAIN
========================= */

export async function initApplicationsPage() {
  const authContext = getAuthUiContext();
  showLoading("Cargando aplicaciones...");

  try {
    const data = await applicationService.getApplications({ limit: 50 });
    const applications = Array.isArray(data) ? data : data.data || [];

    document.getElementById("app").innerHTML = getApplicationsHTML(
      authContext,
      applications,
    );
  } catch (error) {
    console.error(error);

    document.getElementById("app").innerHTML = getApplicationsHTML(
      authContext,
      [],
    );
  }
}

/* =========================
   UI
========================= */

function getStatusBadge(status) {
  const map = {
    pending: { text: "Pendiente", cls: "pending" },
    reviewed: { text: "Revisada", cls: "reviewed" },
    interview: { text: "Entrevista", cls: "interview" },
    accepted: { text: "Aceptada", cls: "accepted" },
    rejected: { text: "Rechazada", cls: "rejected" },
  };

  const s = map[status] || { text: status, cls: "" };

  return `<span class="status-badge ${s.cls}">${s.text}</span>`;
}

function renderApplicationCard(app) {
  const v = app.vacancy || {};

  return `
    <article class="application-card">
      
      <div class="app-left">
        <div class="logo">${(v.companyName || "C")[0]}</div>
      </div>

      <div class="app-center">
        <h3>${v.title || "Puesto"}</h3>
        <p class="company">${v.companyName || "Empresa"}</p>
        <p class="date">
          Aplicaste el ${
            app.createdAt
              ? new Date(app.createdAt).toLocaleDateString("es-ES")
              : "-"
          }
        </p>
      </div>

      <div class="app-right">
        ${getStatusBadge(app.status)}
      </div>

    </article>
  `;
}

function getApplicationsHTML(authContext, applications) {
  const { user, isAuthenticated, roles, primaryRole } = authContext;

  const navbar = renderNavbar({
    activeRoute: "candidate/applications",
    isAuthenticated,
    user,
    roles,
    primaryRole,
  });

  const header = renderSectionHeader({
    title: "Mis Aplicaciones",
    subtitle: `${applications.length} en total`,
    actions: `<a href="#/vacancies" class="btn btn--outline btn--sm">Buscar empleos</a>`,
  });

  const content =
    applications.length > 0
      ? applications.map(renderApplicationCard).join("")
      : renderContentState({
          title: "Sin aplicaciones",
          message: "Aún no aplicas a ningún empleo.",
          actionLabel: "Explorar empleos",
          actionHref: "#/vacancies",
        });

  return renderPage({
    navbar,
    main: `
      <div class="container">
        ${header}
        <div class="apps-grid">${content}</div>
      </div>
    `,
    pageClass: "applications-page",
    extraStyles: `
      .apps-grid {
        display:flex;
        flex-direction:column;
        gap:16px;
      }

      .application-card {
        display:flex;
        align-items:center;
        gap:16px;
        padding:18px;
        border-radius:14px;
        background:#fff;
        border:1px solid #e5e7eb;
        transition:.2s;
      }

      .application-card:hover {
        transform:translateY(-3px);
        box-shadow:0 10px 20px rgba(0,0,0,0.06);
      }

      .logo {
        width:50px;
        height:50px;
        border-radius:12px;
        background:#f1f5f9;
        display:flex;
        align-items:center;
        justify-content:center;
        font-weight:bold;
      }

      .app-center h3 {
        margin:0;
        font-size:16px;
      }

      .company {
        font-size:13px;
        color:#64748b;
      }

      .date {
        font-size:12px;
        color:#94a3b8;
      }

      .app-right {
        margin-left:auto;
      }

      .status-badge {
        padding:6px 12px;
        border-radius:999px;
        font-size:12px;
        font-weight:600;
      }

      .pending { background:#fef3c7; }
      .reviewed { background:#dbeafe; }
      .interview { background:#e0e7ff; }
      .accepted { background:#dcfce7; }
      .rejected { background:#fee2e2; }
    `,
  });
}
