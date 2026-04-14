// Vacancies Listing Page Controller
import { vacancyService } from "@services/vacancy.service";
import { applicationService } from "@services/application.service";
import {
  getAuthUiContext,
  renderContentState,
  renderSectionHeader,
  renderVacancyCard,
  resolveRequestErrorMessage,
  showLoading,
  renderNavbar,
  renderPage,
} from "@utils/ui.js";

export async function initVacanciesPage(params, query) {
  const app = document.getElementById("app");
  const authContext = getAuthUiContext();

  showLoading("Cargando empleos...");

  try {
    const filters = {};
    if (query.page) filters.page = query.page;
    if (query.limit) filters.limit = query.limit;
    if (query.search) filters.search = query.search;
    if (query.country) filters.country = query.country;
    if (query.city) filters.city = query.city;
    if (query.type) filters.type = query.type;
    if (query.modality) filters.modality = query.modality;
    if (query.level) filters.level = query.level;
    if (query.categoryId) filters.categoryId = query.categoryId;

    const vacanciesData = await vacancyService.getVacancies(
      Object.keys(filters).length ? filters : {},
    );

    // Handle both envelope format { data: [], pagination: {} } and direct array []
    const vacancies = Array.isArray(vacanciesData)
      ? vacanciesData
      : vacanciesData.data || [];
    const pagination = vacanciesData.pagination || null;

    app.innerHTML = getVacanciesHTML(
      vacancies,
      pagination,
      filters,
      authContext,
    );
    initVacanciesEvents(filters);
  } catch (error) {
    console.error("Error loading vacancies:", error);
    app.innerHTML = getVacanciesHTML([], null, {}, authContext, {
      hasError: true,
      errorMessage: "No pudimos cargar las vacantes en este momento.",
    });
    initVacanciesEvents({});
  }
}

