import { config } from "@core/config";
import { store } from "@core/store";
import { authService } from "@services/auth.service";
import { companyService } from "@services/company.service";
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

const VACANCY_TYPES = [
  { value: "full-time", label: "Tiempo completo" },
  { value: "part-time", label: "Medio tiempo" },
  { value: "contract", label: "Contrato" },
  { value: "freelance", label: "Freelance" },
  { value: "internship", label: "Practicas" },
];

const VACANCY_MODALITIES = [
  { value: "remote", label: "Remoto" },
  { value: "hybrid", label: "Hibrido" },
  { value: "onsite", label: "Presencial" },
];

const VACANCY_LEVELS = [
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
  { value: "manager", label: "Manager" },
  { value: "director", label: "Director" },
];

const VACANCY_STATUSES = [
  { value: "draft", label: "Borrador" },
  { value: "published", label: "Publicada" },
  { value: "closed", label: "Cerrada" },
  { value: "archived", label: "Archivada" },
];

function normalizeArray(input) {
  if (Array.isArray(input)) return input;
  if (Array.isArray(input?.data)) return input.data;
  if (Array.isArray(input?.items)) return input.items;
  return [];
}

function sanitizeCompanyOption(value, name = "") {
  const id = String(value || "").trim();
  if (!id) return null;
  return {
    id,
    name: String(name || "").trim(),
  };
}

function upsertCompanyOption(map, value, name = "") {
  const option = sanitizeCompanyOption(value, name);
  if (!option) return;

  const existing = map.get(option.id);
  if (!existing) {
    map.set(option.id, option);
    return;
  }

  if (!existing.name && option.name) {
    map.set(option.id, option);
  }
}

function extractMembershipCompanyInfo(membership = {}) {
  if (!membership || typeof membership !== "object") {
    return { id: "", name: "" };
  }

  const company =
    membership.company && typeof membership.company === "object"
      ? membership.company
      : null;

  const id =
    membership.companyId ||
    membership.company_id ||
    company?.id ||
    company?.companyId ||
    company?.company_id ||
    "";

  const name =
    membership.companyName ||
    membership.company_name ||
    company?.name ||
    company?.companyName ||
    company?.company_name ||
    company?.legalName ||
    "";

  return {
    id: String(id || "").trim(),
    name: String(name || "").trim(),
  };
}

function collectCompanyOptionsFromUser(user) {
  const optionsMap = new Map();
  if (!user || typeof user !== "object") {
    return [];
  }

  upsertCompanyOption(optionsMap, user.company_id, user.company_name);
  upsertCompanyOption(optionsMap, user.companyId, user.companyName);
  upsertCompanyOption(optionsMap, user.company?.id, user.company?.name);
  upsertCompanyOption(
    optionsMap,
    user.company?.company_id,
    user.company?.company_name,
  );
  upsertCompanyOption(
    optionsMap,
    user.company?.companyId,
    user.company?.companyName || user.company?.name,
  );
  upsertCompanyOption(
    optionsMap,
    user.recruiter_profile?.company_id,
    user.recruiter_profile?.company_name,
  );
  upsertCompanyOption(
    optionsMap,
    user.recruiterProfile?.companyId,
    user.recruiterProfile?.companyName,
  );
  upsertCompanyOption(
    optionsMap,
    user.recruiter?.companyId,
    user.recruiter?.companyName,
  );
  upsertCompanyOption(
    optionsMap,
    user.membership?.companyId,
    user.membership?.companyName,
  );
  upsertCompanyOption(
    optionsMap,
    user.companyMembership?.companyId,
    user.companyMembership?.companyName,
  );

  if (Array.isArray(user.companies)) {
    user.companies.forEach((company) => {
      upsertCompanyOption(
        optionsMap,
        company?.id || company?.companyId || company?.company_id,
        company?.name || company?.companyName || company?.company_name,
      );
    });
  }

  const companyMemberArrays = [user.companyMembers, user.company_members];
  companyMemberArrays.forEach((items) => {
    if (!Array.isArray(items)) return;
    items.forEach((member) => {
      const { id, name } = extractMembershipCompanyInfo(member);
      upsertCompanyOption(optionsMap, id, name);
    });
  });

  const membershipArrays = [
    user.companyMemberships,
    user.company_memberships,
    user.memberships,
    user.recruiterMemberships,
    user.recruiter_memberships,
  ];
  membershipArrays.forEach((items) => {
    if (!Array.isArray(items)) return;
    items.forEach((membership) => {
      const { id, name } = extractMembershipCompanyInfo(membership);
      upsertCompanyOption(optionsMap, id, name);
    });
  });

  return [...optionsMap.values()];
}

