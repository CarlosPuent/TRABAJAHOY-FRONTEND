// Vacancy Detail Page Controller
import { vacancyService } from "@services/vacancy.service";
import { applicationService } from "@services/application.service";
import {
  getAuthUiContext,
  renderContentState,
  renderSectionHeader,
  resolveRequestErrorMessage,
  showLoading,
  renderNavbar,
  renderPage,
} from "@utils/ui.js";

export async function initVacancyDetailPage(vacancyId) {
  const app = document.getElementById("app");
  const authContext = getAuthUiContext();

  showLoading("Cargando detalle del empleo...");

  try {
    // Fetch vacancy details
    const vacancyData = await vacancyService.getVacancyById(vacancyId);

    // Handle both envelope format { data: {...} } and direct object
    const vacancy = vacancyData?.data || vacancyData;

    if (!vacancy || !vacancy.id) {
      app.innerHTML = getVacancyStateHTML(authContext, {
        title: "Empleo no encontrado",
        message: "La vacante no existe o ya no está disponible.",
      });
      return;
    }

    // Render vacancy detail
    app.innerHTML = getVacancyDetailHTML(vacancy, authContext);
    initVacancyDetailEvents(vacancy);
  } catch (error) {
    console.error("Error loading vacancy detail:", error);
    app.innerHTML = getVacancyStateHTML(authContext, {
      title: "Error al cargar el empleo",
      message: resolveRequestErrorMessage(
        error,
        "No pudimos cargar esta vacante en este momento.",
      ),
    });
  }
}

function getVacancyStateHTML(authContext, { title, message }) {
  const { isAuthenticated, user, roles, primaryRole } = authContext;
  const navbar = renderNavbar({
    activeRoute: "vacancies",
    isAuthenticated,
    user,
    roles,
    primaryRole,
  });

  const state = renderContentState({
    type: "error",
    icon: "alert",
    title,
    message,
    actionLabel: "Volver a empleos",
    actionHref: "#/vacancies",
  });

  return renderPage({
    navbar,
    main: `<div class="container" style="padding: 36px 0;">${state}</div>`,
    pageClass: "vacancy-detail-page",
  });
}