function getVacanciesHTML(
  vacancies,
  pagination,
  filters,
  authContext,
  options = {},
) {
  const { isAuthenticated, user, roles, primaryRole } = authContext;
  const navbar = renderNavbar({
    activeRoute: "vacancies",
    isAuthenticated,
    user,
    roles,
    primaryRole,
  });
  const { hasError = false, errorMessage = "" } = options;
  const activeFilters = getActiveFilterItems(filters);

  const jobsHTML = hasError
    ? renderContentState({
        type: "error",
        icon: "alert",
        title: "Error al cargar empleos",
        message: errorMessage,
        actionLabel: "Reintentar",
        actionHref: "#/vacancies",
      })
    : vacancies.length > 0
      ? vacancies
          .map((vacancy) =>
            renderVacancyCard({
              vacancy,
              showSaveAction: true,
              detailHref: `#/vacancies/${vacancy.id}`,
            }),
          )
          .join("\n")
      : renderContentState({
          title: "No se encontraron empleos",
          message: "Intenta con otros filtros o vuelve a intentarlo más tarde.",
          actionLabel: "Limpiar filtros",
          actionHref: "#/vacancies",
        });

  const paginationHTML =
    pagination && pagination.totalPages > 1
      ? getPaginationHTML(pagination, filters)
      : "";

  const header = renderSectionHeader({
    title: hasError
      ? "Empleos"
      : pagination
        ? `${pagination.total || vacancies.length} empleos encontrados`
        : "Empleos disponibles",
    subtitle: hasError
      ? "Revisa tu conexión y vuelve a intentarlo."
      : "Descubre vacantes activas según tu perfil y preferencias.",
    actions:
      activeFilters.length > 0
        ? `<span class="vacancies-filters__active-count">${activeFilters.length} filtro${activeFilters.length === 1 ? "" : "s"} activo${activeFilters.length === 1 ? "" : "s"}</span>`
        : "",
  });

  const activeFiltersHtml =
    activeFilters.length > 0
      ? `<div class="th-chip-list">${activeFilters.map((item) => `<span class="th-chip">${item.label}: ${item.value}</span>`).join("")}</div>`
      : "";

  const mainContent = `
    <div class="container">
      <div class="vacancies-layout">
        <aside class="vacancies-filters">
          <div class="vacancies-filters__header">
            <h2 class="vacancies-filters__title">Filtros</h2>
            <button class="vacancies-filters__clear" id="clear-filters">Limpiar</button>
          </div>
          <form class="vacancies-filters__form" id="filters-form">
            <div class="filter-group">
              <label class="filter-label">Buscar</label>
              <input type="text" class="filter-input" id="filter-search" placeholder="Palabras clave..." value="${filters.search || ""}" aria-label="Buscar por palabras clave" />
            </div>
            <div class="filter-group">
              <label class="filter-label">Ubicación</label>
              <input type="text" class="filter-input" id="filter-city" placeholder="Ciudad..." value="${filters.city || ""}" aria-label="Filtrar por ciudad" />
            </div>
            <div class="filter-group">
              <label class="filter-label">Modalidad</label>
              <select class="filter-select" id="filter-modality" aria-label="Filtrar por modalidad">
                <option value="">Todas</option>
                <option value="remote" ${filters.modality === "remote" ? "selected" : ""}>Remoto</option>
                <option value="hybrid" ${filters.modality === "hybrid" ? "selected" : ""}>Híbrido</option>
                <option value="onsite" ${filters.modality === "onsite" ? "selected" : ""}>Presencial</option>
              </select>
            </div>
            <div class="filter-group">
              <label class="filter-label">Tipo</label>
              <select class="filter-select" id="filter-type" aria-label="Filtrar por tipo de contrato">
                <option value="">Todos</option>
                <option value="full-time" ${filters.type === "full-time" ? "selected" : ""}>Tiempo completo</option>
                <option value="part-time" ${filters.type === "part-time" ? "selected" : ""}>Medio tiempo</option>
                <option value="contract" ${filters.type === "contract" ? "selected" : ""}>Contrato</option>
                <option value="freelance" ${filters.type === "freelance" ? "selected" : ""}>Freelance</option>
                <option value="internship" ${filters.type === "internship" ? "selected" : ""}>Prácticas</option>
              </select>
            </div>
            <div class="filter-group">
              <label class="filter-label">Nivel</label>
              <select class="filter-select" id="filter-level" aria-label="Filtrar por nivel de experiencia">
                <option value="">Todos</option>
                <option value="junior" ${filters.level === "junior" ? "selected" : ""}>Junior</option>
                <option value="mid" ${filters.level === "mid" ? "selected" : ""}>Mid</option>
                <option value="senior" ${filters.level === "senior" ? "selected" : ""}>Senior</option>
                <option value="lead" ${filters.level === "lead" ? "selected" : ""}>Lead</option>
                <option value="manager" ${filters.level === "manager" ? "selected" : ""}>Manager</option>
              </select>
            </div>
            <button type="submit" class="btn btn--primary btn--full-width">Aplicar Filtros</button>
          </form>
        </aside>
        <section class="vacancies-results">
          ${header}
          ${activeFiltersHtml}
          <p class="th-feedback th-feedback--info" id="vacancies-feedback" style="display:none;"></p>
          <div class="vacancies-grid">${jobsHTML}</div>
          ${paginationHTML}
        </section>
      </div>
    </div>
  `;

  const styles = `
    .vacancies-page { min-height: calc(100vh - 70px); padding: 32px 0; background: #f9fafb; }
    .vacancies-layout { display: grid; grid-template-columns: 280px 1fr; gap: 32px; }
    .vacancies-filters {
      background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      height: fit-content; position: sticky; top: 90px;
    }
    .vacancies-filters__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb; }
    .vacancies-filters__title { font-size: 18px; font-weight: 600; margin: 0; }
    .vacancies-filters__clear { background: none; border: none; color: #3b82f6; cursor: pointer; font-size: 14px; }
    .vacancies-filters__active-count { font-size: 12px; color: #475569; font-weight: 600; }
    .vacancies-filters__form { display: flex; flex-direction: column; gap: 20px; }
    .filter-label { display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; }
    .filter-input, .filter-select {
      width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px;
      font-size: 14px; transition: all 0.2s;
    }
    .filter-input:focus, .filter-select:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    .vacancies-grid { display: grid; gap: 20px; }
    .vacancy-card {
      background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      transition: all 0.2s; cursor: pointer;
    }
    .vacancy-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); transform: translateY(-2px); }
    .vacancy-card:focus-visible { outline: 3px solid rgba(59,130,246,0.35); outline-offset: 2px; }
    .vacancy-card__header { display: flex; gap: 16px; margin-bottom: 16px; }
    .vacancy-card__logo {
      width: 56px; height: 56px; border-radius: 12px; background: #f3f4f6;
      display: flex; align-items: center; justify-content: center; font-weight: 600;
      color: #6b7280; font-size: 24px; flex-shrink: 0;
    }
    .vacancy-card__info { flex: 1; }
    .vacancy-card__company { font-size: 14px; color: #6b7280; margin: 0 0 4px; }
    .vacancy-card__title { font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 8px; }
    .vacancy-card__meta { display: flex; flex-wrap: wrap; gap: 12px; font-size: 14px; color: #6b7280; margin-bottom: 16px; }
    .vacancy-card__meta-item { display: flex; align-items: center; gap: 6px; }
    .vacancy-card__salary { font-size: 16px; font-weight: 600; color: #10b981; margin-bottom: 16px; }
    .vacancy-card__tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
    .vacancy-card__tag {
      padding: 4px 12px; background: #f3f4f6; border-radius: 9999px; font-size: 12px; color: #374151;
    }
    .vacancy-card__actions { display: flex; gap: 12px; }
    .vacancy-card .btn[disabled] { opacity: 0.9; cursor: not-allowed; }
    .vacancies-grid .btn--saved { border-color: #bbf7d0; color: #166534; background: #f0fdf4; }
    .pagination { display: flex; justify-content: center; gap: 8px; margin-top: 32px; }
    .pagination__btn {
      padding: 8px 16px; border: 1px solid #d1d5db; background: white; border-radius: 8px;
      cursor: pointer; transition: all 0.2s; text-decoration: none; color: #374151; font-size: 14px;
    }
    .pagination__btn:hover { background: #f9fafb; }
    .pagination__btn--active { background: #3b82f6; color: white; border-color: #3b82f6; }
    .th-content-state { grid-column: 1 / -1; }
    .th-chip-list { margin-bottom: 12px; }
    .th-feedback { margin: 0 0 14px; }
    @media (max-width: 1024px) {
      .vacancies-layout { grid-template-columns: 1fr; }
      .vacancies-filters { position: static; }
    }
  `;

  return renderPage({
    navbar,
    main: mainContent,
    pageClass: "vacancies-page",
    extraStyles: styles,
  });
}