function getOptionValues(options = []) {
  return options.map((item) => item.value);
}

async function enrichCompanyOptionsWithNames(options = []) {
  const unresolved = options.filter((item) => !item.name);
  if (unresolved.length === 0) {
    return options;
  }

  const resolvedNames = await Promise.all(
    unresolved.map(async (option) => {
      try {
        const result = await companyService.getCompanyById(option.id);
        const company = result?.data || result;
        return {
          ...option,
          name: String(company?.name || "").trim(),
        };
      } catch {
        return option;
      }
    }),
  );

  const namesById = new Map(resolvedNames.map((item) => [item.id, item.name]));
  return options.map((option) => ({
    ...option,
    name: namesById.get(option.id) || option.name,
  }));
}

async function resolveCompanySelectionContext() {
  const mergeMap = new Map();

  const stateUser = store.get("user");
  collectCompanyOptionsFromUser(stateUser).forEach((company) => {
    upsertCompanyOption(mergeMap, company.id, company.name);
  });

  try {
    const profile = await authService.fetchCurrentUserProfile();
    collectCompanyOptionsFromUser(profile?.user).forEach((company) => {
      upsertCompanyOption(mergeMap, company.id, company.name);
    });
  } catch (error) {
    console.warn(
      "No se pudo refrescar el perfil para resolver empresas:",
      error,
    );
  }

  const mergedOptions = await enrichCompanyOptionsWithNames([
    ...mergeMap.values(),
  ]);

  const options = mergedOptions.map((option, index) => ({
    id: option.id,
    label: option.name || `Empresa asociada ${index + 1}`,
  }));

  const selectedCompanyId = options.length === 1 ? options[0].id : "";

  return {
    options,
    selectedCompanyId,
    requiresSelection: options.length > 1,
    hasCompanyContext: options.length > 0,
  };
}

async function resolveCategoryOptions() {
  try {
    const categoriesResponse = await vacancyService.getCategories();
    const categories = normalizeArray(categoriesResponse);
    return categories
      .map((category) => {
        const id = String(category?.id || category?.categoryId || "").trim();
        const name = String(category?.name || category?.title || "").trim();
        if (!id || !name) return null;
        return { id, label: name };
      })
      .filter(Boolean);
  } catch (error) {
    console.warn("No se pudieron cargar las categorias:", error);
    return [];
  }
}

function resolveVacancyCompanyInfo(vacancy = {}) {
  const company =
    vacancy.company && typeof vacancy.company === "object"
      ? vacancy.company
      : null;

  const id =
    vacancy.companyId ||
    vacancy.company_id ||
    company?.id ||
    company?.companyId ||
    company?.company_id ||
    "";

  const name =
    vacancy.companyName ||
    vacancy.company_name ||
    company?.name ||
    company?.companyName ||
    company?.company_name ||
    "";

  return {
    id: String(id || "").trim(),
    name: String(name || "").trim(),
  };
}

