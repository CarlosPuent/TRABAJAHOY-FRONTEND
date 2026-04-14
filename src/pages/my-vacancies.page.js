import { config } from "@core/config";
import { vacancyService } from "@services/vacancy.service";
import {
  getAuthUiContext,
  renderContentState,
  renderNavbar,
  renderPage,
  renderRoleShell,
  resolveRequestErrorMessage,
  showLoading,
} from "@utils/ui";

function normalizeVacanciesResponse(result) {
  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result?.data)) {
    return result.data;
  }

  if (Array.isArray(result?.items)) {
    return result.items;
  }

  return [];
}

function formatDate(dateValue) {
  if (!dateValue) return "-";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("es-PE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function getStatusMeta(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "published") {
    return {
      label: "Publicada",
      className: "status-badge status-badge--published",
    };
  }

  if (normalized === "draft") {
    return {
      label: "Draft",
      className: "status-badge status-badge--draft",
    };
  }

  if (normalized === "closed") {
    return {
      label: "Cerrada",
      className: "status-badge status-badge--closed",
    };
  }

  if (normalized === "archived") {
    return {
      label: "Archivada",
      className: "status-badge status-badge--archived",
    };
  }

  return {
    label: normalized || "Desconocido",
    className: "status-badge",
  };
}

function renderVacancyRow(vacancy = {}) {
  const statusMeta = getStatusMeta(vacancy.status);
  const location = [vacancy.city, vacancy.country].filter(Boolean).join(", ");
  const publishDate = vacancy.publishedAt
    ? formatDate(vacancy.publishedAt)
    : "-";
  const createdDate = formatDate(vacancy.createdAt);

  return `
    <article class="manage-vacancy-card" data-vacancy-id="${vacancy.id}">
      <header class="manage-vacancy-card__header">
        <h3 class="manage-vacancy-card__title">${vacancy.title || "Vacante sin titulo"}</h3>
        <span class="${statusMeta.className}">${statusMeta.label}</span>
      </header>

      <div class="manage-vacancy-card__meta">
        <span>${location || "Ubicacion no definida"}</span>
        ${vacancy.modality ? `<span>${vacancy.modality}</span>` : ""}
        ${vacancy.level ? `<span>${vacancy.level}</span>` : ""}
      </div>

      <dl class="manage-vacancy-card__dates">
        <div>
          <dt>Creada</dt>
          <dd>${createdDate}</dd>
        </div>
        <div>
          <dt>Publicada</dt>
          <dd>${publishDate}</dd>
        </div>
      </dl>

      <footer class="manage-vacancy-card__actions">
        ${
          String(vacancy.status || "").toLowerCase() === "draft"
            ? `<button class="btn btn--primary btn--sm" data-publish-vacancy="${vacancy.id}">Publicar</button>`
            : `<span class="manage-vacancy-card__published-note">Lista para recibir postulaciones</span>`
        }
      </footer>
    </article>
  `;
}

function renderVacancyList(vacancies = []) {
  if (vacancies.length === 0) {
    return renderContentState({
      title: "Aun no tienes vacantes",
      message:
        "Crea tu primera vacante y luego podras publicarla desde este panel.",
      actionLabel: "Crear vacante",
      actionHref: `#${config.ROUTES.CREATE_VACANCY}`,
    });
  }

  return `
    <section class="manage-vacancies-grid" id="manage-vacancies-grid">
      ${vacancies.map((vacancy) => renderVacancyRow(vacancy)).join("\n")}
    </section>
  `;
}

function renderMyVacanciesHTML(authContext, vacancies = []) {
  const { isAuthenticated, user, roles, primaryRole } = authContext;
  const navbar = renderNavbar({
    activeRoute: config.ROUTES.MY_VACANCIES,
    isAuthenticated,
    user,
    roles,
    primaryRole,
  });

  const shell = renderRoleShell({
    title: "Mis Vacantes",
    subtitle: "Gestiona tus vacantes y publica las que siguen en estado draft.",
    roles,
    primaryRole,
    actions: `<a href="#${config.ROUTES.CREATE_VACANCY}" class="btn btn--primary btn--sm">Nueva vacante</a>`,
    shellClass: "my-vacancies-shell",
    content: `
      <p class="th-feedback th-feedback--info" id="my-vacancies-feedback">Cargando vacantes...</p>
      ${renderVacancyList(vacancies)}
    `,
  });

  const extraStyles = `
    .my-vacancies-page {
      min-height: calc(100vh - 70px);
      padding: 30px 0;
      background: #f8fafc;
    }
    .my-vacancies-shell .role-shell__content {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 20px;
    }
    .manage-vacancies-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
      gap: 14px;
      margin-top: 12px;
    }
    .manage-vacancy-card {
      border: 1px solid #dbe4ef;
      border-radius: 12px;
      padding: 14px;
      background: #fff;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .manage-vacancy-card__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 10px;
    }
    .manage-vacancy-card__title {
      margin: 0;
      font-size: 17px;
      color: #0f172a;
      line-height: 1.25;
    }
    .manage-vacancy-card__meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      color: #475569;
      font-size: 13px;
    }
    .manage-vacancy-card__meta span {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 999px;
      padding: 3px 8px;
    }
    .manage-vacancy-card__dates {
      margin: 0;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
    .manage-vacancy-card__dates dt {
      font-size: 11px;
      text-transform: uppercase;
      color: #64748b;
      margin: 0 0 3px;
    }
    .manage-vacancy-card__dates dd {
      margin: 0;
      font-size: 13px;
      color: #1e293b;
      font-weight: 600;
    }
    .manage-vacancy-card__actions {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      min-height: 34px;
    }
    .manage-vacancy-card__published-note {
      font-size: 13px;
      color: #166534;
      font-weight: 600;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 3px 9px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      font-weight: 700;
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
      flex-shrink: 0;
    }
    .status-badge--draft {
      background: #fff7ed;
      color: #9a3412;
      border-color: #fed7aa;
    }
    .status-badge--published {
      background: #ecfdf5;
      color: #166534;
      border-color: #bbf7d0;
    }
    .status-badge--closed,
    .status-badge--archived {
      background: #f8fafc;
      color: #475569;
      border-color: #cbd5e1;
    }
  `;

  return renderPage({
    navbar,
    main: `<div class="container">${shell}</div>`,
    pageClass: "my-vacancies-page",
    extraStyles,
  });
}