function getVacancyDetailHTML(vacancy, authContext) {
  const { isAuthenticated, user, roles, primaryRole } = authContext;
  const navbar = renderNavbar({
    activeRoute: "vacancies",
    isAuthenticated,
    user,
    roles,
    primaryRole,
  });
  const modalityLabels = {
    remote: "Remoto",
    hybrid: "Híbrido",
    onsite: "Presencial",
  };
  const typeLabels = {
    "full-time": "Tiempo completo",
    "part-time": "Medio tiempo",
    contract: "Contrato",
    freelance: "Freelance",
    internship: "Prácticas",
  };
  const levelLabels = {
    junior: "Junior",
    mid: "Mid",
    senior: "Senior",
    lead: "Lead",
    manager: "Manager",
    director: "Director",
  };
  const header = renderSectionHeader({
    title: vacancy.title || "Detalle de vacante",
    subtitle: vacancy.companyName || "Empresa",
    actions:
      '<a href="#/vacancies" class="btn btn--outline btn--sm">Volver</a>',
  });

  const mainContent = `
          <div class="container">
            ${header}
            <div class="vacancy-detail">
              <div class="vacancy-detail__main">
                <nav class="breadcrumb">
                  <a href="#/" class="breadcrumb__link">Inicio</a>
                  <span class="breadcrumb__separator">/</span>
                  <a href="#/vacancies" class="breadcrumb__link">Empleos</a>
                  <span class="breadcrumb__separator">/</span>
                  <span class="breadcrumb__current">${vacancy.title}</span>
                </nav>

                <article class="vacancy-detail__content">
                  <header class="vacancy-detail__header">
                    <div class="vacancy-detail__company-logo">
                      ${(vacancy.companyName || "C")[0]}
                    </div>
                    <div class="vacancy-detail__info">
                      <p class="vacancy-detail__company">${vacancy.companyName || "Empresa"}</p>
                      <h1 class="vacancy-detail__title">${vacancy.title}</h1>
                      <div class="vacancy-detail__meta">
                        ${
                          vacancy.city
                            ? `<span class="vacancy-detail__meta-item">
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                          </svg>
                          ${vacancy.city}${vacancy.country ? `, ${vacancy.country}` : ""}
                        </span>`
                            : ""
                        }
                        ${
                          vacancy.modality
                            ? `<span class="vacancy-detail__meta-item">
                          ${modalityLabels[vacancy.modality] || vacancy.modality}
                        </span>`
                            : ""
                        }
                        ${
                          vacancy.type
                            ? `<span class="vacancy-detail__meta-item">
                          ${typeLabels[vacancy.type] || vacancy.type}
                        </span>`
                            : ""
                        }
                        ${
                          vacancy.level
                            ? `<span class="vacancy-detail__meta-item">
                          ${levelLabels[vacancy.level] || vacancy.level}
                        </span>`
                            : ""
                        }
                      </div>
                    </div>
                  </header>

                  ${
                    vacancy.salaryMin
                      ? `
                    <div class="vacancy-detail__salary-card">
                      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                      </svg>
                      <div class="vacancy-detail__salary-info">
                        <p class="vacancy-detail__salary-label">Rango Salarial</p>
                        <p class="vacancy-detail__salary-amount">
                          $${vacancy.salaryMin.toLocaleString()} - $${vacancy.salaryMax?.toLocaleString()} ${vacancy.currency || ""}
                        </p>
                      </div>
                    </div>
                  `
                      : ""
                  }

                  <section class="vacancy-detail__section">
                    <h2 class="vacancy-detail__section-title">Descripción del puesto</h2>
                    <div class="vacancy-detail__text">
                      ${vacancy.description || '<p class="text-muted">No hay descripción disponible</p>'}
                    </div>
                  </section>

                  ${
                    vacancy.requirements
                      ? `
                    <section class="vacancy-detail__section">
                      <h2 class="vacancy-detail__section-title">Requisitos</h2>
                      <div class="vacancy-detail__text">
                        ${vacancy.requirements}
                      </div>
                    </section>
                  `
                      : ""
                  }

                  ${
                    vacancy.benefitsText
                      ? `
                    <section class="vacancy-detail__section">
                      <h2 class="vacancy-detail__section-title">Beneficios</h2>
                      <div class="vacancy-detail__text">
                        ${vacancy.benefitsText}
                      </div>
                    </section>
                  `
                      : ""
                  }

                  ${
                    vacancy.openings
                      ? `
                    <section class="vacancy-detail__section">
                      <h2 class="vacancy-detail__section-title">Información adicional</h2>
                      <div class="vacancy-detail__additional">
                        <div class="additional-item">
                          <span class="additional-label">Vacantes disponibles:</span>
                          <span class="additional-value">${vacancy.openings}</span>
                        </div>
                        ${
                          vacancy.applicationDeadline
                            ? `
                          <div class="additional-item">
                            <span class="additional-label">Fecha límite:</span>
                            <span class="additional-value">${new Date(vacancy.applicationDeadline).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}</span>
                          </div>
                        `
                            : ""
                        }
                      </div>
                    </section>
                  `
                      : ""
                  }
                </article>
              </div>

              <aside class="vacancy-detail__sidebar">
                <div class="vacancy-detail__apply-card">
                  <h3 class="vacancy-detail__apply-title">¿Te interesa este puesto?</h3>
                  <p class="vacancy-detail__apply-text">
                    ${
                      isAuthenticated
                        ? "Envía tu solicitud ahora y destaca ante la empresa."
                        : "Necesitas una cuenta para aplicar a este empleo."
                    }
                  </p>
                  <div class="vacancy-detail__apply-actions">
                    ${
                      isAuthenticated
                        ? `<button class="btn btn--primary btn--full-width" id="apply-btn">Aplicar ahora</button>
                         <button class="btn btn--outline btn--full-width" id="save-job-btn">Guardar empleo</button>
                         <p class="vacancy-detail__feedback" id="vacancy-feedback" role="status" aria-live="polite"></p>`
                        : `<a href="#/login" class="btn btn--primary btn--full-width">Iniciar sesión para aplicar</a>
                         <a href="#/register" class="btn btn--outline btn--full-width">Crear cuenta</a>`
                    }
                  </div>
                </div>

                <div class="vacancy-detail__summary-card">
                  <h3 class="vacancy-detail__summary-title">Resumen del empleo</h3>
                  <ul class="vacancy-detail__summary-list">
                    ${
                      vacancy.companyName
                        ? `
                      <li class="summary-item">
                        <span class="summary-item__label">Empresa</span>
                        <span class="summary-item__value">${vacancy.companyName}</span>
                      </li>
                    `
                        : ""
                    }
                    ${
                      vacancy.type
                        ? `
                      <li class="summary-item">
                        <span class="summary-item__label">Tipo</span>
                        <span class="summary-item__value">${typeLabels[vacancy.type] || vacancy.type}</span>
                      </li>
                    `
                        : ""
                    }
                    ${
                      vacancy.modality
                        ? `
                      <li class="summary-item">
                        <span class="summary-item__label">Modalidad</span>
                        <span class="summary-item__value">${modalityLabels[vacancy.modality] || vacancy.modality}</span>
                      </li>
                    `
                        : ""
                    }
                    ${
                      vacancy.level
                        ? `
                      <li class="summary-item">
                        <span class="summary-item__label">Nivel</span>
                        <span class="summary-item__value">${levelLabels[vacancy.level] || vacancy.level}</span>
                      </li>
                    `
                        : ""
                    }
                    ${
                      vacancy.city
                        ? `
                      <li class="summary-item">
                        <span class="summary-item__label">Ubicación</span>
                        <span class="summary-item__value">${vacancy.city}${vacancy.country ? `, ${vacancy.country}` : ""}</span>
                      </li>
                    `
                        : ""
                    }
                  </ul>
                </div>
              </aside>
            </div>
          </div>
  `;

  const modalHTML = `
        <!-- Apply Modal -->
        <div class="modal-overlay" id="apply-modal" style="display: none;">
          <div class="modal">
            <div class="modal__header">
              <h3 class="modal__title">Aplicar a ${vacancy.title}</h3>
              <button class="modal__close" id="close-modal">&times;</button>
            </div>
            <form class="modal__form" id="apply-form">
              <div class="form-group">
                <label class="form-label" for="cover-letter">Carta de presentación (opcional)</label>
                <textarea 
                  id="cover-letter" 
                  class="form-textarea" 
                  rows="6" 
                  placeholder="Cuéntanos por qué te interesa este puesto..."
                ></textarea>
              </div>
              <div class="modal__actions">
                <button type="button" class="btn btn--outline" id="cancel-apply">Cancelar</button>
                <button type="submit" class="btn btn--primary" id="submit-apply">Enviar solicitud</button>
              </div>
            </form>
          </div>
        </div>
  `;

  const styles = `
          .vacancy-detail-page { min-height: calc(100vh - 70px); padding: 32px 0; background: #f9fafb; }
          .breadcrumb { display: flex; align-items: center; gap: 8px; margin-bottom: 24px; font-size: 14px; }
          .breadcrumb__link { color: #6b7280; text-decoration: none; }
          .breadcrumb__link:hover { color: #111827; }
          .breadcrumb__separator { color: #d1d5db; }
          .breadcrumb__current { color: #374151; font-weight: 500; }
          .vacancy-detail { display: grid; grid-template-columns: 1fr 320px; gap: 32px; }
          .vacancy-detail__content { background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .vacancy-detail__header { display: flex; gap: 24px; margin-bottom: 32px; padding-bottom: 32px; border-bottom: 1px solid #e5e7eb; }
          .vacancy-detail__company-logo {
            width: 80px; height: 80px; border-radius: 16px; background: #f3f4f6;
            display: flex; align-items: center; justify-content: center; font-weight: 600;
            color: #6b7280; font-size: 36px; flex-shrink: 0;
          }
          .vacancy-detail__company { font-size: 16px; color: #6b7280; margin: 0 0 8px; }
          .vacancy-detail__title { font-size: 28px; font-weight: 700; color: #111827; margin: 0 0 16px; }
          .vacancy-detail__meta { display: flex; flex-wrap: wrap; gap: 16px; }
          .vacancy-detail__meta-item { display: flex; align-items: center; gap: 6px; font-size: 14px; color: #6b7280; }
          .vacancy-detail__salary-card {
            display: flex; align-items: center; gap: 16px; padding: 20px;
            background: #f0fdf4; border-radius: 12px; margin-bottom: 32px;
          }
          .vacancy-detail__salary-card svg { color: #10b981; }
          .vacancy-detail__salary-label { font-size: 14px; color: #6b7280; margin: 0 0 4px; }
          .vacancy-detail__salary-amount { font-size: 20px; font-weight: 700; color: #10b981; margin: 0; }
          .vacancy-detail__section { margin-bottom: 32px; }
          .vacancy-detail__section-title {
            font-size: 20px; font-weight: 600; color: #111827; margin: 0 0 16px;
            padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;
          }
          .vacancy-detail__text { color: #374151; line-height: 1.7; }
          .vacancy-detail__text p { margin: 0 0 16px; }
          .vacancy-detail__additional { display: grid; gap: 16px; }
          .additional-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
          .additional-label { color: #6b7280; }
          .additional-value { font-weight: 500; color: #111827; }
          .vacancy-detail__sidebar { display: flex; flex-direction: column; gap: 20px; position: sticky; top: 92px; align-self: start; }
          .vacancy-detail__apply-card {
            background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .vacancy-detail__apply-title { font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 12px; }
          .vacancy-detail__apply-text { color: #6b7280; margin: 0 0 20px; font-size: 14px; }
          .vacancy-detail__apply-actions { display: flex; flex-direction: column; gap: 12px; }
          .vacancy-detail__feedback { margin: 2px 0 0; font-size: 13px; color: #475569; min-height: 18px; }
          .vacancy-detail__feedback--success { color: #166534; }
          .vacancy-detail__feedback--error { color: #b91c1c; }
          .vacancy-detail__apply-actions .btn[disabled] { opacity: 0.9; cursor: not-allowed; }
          .vacancy-detail__summary-card {
            background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .vacancy-detail__summary-title { font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 16px; }
          .vacancy-detail__summary-list { list-style: none; padding: 0; margin: 0; }
          .summary-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
          .summary-item__label { color: #6b7280; font-size: 14px; }
          .summary-item__value { font-weight: 500; color: #111827; font-size: 14px; }
          .modal-overlay {
            position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex;
            align-items: center; justify-content: center; z-index: 1000; padding: 20px;
          }
          .modal {
            background: white; border-radius: 12px; max-width: 600px; width: 100%;
            max-height: 90vh; overflow-y: auto;
          }
          .modal__header { display: flex; justify-content: space-between; align-items: center; padding: 24px; border-bottom: 1px solid #e5e7eb; }
          .modal__title { font-size: 20px; font-weight: 600; margin: 0; }
          .modal__close {
            background: none; border: none; font-size: 32px; color: #6b7280; cursor: pointer;
            padding: 0; width: 32px; height: 32px;
          }
          .modal__close:hover { color: #111827; }
          .modal__form { padding: 24px; }
          .form-group { margin-bottom: 20px; }
          .form-label { display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; }
          .form-textarea {
            width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px;
            font-size: 14px; font-family: inherit; resize: vertical;
          }
          .form-textarea:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
          .modal__actions { display: flex; gap: 12px; justify-content: flex-end; }
          .text-muted { color: #9ca3af; font-style: italic; }
          @media (max-width: 1024px) {
            .vacancy-detail { grid-template-columns: 1fr; }
            .vacancy-detail__sidebar { order: -1; }
            .vacancy-detail__sidebar { position: static; }
          }
          @media (max-width: 768px) {
            .vacancy-detail__header { flex-direction: column; }
            .modal__actions { flex-direction: column-reverse; }
            .modal__actions .btn { width: 100%; }
          }
  `;

  return renderPage({
    navbar,
    main: mainContent + modalHTML,
    pageClass: "vacancy-detail-page",
    extraStyles: styles,
  });
}