function ensureVacancyCompanyOption(companyContext, vacancy) {
  const { id, name } = resolveVacancyCompanyInfo(vacancy);
  if (!id) {
    return companyContext;
  }

  const hasOption = companyContext.options.some(
    (option) => String(option.id) === String(id),
  );

  if (hasOption) {
    return companyContext;
  }

  const options = [
    ...companyContext.options,
    {
      id,
      label: name || "Empresa de la vacante",
    },
  ];

  return {
    ...companyContext,
    options,
    hasCompanyContext: options.length > 0,
    requiresSelection: options.length > 1,
  };
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

function parseOptionalNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function toDateInputValue(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (isIsoDate(raw)) return raw;

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderOptionList(options, selectedValue = "", includeEmpty = "") {
  const emptyOption = includeEmpty
    ? `<option value="">${escapeHtml(includeEmpty)}</option>`
    : "";

  return `${emptyOption}${options
    .map(
      (item) =>
        `<option value="${escapeHtml(item.value)}" ${String(selectedValue) === String(item.value) ? "selected" : ""}>${escapeHtml(item.label)}</option>`,
    )
    .join("")}`;
}

function getEditVacancyHTML(authContext, options = {}) {
  const { isAuthenticated, user, roles, primaryRole } = authContext;
  const {
    vacancy,
    companyOptions = [],
    selectedCompanyId = "",
    requiresCompanySelection = false,
    hasCompanyContext = false,
    categoryOptions = [],
  } = options;

  const canSubmit = Boolean(hasCompanyContext && vacancy?.id);

  const companyFieldHtml = !hasCompanyContext
    ? `
      <div class="vacancy-field vacancy-field--full">
        <label>Empresa *</label>
        <div class="vacancy-field__info vacancy-field__info--error">
          No se pudo resolver una empresa asociada a tu cuenta. Completa primero tu flujo de empresa o vuelve a iniciar sesion.
        </div>
      </div>
    `
    : requiresCompanySelection
      ? `
      <div class="vacancy-field vacancy-field--full">
        <label for="vacancy-company">Empresa *</label>
        <select id="vacancy-company" name="companyId" required>
          <option value="">Selecciona una empresa</option>
          ${companyOptions
            .map(
              (company) =>
                `<option value="${escapeHtml(company.id)}" ${String(selectedCompanyId) === String(company.id) ? "selected" : ""}>${escapeHtml(company.label)}</option>`,
            )
            .join("")}
        </select>
        <small>La vacante se guardara en la empresa seleccionada.</small>
      </div>
    `
      : `
      <div class="vacancy-field vacancy-field--full">
        <label>Empresa *</label>
        <div class="vacancy-field__info">${escapeHtml(companyOptions[0]?.label || "Empresa asociada")}</div>
        <small>Se usara automaticamente la empresa asociada a tu cuenta.</small>
      </div>
    `;

  const navbar = renderNavbar({
    activeRoute: config.ROUTES.MY_VACANCIES,
    isAuthenticated,
    user,
    roles,
    primaryRole,
  });

  const content = `
    <form class="vacancy-create-form" id="edit-vacancy-form" novalidate>
      <p class="th-feedback th-feedback--error" id="edit-vacancy-error" style="display:none;"></p>
      <p class="th-feedback th-feedback--success" id="edit-vacancy-success" style="display:none;"></p>

      <div class="vacancy-create-grid">
        ${companyFieldHtml}

        <div class="vacancy-field">
          <label for="vacancy-status">Estado *</label>
          <select id="vacancy-status" name="status" required>
            ${renderOptionList(VACANCY_STATUSES, vacancy.status)}
          </select>
        </div>

        <div class="vacancy-field vacancy-field--full">
          <label for="vacancy-title">Titulo *</label>
          <input id="vacancy-title" name="title" type="text" required maxlength="160" value="${escapeHtml(vacancy.title)}" />
        </div>

        <div class="vacancy-field vacancy-field--full">
          <label for="vacancy-description">Descripcion *</label>
          <textarea id="vacancy-description" name="description" rows="5" required>${escapeHtml(vacancy.description)}</textarea>
        </div>

        <div class="vacancy-field vacancy-field--full">
          <label for="vacancy-requirements">Requisitos *</label>
          <textarea id="vacancy-requirements" name="requirements" rows="4" required>${escapeHtml(vacancy.requirements)}</textarea>
        </div>

        <div class="vacancy-field">
          <label for="vacancy-country">Pais *</label>
          <input id="vacancy-country" name="country" type="text" required maxlength="120" value="${escapeHtml(vacancy.country)}" />
        </div>

        <div class="vacancy-field">
          <label for="vacancy-city">Ciudad *</label>
          <input id="vacancy-city" name="city" type="text" required maxlength="120" value="${escapeHtml(vacancy.city)}" />
        </div>

        <div class="vacancy-field">
          <label for="vacancy-category-id">Categoria</label>
          <select id="vacancy-category-id" name="categoryId">
            <option value="">Sin categoria</option>
            ${categoryOptions
              .map(
                (category) =>
                  `<option value="${escapeHtml(category.id)}" ${String(vacancy.categoryId || "") === String(category.id) ? "selected" : ""}>${escapeHtml(category.label)}</option>`,
              )
              .join("")}
          </select>
          ${
            categoryOptions.length === 0
              ? "<small>No hay categorias disponibles por ahora. Puedes guardar la vacante sin categoria.</small>"
              : ""
          }
        </div>

        <div class="vacancy-field">
          <label for="vacancy-modality">Modalidad</label>
          <select id="vacancy-modality" name="modality">
            ${renderOptionList(VACANCY_MODALITIES, vacancy.modality, "(sin definir)")}
          </select>
        </div>

        <div class="vacancy-field">
          <label for="vacancy-level">Nivel</label>
          <select id="vacancy-level" name="level">
            ${renderOptionList(VACANCY_LEVELS, vacancy.level, "(sin definir)")}
          </select>
        </div>

        <div class="vacancy-field">
          <label for="vacancy-type">Tipo</label>
          <select id="vacancy-type" name="type">
            ${renderOptionList(VACANCY_TYPES, vacancy.type, "(sin definir)")}
          </select>
        </div>

        <div class="vacancy-field">
          <label for="vacancy-salary-min">Salario minimo</label>
          <input id="vacancy-salary-min" name="salaryMin" type="number" min="0" step="1" value="${escapeHtml(vacancy.salaryMin)}" />
        </div>

        <div class="vacancy-field">
          <label for="vacancy-salary-max">Salario maximo</label>
          <input id="vacancy-salary-max" name="salaryMax" type="number" min="0" step="1" value="${escapeHtml(vacancy.salaryMax)}" />
        </div>

        <div class="vacancy-field">
          <label for="vacancy-application-deadline">Fecha limite</label>
          <input id="vacancy-application-deadline" name="applicationDeadline" type="date" value="${escapeHtml(toDateInputValue(vacancy.applicationDeadline))}" />
        </div>

        <div class="vacancy-field">
          <label for="vacancy-openings">Vacantes</label>
          <input id="vacancy-openings" name="openings" type="number" min="1" step="1" value="${escapeHtml(vacancy.openings)}" />
        </div>
      </div>

      <div class="vacancy-create-actions">
        <button type="submit" class="btn btn--primary" id="edit-vacancy-submit" ${canSubmit ? "" : "disabled"}>Guardar cambios</button>
        <a href="#${config.ROUTES.MY_VACANCIES}" class="btn btn--outline">Cancelar</a>
      </div>
    </form>
  `;

  const shell = renderRoleShell({
    title: "Editar vacante",
    subtitle: "Actualiza los datos de la vacante seleccionada.",
    roles,
    primaryRole,
    content,
    actions: `<a href="#${config.ROUTES.MY_VACANCIES}" class="btn btn--outline btn--sm">Volver a mis vacantes</a>`,
    shellClass: "vacancy-create-shell",
  });

  const extraStyles = `
    .vacancy-create-page {
      min-height: calc(100vh - 70px);
      background: #f8fafc;
      padding: 28px 0;
    }
    .vacancy-create-shell .role-shell__content {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 20px;
    }
    .vacancy-create-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .vacancy-create-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }
    .vacancy-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .vacancy-field--full {
      grid-column: 1 / -1;
    }
    .vacancy-field label {
      font-size: 13px;
      font-weight: 600;
      color: #0f172a;
    }
    .vacancy-field input,
    .vacancy-field select,
    .vacancy-field textarea {
      width: 100%;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 10px 12px;
      font: inherit;
      background: #fff;
      color: #0f172a;
    }
    .vacancy-field textarea {
      resize: vertical;
      min-height: 120px;
    }
    .vacancy-field input:focus,
    .vacancy-field select:focus,
    .vacancy-field textarea:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.14);
    }
    .vacancy-field small {
      font-size: 12px;
      color: #475569;
    }
    .vacancy-field__info {
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      min-height: 42px;
      display: flex;
      align-items: center;
      padding: 10px 12px;
      background: #f8fafc;
      color: #0f172a;
      font-size: 14px;
      font-weight: 500;
    }
    .vacancy-field__info--error {
      border-color: #fecaca;
      background: #fef2f2;
      color: #991b1b;
      font-weight: 500;
    }
    .vacancy-create-actions {
      display: flex;
      justify-content: flex-start;
      gap: 10px;
      margin-top: 8px;
    }
    .vacancy-create-form.is-submitting {
      opacity: 0.82;
      pointer-events: none;
    }
    @media (max-width: 900px) {
      .vacancy-create-grid {
        grid-template-columns: 1fr;
      }
    }
  `;

  return renderPage({
    navbar,
    main: `<div class="container">${shell}</div>`,
    pageClass: "vacancy-create-page",
    extraStyles,
  });
}

function validateEditVacancyForm(formData) {
  const companyId = String(formData.get("companyId") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const requirements = String(formData.get("requirements") || "").trim();
  const country = String(formData.get("country") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const status = String(formData.get("status") || "").trim();

  if (
    !companyId ||
    !title ||
    !description ||
    !requirements ||
    !country ||
    !city
  ) {
    throw new Error("Completa todos los campos obligatorios.");
  }

  if (!getOptionValues(VACANCY_STATUSES).includes(status)) {
    throw new Error("El estado seleccionado no es valido.");
  }

  const salaryMin = parseOptionalNumber(formData.get("salaryMin"));
  const salaryMax = parseOptionalNumber(formData.get("salaryMax"));

  if (salaryMin !== null && (Number.isNaN(salaryMin) || salaryMin < 0)) {
    throw new Error("salaryMin debe ser un numero mayor o igual a 0.");
  }

  if (salaryMax !== null && (Number.isNaN(salaryMax) || salaryMax < 0)) {
    throw new Error("salaryMax debe ser un numero mayor o igual a 0.");
  }

  if (salaryMin !== null && salaryMax !== null && salaryMax < salaryMin) {
    throw new Error("salaryMax debe ser mayor o igual que salaryMin.");
  }

  const openingsRaw = formData.get("openings");
  const openings = parseOptionalNumber(openingsRaw);
  if (
    openingsRaw !== "" &&
    openings !== null &&
    (Number.isNaN(openings) || !Number.isInteger(openings) || openings < 1)
  ) {
    throw new Error("openings debe ser un entero mayor o igual a 1.");
  }

  const applicationDeadline = String(
    formData.get("applicationDeadline") || "",
  ).trim();
  if (applicationDeadline && !isIsoDate(applicationDeadline)) {
    throw new Error("applicationDeadline debe tener formato YYYY-MM-DD.");
  }

  const type = String(formData.get("type") || "").trim();
  const modality = String(formData.get("modality") || "").trim();
  const level = String(formData.get("level") || "").trim();

  if (type && !getOptionValues(VACANCY_TYPES).includes(type)) {
    throw new Error("type tiene un valor no permitido.");
  }

  if (modality && !getOptionValues(VACANCY_MODALITIES).includes(modality)) {
    throw new Error("modality tiene un valor no permitido.");
  }

  if (level && !getOptionValues(VACANCY_LEVELS).includes(level)) {
    throw new Error("level tiene un valor no permitido.");
  }

  const payload = {
    title,
    description,
    requirements,
    country,
    city,
    status,
  };

  const categoryId = String(formData.get("categoryId") || "").trim();
  if (categoryId) payload.categoryId = categoryId;
  if (type) payload.type = type;
  if (modality) payload.modality = modality;
  if (level) payload.level = level;
  if (salaryMin !== null) payload.salaryMin = salaryMin;
  if (salaryMax !== null) payload.salaryMax = salaryMax;
  if (applicationDeadline) payload.applicationDeadline = applicationDeadline;
  if (openings !== null && !Number.isNaN(openings)) payload.openings = openings;

  return payload;
}

function setFeedback(errorEl, successEl, { error = "", success = "" } = {}) {
  if (errorEl) {
    if (error) {
      errorEl.textContent = error;
      errorEl.style.display = "block";
    } else {
      errorEl.textContent = "";
      errorEl.style.display = "none";
    }
  }

  if (successEl) {
    if (success) {
      successEl.textContent = success;
      successEl.style.display = "block";
    } else {
      successEl.textContent = "";
      successEl.style.display = "none";
    }
  }
}

function setSubmitting(form, submitBtn, isSubmitting) {
  if (form) {
    form.classList.toggle("is-submitting", isSubmitting);
  }

  if (submitBtn) {
    submitBtn.disabled = isSubmitting;
    submitBtn.setAttribute("aria-busy", String(isSubmitting));
    submitBtn.textContent = isSubmitting ? "Guardando..." : "Guardar cambios";
  }
}

function normalizeVacancyForForm(vacancy = {}) {
  return {
    id: vacancy.id || "",
    companyId: String(vacancy.companyId || vacancy.company_id || "").trim(),
    title: String(vacancy.title || "").trim(),
    description: String(vacancy.description || "").trim(),
    requirements: String(vacancy.requirements || "").trim(),
    country: String(vacancy.country || "").trim(),
    city: String(vacancy.city || "").trim(),
    categoryId: String(vacancy.categoryId || vacancy.category_id || "").trim(),
    modality: String(vacancy.modality || "").trim(),
    level: String(vacancy.level || "").trim(),
    type: String(vacancy.type || "").trim(),
    salaryMin: vacancy.salaryMin ?? vacancy.salary_min ?? "",
    salaryMax: vacancy.salaryMax ?? vacancy.salary_max ?? "",
    applicationDeadline:
      vacancy.applicationDeadline ?? vacancy.application_deadline ?? "",
    openings: vacancy.openings ?? "",
    status: String(vacancy.status || "draft").trim() || "draft",
  };
}

function resolveVacancyIdFromRoute(vacancyIdOrParams) {
  if (
    vacancyIdOrParams &&
    typeof vacancyIdOrParams === "object" &&
    !Array.isArray(vacancyIdOrParams)
  ) {
    return String(vacancyIdOrParams.id || "").trim();
  }

  return String(vacancyIdOrParams || "").trim();
}

export async function initEditVacancyPage(vacancyIdOrParams) {
  const app = document.getElementById("app");
  const authContext = getAuthUiContext();
  const vacancyId = resolveVacancyIdFromRoute(vacancyIdOrParams);

  if (!vacancyId) {
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
      title: "Vacante no valida",
      message: "No se encontro un identificador para editar la vacante.",
      actionLabel: "Volver a mis vacantes",
      actionHref: `#${config.ROUTES.MY_VACANCIES}`,
    });

    app.innerHTML = renderPage({
      navbar,
      main: `<div class="container" style="padding: 32px 0;">${state}</div>`,
      pageClass: "vacancy-create-page",
    });
    return;
  }

  showLoading("Cargando vacante para edicion...");

  try {
    const vacancyResult = await vacancyService.getVacancyManage(vacancyId);
    const managedVacancy = vacancyResult?.data || vacancyResult || {};
    const vacancy = normalizeVacancyForForm(managedVacancy);

    const [rawCompanyContext, categoryOptions] = await Promise.all([
      resolveCompanySelectionContext(),
      resolveCategoryOptions(),
    ]);

    const companyContext = ensureVacancyCompanyOption(rawCompanyContext, {
      ...managedVacancy,
      companyId: vacancy.companyId,
    });

    const selectedCompanyId =
      vacancy.companyId ||
      companyContext.selectedCompanyId ||
      companyContext.options[0]?.id ||
      "";

    app.innerHTML = getEditVacancyHTML(authContext, {
      vacancy,
      companyOptions: companyContext.options,
      selectedCompanyId,
      requiresCompanySelection: companyContext.requiresSelection,
      hasCompanyContext: companyContext.hasCompanyContext,
      categoryOptions,
    });

    const form = document.getElementById("edit-vacancy-form");
    const companySelect = document.getElementById("vacancy-company");
    const submitBtn = document.getElementById("edit-vacancy-submit");
    const errorEl = document.getElementById("edit-vacancy-error");
    const successEl = document.getElementById("edit-vacancy-success");

    if (!form) {
      return;
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      setFeedback(errorEl, successEl);

      const selectedCompanyValue = companySelect
        ? String(companySelect.value || "").trim()
        : String(selectedCompanyId || "").trim();

      if (!selectedCompanyValue) {
        setFeedback(errorEl, successEl, {
          error: "Selecciona una empresa valida para guardar la vacante.",
        });
        return;
      }

      const formData = new FormData(form);
      formData.set("companyId", selectedCompanyValue);

      let payload;
      try {
        payload = validateEditVacancyForm(formData);
      } catch (error) {
        setFeedback(errorEl, successEl, { error: error.message });
        return;
      }

      setSubmitting(form, submitBtn, true);

      try {
        await vacancyService.updateVacancy(vacancyId, payload);
        setFeedback(errorEl, successEl, {
          success: "Vacante actualizada correctamente. Redirigiendo...",
        });

        window.setTimeout(() => {
          window.location.hash = `#${config.ROUTES.MY_VACANCIES}`;
        }, 1200);
      } catch (error) {
        setFeedback(errorEl, successEl, {
          error: resolveRequestErrorMessage(
            error,
            "No se pudo actualizar la vacante. Verifica los datos e intenta nuevamente.",
          ),
        });
        setSubmitting(form, submitBtn, false);
      }
    });
  } catch (error) {
    console.error("Error loading vacancy to edit:", error);

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
      title: "No se pudo cargar la vacante",
      message: resolveRequestErrorMessage(
        error,
        "Intenta nuevamente en unos segundos.",
      ),
      actionLabel: "Volver a mis vacantes",
      actionHref: `#${config.ROUTES.MY_VACANCIES}`,
    });

    app.innerHTML = renderPage({
      navbar,
      main: `<div class="container" style="padding: 32px 0;">${state}</div>`,
      pageClass: "vacancy-create-page",
    });
  }
}