function updateFeedback({ message, type = "info" }) {
  const feedback = document.getElementById("my-vacancies-feedback");
  if (!feedback) return;

  feedback.textContent = message;
  feedback.className = `th-feedback th-feedback--${type}`;
}

async function publishDraftVacancy(vacancy, publishButton) {
  if (!vacancy?.id) {
    throw new Error("Vacante invalida.");
  }

  if (String(vacancy.status || "").toLowerCase() !== "draft") {
    throw new Error("Solo se pueden publicar vacantes en estado draft.");
  }

  publishButton.disabled = true;
  publishButton.setAttribute("aria-busy", "true");
  publishButton.textContent = "Publicando...";

  try {
    const managedResult = await vacancyService.getVacancyManage(vacancy.id);
    const managedVacancy = managedResult?.data || managedResult;

    if (
      String(managedVacancy?.status || vacancy.status).toLowerCase() !== "draft"
    ) {
      const conflict = new Error(
        "La vacante ya no esta en draft y no puede publicarse desde este estado.",
      );
      conflict.statusCode = 409;
      throw conflict;
    }

    const updateResult = await vacancyService.updateVacancy(vacancy.id, {
      status: "published",
    });

    const updatedVacancy = updateResult?.data || updateResult || {};
    return {
      ...vacancy,
      ...updatedVacancy,
      status: "published",
      publishedAt: updatedVacancy.publishedAt || new Date().toISOString(),
    };
  } finally {
    publishButton.removeAttribute("aria-busy");
  }
}

function bindMyVacanciesEvents(state, authContext) {
  document.querySelectorAll("[data-publish-vacancy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const vacancyId = button.getAttribute("data-publish-vacancy");
      const vacancy = state.vacancies.find(
        (item) => String(item.id) === String(vacancyId),
      );

      if (!vacancy) {
        updateFeedback({
          message: "No se encontro la vacante seleccionada.",
          type: "error",
        });
        return;
      }

      updateFeedback({
        message: `Publicando ${vacancy.title || "vacante"}...`,
        type: "info",
      });

      try {
        const updatedVacancy = await publishDraftVacancy(vacancy, button);
        state.vacancies = state.vacancies.map((item) =>
          String(item.id) === String(updatedVacancy.id) ? updatedVacancy : item,
        );

        const app = document.getElementById("app");
        if (!app) return;
        app.innerHTML = renderMyVacanciesHTML(authContext, state.vacancies);

        updateFeedback({
          message: "Vacante publicada correctamente.",
          type: "success",
        });

        bindMyVacanciesEvents(state, authContext);
      } catch (error) {
        const isConflict =
          error?.response?.status === 409 || error?.statusCode === 409;

        updateFeedback({
          message: isConflict
            ? "No se pudo publicar porque la vacante ya no esta en estado draft."
            : resolveRequestErrorMessage(
                error,
                "No se pudo publicar la vacante en este momento.",
              ),
          type: "error",
        });

        button.disabled = false;
        button.textContent = "Publicar";
      }
    });
  });
}

export async function initMyVacanciesPage() {
  const app = document.getElementById("app");
  const authContext = getAuthUiContext();

  showLoading("Cargando tus vacantes...");

  try {
    const manageResult = await vacancyService.getAllVacancies();
    const vacancies = normalizeVacanciesResponse(manageResult);
    const state = { vacancies };

    if (!app) {
      return;
    }

    app.innerHTML = renderMyVacanciesHTML(authContext, vacancies);

    if (vacancies.length > 0) {
      updateFeedback({
        message: `${vacancies.length} vacante${vacancies.length === 1 ? "" : "s"} cargada${vacancies.length === 1 ? "" : "s"}.`,
        type: "info",
      });
    } else {
      updateFeedback({
        message: "Aun no tienes vacantes para gestionar.",
        type: "info",
      });
    }

    bindMyVacanciesEvents(state, authContext);
  } catch (error) {
    console.error("Error loading managed vacancies:", error);
    if (!app) return;

    const { isAuthenticated, user, roles, primaryRole } = authContext;
    const navbar = renderNavbar({
      activeRoute: config.ROUTES.MY_VACANCIES,
      isAuthenticated,
      user,
      roles,
      primaryRole,
    });

    const state = renderContentState({
      type: "error",
      icon: "alert",
      title: "No se pudieron cargar tus vacantes",
      message: resolveRequestErrorMessage(
        error,
        "Intenta nuevamente en unos segundos.",
      ),
      actionLabel: "Reintentar",
      actionHref: `#${config.ROUTES.MY_VACANCIES}`,
    });

    app.innerHTML = renderPage({
      navbar,
      main: `<div class="container" style="padding: 32px 0;">${state}</div>`,
      pageClass: "my-vacancies-page",
    });
  }
}
