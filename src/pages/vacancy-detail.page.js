// Vacancy Detail Page Controller - Updated
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
    // 1. Obtener detalles de la vacante
    const vacancyData = await vacancyService.getVacancyById(vacancyId);
    const vacancy = vacancyData?.data || vacancyData;

    if (!vacancy || !vacancy.id) {
      app.innerHTML = getVacancyStateHTML(authContext, {
        title: "Empleo no encontrado",
        message: "La vacante no existe o ya no está disponible.",
      });
      return;
    }

    // 2. 🔥 LÓGICA DE POSTULACIÓN PREVIA 🔥
    // Verificamos si el usuario ya aplicó para cambiar el estado del botón
    let hasApplied = false;
    if (
      authContext.isAuthenticated &&
      authContext.primaryRole === "candidate"
    ) {
      try {
        const myApps = await applicationService.getApplications(
          authContext.user.id,
          authContext.roles,
          { vacancyId: vacancy.id },
        );
        hasApplied = myApps.total > 0;
      } catch (err) {
        console.warn("No se pudo verificar postulación previa", err);
      }
    }

    // 3. Renderizar detalle
    app.innerHTML = getVacancyDetailHTML(vacancy, authContext, hasApplied);
    initVacancyDetailEvents(vacancy, hasApplied);
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