function initVacancyDetailEvents(vacancy) {
  const applyBtn = document.getElementById("apply-btn");
  const saveJobBtn = document.getElementById("save-job-btn");
  const feedback = document.getElementById("vacancy-feedback");
  const applyModal = document.getElementById("apply-modal");
  const closeModal = document.getElementById("close-modal");
  const cancelApply = document.getElementById("cancel-apply");
  const applyForm = document.getElementById("apply-form");
  const submitApply = document.getElementById("submit-apply");

  const setFeedback = (message = "", type = "info") => {
    if (!feedback) return;
    feedback.textContent = message;
    feedback.className = `vacancy-detail__feedback${
      type === "success"
        ? " vacancy-detail__feedback--success"
        : type === "error"
          ? " vacancy-detail__feedback--error"
          : ""
    }`;
  };

  // Apply button - Show modal
  if (applyBtn) {
    applyBtn.addEventListener("click", () => {
      applyModal.style.display = "flex";
    });
  }

  // Save job button
  if (saveJobBtn) {
    saveJobBtn.addEventListener("click", async () => {
      saveJobBtn.disabled = true;
      const original = saveJobBtn.textContent;
      saveJobBtn.textContent = "Guardando...";
      setFeedback("");
      try {
        await applicationService.saveJob(vacancy.id);
        saveJobBtn.textContent = "✓ Guardado";
        setFeedback("Vacante guardada en tu lista.", "success");
      } catch (error) {
        console.error("Error saving job:", error);
        saveJobBtn.disabled = false;
        saveJobBtn.textContent = original;
        setFeedback("No se pudo guardar el empleo.", "error");
      }
    });
  }

  // Close modal
  if (closeModal) {
    closeModal.addEventListener("click", () => {
      applyModal.style.display = "none";
    });
  }

  if (cancelApply) {
    cancelApply.addEventListener("click", () => {
      applyModal.style.display = "none";
    });
  }

  // Click outside modal to close
  if (applyModal) {
    applyModal.addEventListener("click", (e) => {
      if (e.target === applyModal) {
        applyModal.style.display = "none";
      }
    });
  }

  // Submit application
  if (applyForm) {
    applyForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const coverLetter = document.getElementById("cover-letter")?.value || "";

      // Disable submit button
      submitApply.disabled = true;
      submitApply.setAttribute("aria-busy", "true");
      submitApply.textContent = "Enviando...";
      setFeedback("");

      try {
        await applicationService.applyToVacancy({
          vacancyId: vacancy.id,
          coverLetter,
        });

        // Success - redirect to dashboard
        window.location.hash = "#/candidate/dashboard";
      } catch (error) {
        console.error("Error applying to vacancy:", error);
        submitApply.disabled = false;
        submitApply.setAttribute("aria-busy", "false");
        submitApply.textContent = "Enviar solicitud";
        setFeedback(
          resolveRequestErrorMessage(error, "No se pudo enviar la solicitud."),
          "error",
        );
      }
    });
  }
}
