// Saved Jobs Page Controller
import { applicationService } from "@services/application.service";
import {
  getAuthUiContext,
  renderContentState,
  renderSectionHeader,
  showLoading,
  renderNavbar,
  renderPage,
} from "@utils/ui.js";

export async function initSavedJobsPage(params, query) {
  const authContext = getAuthUiContext();
  const user = authContext.user;
  showLoading("Cargando empleos guardados...");

  try {
    const savedJobsData = await applicationService.getSavedJobs();
    const savedJobs = Array.isArray(savedJobsData)
      ? savedJobsData
      : savedJobsData.data || [];
    document.getElementById("app").innerHTML = getSavedJobsHTML(
      authContext,
      savedJobs,
    );
    initSavedJobsEvents();
  } catch (error) {
    console.error("Error loading saved jobs:", error);
    document.getElementById("app").innerHTML = getSavedJobsHTML(
      authContext,
      [],
    );
    initSavedJobsEvents();
  }
}

function getSavedJobsHTML(authContext, savedJobs) {
  const { user, isAuthenticated, roles, primaryRole } = authContext;
  const navbar = renderNavbar({
    activeRoute: "candidate/saved-jobs",
    isAuthenticated,
    user,
    roles,
    primaryRole,
  });

  const header = renderSectionHeader({
    title: "Empleos Guardados",
    subtitle: `${savedJobs.length} empleo${savedJobs.length !== 1 ? "s" : ""} guardado${savedJobs.length !== 1 ? "s" : ""}`,
    actions:
      '<a href="#/vacancies" class="btn btn--outline btn--sm">Explorar empleos</a>',
  });

  const jobsHTML =
    savedJobs.length > 0
      ? savedJobs
          .map((job) => {
            const v = job.vacancy || {};
            return `
          <article class="saved-job-card">
            <div class="saved-job-card__logo">${(v.companyName || "C")[0]}</div>
            <div class="saved-job-card__info">
              <h3 class="saved-job-card__title">${v.title || "Puesto"}</h3>
              <p class="saved-job-card__company">${v.companyName || "Empresa"}</p>
              <p class="saved-job-card__meta">${v.city || ""}${v.modality ? ` • ${v.modality}` : ""}${v.salaryMin ? ` • $${v.salaryMin.toLocaleString()}` : ""}</p>
            </div>
            <div class="saved-job-card__actions">
              <a href="#/vacancies/${v.id}" class="btn btn--sm btn--primary">Ver Detalles</a>
              <button class="btn btn--sm btn--outline btn--remove" data-saved-id="${job.id}">Eliminar</button>
            </div>
          </article>
        `;
          })
          .join("")
      : renderContentState({
          title: "No tienes empleos guardados",
          message: "Guarda empleos que te interesen para revisarlos más tarde.",
          actionLabel: "Explorar empleos",
          actionHref: "#/vacancies",
        });

  const mainContent = `
    <div class="container">
      ${header}
      <div class="saved-jobs-grid">${jobsHTML}</div>
    </div>
  `;

  const styles = `
    .saved-jobs-page { min-height: calc(100vh - 70px); padding: 40px 0; background: #f9fafb; }
    .saved-jobs-grid { display: grid; gap: 20px; }
    .saved-job-card { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 16px; }
    .saved-job-card__logo { width: 56px; height: 56px; border-radius: 12px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; font-weight: 600; color: #6b7280; font-size: 24px; flex-shrink: 0; }
    .saved-job-card__info { flex: 1; }
    .saved-job-card__title { font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 4px; }
    .saved-job-card__company { font-size: 14px; color: #6b7280; margin: 0 0 4px; }
    .saved-job-card__meta { font-size: 13px; color: #9ca3af; margin: 0; }
    .saved-job-card__actions { display: flex; gap: 8px; }
    .th-content-state { grid-column: 1 / -1; }
  `;

  return renderPage({
    navbar,
    main: mainContent,
    pageClass: "saved-jobs-page",
    extraStyles: styles,
  });
}

function initSavedJobsEvents() {
  document.querySelectorAll(".btn--remove").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (confirm("¿Eliminar este empleo de tus guardados?")) {
        try {
          await applicationService.unsaveJob(btn.getAttribute("data-saved-id"));
          btn.closest(".saved-job-card").remove();
        } catch (error) {
          console.error("Error removing saved job:", error);
        }
      }
    });
  });
}
