// Applications Page Controller
import { applicationService } from "@services/application.service";
import {
  getAuthUiContext,
  renderContentState,
  renderSectionHeader,
  showLoading,
  renderNavbar,
  renderPage,
} from "@utils/ui.js";

export async function initApplicationsPage(params, query) {
  const authContext = getAuthUiContext();
  showLoading("Cargando aplicaciones...");

  try {
    const data = await applicationService.getApplications({ limit: 50 });
    const applications = Array.isArray(data) ? data : data.data || [];
    document.getElementById("app").innerHTML = getApplicationsHTML(
      authContext,
      applications,
    );
    initApplicationsEvents();
  } catch (error) {
    console.error("Error loading applications:", error);
    document.getElementById("app").innerHTML = getApplicationsHTML(
      authContext,
      [],
    );
    initApplicationsEvents();
  }
}

function getStatusBadge(status) {
  const map = {
    pending: { text: "Pendiente", cls: "status--pending" },
    reviewed: { text: "Revisada", cls: "status--reviewed" },
    interview: { text: "Entrevista", cls: "status--interview" },
    accepted: { text: "Aceptada", cls: "status--accepted" },
    rejected: { text: "Rechazada", cls: "status--rejected" },
  };
  const s = map[status] || { text: status, cls: "" };
  return `<span class="status-badge ${s.cls}">${s.text}</span>`;
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
    subtitle: `${applications.length} aplicacion${applications.length !== 1 ? "es" : ""} enviada${applications.length !== 1 ? "s" : ""}`,
    actions:
      '<a href="#/vacancies" class="btn btn--outline btn--sm">Buscar más empleos</a>',
  });

  const appsHTML =
    applications.length > 0
      ? applications
          .map((app) => {
            const v = app.vacancy || {};
            return `
          <article class="application-card">
            <div class="application-card__logo">${(v.companyName || "C")[0]}</div>
            <div class="application-card__info">
              <h3 class="application-card__title">${v.title || "Puesto"}</h3>
              <p class="application-card__company">${v.companyName || "Empresa"}</p>
              <p class="application-card__date">Aplicado el ${app.createdAt ? new Date(app.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }) : "—"}</p>
            </div>
            <div class="application-card__status">${getStatusBadge(app.status)}</div>
          </article>
        `;
          })
          .join("")
      : renderContentState({
          title: "No has enviado aplicaciones aún",
          message: "Cuando apliques a un empleo, aparecerá aquí con su estado.",
          actionLabel: "Explorar empleos",
          actionHref: "#/vacancies",
        });

  const mainContent = `
    <div class="container">
      ${header}
      <div class="applications-grid">${appsHTML}</div>
    </div>
  `;

  const styles = `
    .applications-page { min-height: calc(100vh - 70px); padding: 40px 0; background: #f9fafb; }
    .applications-grid { display: grid; gap: 20px; }
    .application-card { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 16px; }
    .application-card__logo { width: 56px; height: 56px; border-radius: 12px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; font-weight: 600; color: #6b7280; font-size: 24px; flex-shrink: 0; }
    .application-card__info { flex: 1; }
    .application-card__title { font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 4px; }
    .application-card__company { font-size: 14px; color: #6b7280; margin: 0 0 4px; }
    .application-card__date { font-size: 13px; color: #9ca3af; margin: 0; }
    .application-card__status { flex-shrink: 0; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500; }
    .status--pending { background: #fef3c7; color: #92400e; }
    .status--reviewed { background: #dbeafe; color: #1e40af; }
    .status--interview { background: #e0e7ff; color: #3730a3; }
    .status--accepted { background: #d1fae5; color: #065f46; }
    .status--rejected { background: #fee2e2; color: #991b1b; }
    .th-content-state { grid-column: 1 / -1; }
  `;

  return renderPage({
    navbar,
    main: mainContent,
    pageClass: "applications-page",
    extraStyles: styles,
  });
}

function initApplicationsEvents() {}