function getVacancyDetailHTML(vacancy, authContext, hasApplied) {
  const { isAuthenticated, user, roles, primaryRole } = authContext;
  const isCandidate = primaryRole === "candidate";

  const navbar = renderNavbar({
    activeRoute: "vacancies",
    isAuthenticated,
    user,
    roles,
    primaryRole,
  });

  // Mapeos de etiquetas
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

  // 🔥 BADGE DE VERIFICACIÓN 🔥
  const verifiedBadge = vacancy.company?.isVerified
    ? `<span class="company-verified-badge" title="Empresa Verificada">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
       </span>`
    : "";

  const header = renderSectionHeader({
    title: vacancy.title || "Detalle de vacante",
    subtitle: vacancy.company?.name || vacancy.companyName || "Empresa",
    actions:
      '<a href="#/vacancies" class="btn btn--outline btn--sm">Volver</a>',
  });

  // Lógica del botón de acción principal
  let applyButtonHtml = "";
  if (!isAuthenticated) {
    applyButtonHtml = `<a href="#/login" class="btn btn--primary btn--full-width">Iniciar sesión para aplicar</a>`;
  } else if (primaryRole === "recruiter" || primaryRole === "admin") {
    applyButtonHtml = `<button class="btn btn--outline btn--full-width" disabled title="Usa una cuenta de candidato">Solo candidatos pueden aplicar</button>`;
  } else if (hasApplied) {
    applyButtonHtml = `<button class="btn btn--success btn--full-width" disabled style="background: #10b981; border-color: #10b981; color: white; cursor: default;">✓ Ya postulado</button>`;
  } else {
    applyButtonHtml = `<button class="btn btn--primary btn--full-width" id="apply-btn">Aplicar ahora</button>`;
  }

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
                ${(vacancy.company?.name || vacancy.companyName || "C")[0]}
              </div>
              <div class="vacancy-detail__info">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <p class="vacancy-detail__company">${vacancy.company?.name || vacancy.companyName || "Empresa"}</p>
                  ${verifiedBadge}
                </div>
                <h1 class="vacancy-detail__title">${vacancy.title}</h1>
                <div class="vacancy-detail__meta">
                  <span class="vacancy-detail__meta-item">📍 ${vacancy.city || "Remoto"}</span>
                  <span class="vacancy-detail__meta-item">💼 ${modalityLabels[vacancy.modality] || vacancy.modality}</span>
                  <span class="vacancy-detail__meta-item">⏱️ ${typeLabels[vacancy.type] || vacancy.type}</span>
                  <span class="vacancy-detail__meta-item">📈 ${levelLabels[vacancy.level] || vacancy.level}</span>
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
                  <p class="vacancy-detail__salary-amount">$${vacancy.salaryMin.toLocaleString()} - $${vacancy.salaryMax?.toLocaleString()} ${vacancy.currency || "USD"}</p>
                </div>
              </div>`
                : ""
            }

            <section class="vacancy-detail__section">
              <h2 class="vacancy-detail__section-title">Descripción del puesto</h2>
              <div class="vacancy-detail__text">${vacancy.description || "Sin descripción"}</div>
            </section>

            ${
              vacancy.requirements
                ? `
              <section class="vacancy-detail__section">
                <h2 class="vacancy-detail__section-title">Requisitos</h2>
                <div class="vacancy-detail__text">${vacancy.requirements}</div>
              </section>`
                : ""
            }
          </article>
        </div>

        <aside class="vacancy-detail__sidebar">
          <div class="vacancy-detail__apply-card">
            <h3 class="vacancy-detail__apply-title">¿Te interesa este puesto?</h3>
            <p class="vacancy-detail__apply-text">
              ${hasApplied ? "Ya enviaste tu perfil para esta vacante. ¡Mucha suerte!" : "Asegúrate de que tu perfil esté completo antes de enviar tu solicitud."}
            </p>
            <div class="vacancy-detail__apply-actions">
              ${applyButtonHtml}
              ${isAuthenticated && isCandidate ? `<button class="btn btn--outline btn--full-width" id="save-job-btn">Guardar empleo</button>` : ""}
              <p class="vacancy-detail__feedback" id="vacancy-feedback" role="status" aria-live="polite"></p>
            </div>
          </div>

          <div class="vacancy-detail__summary-card">
            <h3 class="vacancy-detail__summary-title">Resumen del empleo</h3>
            <ul class="vacancy-detail__summary-list">
              <li class="summary-item"><span class="summary-item__label">Empresa</span><span class="summary-item__value">${vacancy.company?.name || vacancy.companyName}</span></li>
              <li class="summary-item"><span class="summary-item__label">Tipo</span><span class="summary-item__value">${typeLabels[vacancy.type] || vacancy.type}</span></li>
              <li class="summary-item"><span class="summary-item__label">Modalidad</span><span class="summary-item__value">${modalityLabels[vacancy.modality] || vacancy.modality}</span></li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  `;

  const modalHTML = `
    <div class="modal-overlay" id="apply-modal" style="display: none;">
      <div class="modal">
        <div class="modal__header">
          <h3 class="modal__title">Postularme a ${vacancy.title}</h3>
          <button class="modal__close" id="close-modal">&times;</button>
        </div>
        <form class="modal__form" id="apply-form">
          <div class="form-group">
            <label class="form-label" for="cover-letter">Carta de presentación (opcional)</label>
            <textarea id="cover-letter" class="form-textarea" rows="6" placeholder="¿Por qué eres el candidato ideal para este puesto?"></textarea>
          </div>
          <div style="background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
            <p style="font-size: 13px; color: #475569; margin: 0;">
              ℹ️ <strong>Nota:</strong> Se enviará automáticamente el CV que tienes cargado en tu perfil profesional.
            </p>
          </div>
          <div class="modal__actions">
            <button type="button" class="btn btn--outline" id="cancel-apply">Cancelar</button>
            <button type="submit" class="btn btn--primary" id="submit-apply">Confirmar postulación</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const styles = `
    .vacancy-detail-page { min-height: calc(100vh - 70px); padding: 32px 0; background: #f9fafb; }
    .breadcrumb { display: flex; align-items: center; gap: 8px; margin-bottom: 24px; font-size: 14px; }
    .breadcrumb__link { color: #6b7280; text-decoration: none; }
    .breadcrumb__separator { color: #d1d5db; }
    .breadcrumb__current { color: #374151; font-weight: 500; }
    .company-verified-badge { color: #3b82f6; display: flex; align-items: center; }
    .vacancy-detail { display: grid; grid-template-columns: 1fr 320px; gap: 32px; }
    .vacancy-detail__content { background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .vacancy-detail__header { display: flex; gap: 24px; margin-bottom: 32px; border-bottom: 1px solid #e5e7eb; padding-bottom: 32px; }
    .vacancy-detail__company-logo { width: 80px; height: 80px; border-radius: 16px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; font-weight: 600; color: #6b7280; font-size: 36px; }
    .vacancy-detail__company { font-size: 16px; color: #6b7280; margin: 0; }
    .vacancy-detail__title { font-size: 28px; font-weight: 700; color: #111827; margin: 4px 0 16px; }
    .vacancy-detail__meta { display: flex; flex-wrap: wrap; gap: 16px; }
    .vacancy-detail__meta-item { display: flex; align-items: center; gap: 6px; font-size: 14px; color: #6b7280; }
    .vacancy-detail__salary-card { display: flex; align-items: center; gap: 16px; padding: 20px; background: #f0fdf4; border-radius: 12px; margin-bottom: 32px; }
    .vacancy-detail__salary-card svg { color: #10b981; }
    .vacancy-detail__salary-amount { font-size: 20px; font-weight: 700; color: #10b981; margin: 0; }
    .vacancy-detail__section-title { font-size: 20px; font-weight: 600; color: #111827; margin-bottom: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px; }
    .vacancy-detail__sidebar { display: flex; flex-direction: column; gap: 20px; position: sticky; top: 92px; }
    .vacancy-detail__apply-card, .vacancy-detail__summary-card { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: white; border-radius: 12px; width: 100%; max-width: 550px; }
    .modal__header { padding: 24px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
    .form-textarea { width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-family: inherit; }
  `;

  return renderPage({
    navbar,
    main: mainContent + modalHTML,
    pageClass: "vacancy-detail-page",
    extraStyles: styles,
  });
}

function initVacancyDetailEvents(vacancy, hasApplied) {
  const applyBtn = document.getElementById("apply-btn");
  const applyModal = document.getElementById("apply-modal");
  const applyForm = document.getElementById("apply-form");
  const submitApply = document.getElementById("submit-apply");
  const feedback = document.getElementById("vacancy-feedback");

  const setFeedback = (message = "", type = "info") => {
    if (!feedback) return;
    feedback.textContent = message;
    feedback.className = `vacancy-detail__feedback ${type === "success" ? "vacancy-detail__feedback--success" : type === "error" ? "vacancy-detail__feedback--error" : ""}`;
  };

  // Mostrar modal solo si no ha aplicado
  if (applyBtn && !hasApplied) {
    applyBtn.addEventListener("click", () => {
      applyModal.style.display = "flex";
    });
  }

  // Cerrar modal
  const closeModal = () => {
    applyModal.style.display = "none";
  };
  document.getElementById("close-modal")?.addEventListener("click", closeModal);
  document
    .getElementById("cancel-apply")
    ?.addEventListener("click", closeModal);

  // Submit postulación
  if (applyForm) {
    applyForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const coverLetter = document.getElementById("cover-letter")?.value || "";

      submitApply.disabled = true;
      submitApply.textContent = "Procesando...";

      try {
        // 🔥 IMPORTANTE: Usamos el método de tu applicationService 🔥
        await applicationService.applyToJob(
          null, // El userId lo toma el backend del token
          null, // Los roles lo toma el backend del token
          { vacancyId: vacancy.id, coverLetter },
        );

        // Éxito: Redirigir al dashboard del candidato
        window.location.hash = "#/candidate/dashboard";
      } catch (error) {
        console.error("Error al postularse:", error);
        submitApply.disabled = false;
        submitApply.textContent = "Confirmar postulación";
        setFeedback(
          resolveRequestErrorMessage(error, "No pudimos enviar tu solicitud."),
          "error",
        );
      }
    });
  }
}