function getActiveFilterItems(filters = {}) {
  const labels = {
    search: "Busqueda",
    city: "Ciudad",
    modality: "Modalidad",
    type: "Tipo",
    level: "Nivel",
  };

  return Object.entries(filters)
    .filter(([key, value]) => labels[key] && value)
    .map(([key, value]) => ({ label: labels[key], value }));
}

function getPaginationHTML(pagination, filters) {
  const { page, totalPages } = pagination;
  let buttons = "";
  for (let i = 1; i <= totalPages; i++) {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.city) params.set("city", filters.city);
    if (filters.modality) params.set("modality", filters.modality);
    if (filters.type) params.set("type", filters.type);
    if (filters.level) params.set("level", filters.level);
    params.set("page", i);
    const qs = params.toString();
    buttons += `<a href="#/vacancies${qs ? "?" + qs : ""}" class="pagination__btn ${i === page ? "pagination__btn--active" : ""}">${i}</a>`;
  }
  return `<div class="pagination">${buttons}</div>`;
}

function initVacanciesEvents(filters) {
  const form = document.getElementById("filters-form");
  const clearBtn = document.getElementById("clear-filters");
  const feedback = document.getElementById("vacancies-feedback");

  const showFeedback = (message, type = "info") => {
    if (!feedback) return;
    feedback.textContent = message;
    feedback.className = `th-feedback th-feedback--${type}`;
    feedback.style.display = "block";
  };

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const search = document.getElementById("filter-search")?.value || "";
      const city = document.getElementById("filter-city")?.value || "";
      const modality = document.getElementById("filter-modality")?.value || "";
      const type = document.getElementById("filter-type")?.value || "";
      const level = document.getElementById("filter-level")?.value || "";
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (city) params.set("city", city);
      if (modality) params.set("modality", modality);
      if (type) params.set("type", type);
      if (level) params.set("level", level);
      params.set("page", "1");
      const qs = params.toString();
      window.location.hash = `#/vacancies${qs ? "?" + qs : ""}`;
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      window.location.hash = "#/vacancies";
    });
  }

  document.querySelectorAll("[data-save-job]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!getAuthUiContext().isAuthenticated) {
        window.location.hash = "#/login";
        return;
      }

      btn.disabled = true;
      const original = btn.textContent;
      btn.textContent = "Guardando...";
      btn.classList.remove("btn--saved");

      try {
        await applicationService.saveJob(btn.getAttribute("data-save-job"));
        btn.textContent = "Guardado";
        btn.classList.add("btn--saved");
        showFeedback("Vacante guardada en tu lista.", "success");
      } catch (error) {
        console.error("Error saving job:", error);
        btn.disabled = false;
        btn.textContent = original;
        showFeedback(
          resolveRequestErrorMessage(
            error,
            "No se pudo guardar la vacante en este momento.",
          ),
          "error",
        );
      }
    });
  });

  document.querySelectorAll(".vacancy-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("button, a")) return;
      window.location.hash = `#/vacancies/${card.getAttribute("data-vacancy-id")}`;
    });

    card.addEventListener("keydown", (e) => {
      if (e.target !== card) return;
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      window.location.hash = `#/vacancies/${card.getAttribute("data-vacancy-id")}`;
    });
  });
}
