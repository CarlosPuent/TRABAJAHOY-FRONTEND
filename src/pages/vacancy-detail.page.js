// Vacancy Detail Page Controller - Premium Refactor
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

  showLoading("Cargando información técnica...");

  try {
    const vacancyData = await vacancyService.getVacancyById(vacancyId);
    const vacancy = vacancyData?.data || vacancyData;

    if (!vacancy || !vacancy.id) {
      app.innerHTML = getVacancyStateHTML(authContext, {
        title: "Recurso no disponible",
        message:
          "La posición solicitada no se encuentra activa en nuestro sistema.",
      });
      return;
    }

    let hasApplied = false;
    if (
      authContext.isAuthenticated &&
      authContext.primaryRole === "candidate"
    ) {
      try {
        // CAMBIO 2: Arreglo de parámetros para evitar error de objeto en api.js
        const response = await applicationService.getApplications({
          vacancyId: vacancy.id,
        });
        hasApplied = response.total > 0;
      } catch (err) {
        console.warn("Estado de postulación no verificado", err);
      }
    }

    app.innerHTML = getVacancyDetailHTML(vacancy, authContext, hasApplied);
    initVacancyDetailEvents(vacancy, hasApplied);
  } catch (error) {
    app.innerHTML = getVacancyStateHTML(authContext, {
      title: "Error de conexión",
      message: resolveRequestErrorMessage(
        error,
        "Error interno al recuperar los datos de la vacante.",
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
    title,
    message,
    actionLabel: "Regresar al listado",
    actionHref: "#/vacancies",
  });

  return renderPage({
    navbar,
    main: `<div class="container" style="padding: 60px 0;">${state}</div>`,
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

  const modalityLabels = {
    remote: "Remoto",
    hybrid: "Esquema Híbrido",
    onsite: "Presencial",
  };
  const typeLabels = {
    "full-time": "Jornada Completa",
    "part-time": "Media Jornada",
    contract: "Por Proyecto",
  };

  const header = renderSectionHeader({
    title: vacancy.title,
    subtitle: vacancy.company?.name || "Corporativo",
    actions:
      '<a href="#/vacancies" class="btn-enterprise-link">← Volver al listado</a>',
  });

  let actionButtons = "";
  if (!isAuthenticated) {
    actionButtons = `<a href="#/login" class="btn-enterprise-primary">Autenticarse para postular</a>`;
  } else if (isCandidate) {
    if (hasApplied) {
      actionButtons = `<button class="btn-enterprise-success" disabled>Postulación completada</button>`;
    } else {
      actionButtons = `
        <button class="btn-enterprise-primary" id="apply-btn">Enviar postulación</button>
        <button class="btn-enterprise-outline" id="save-job-btn">Guardar en favoritos</button>`;
    }
  }

  const mainContent = `
    <div class="container">
      <div class="enterprise-layout">
        <main class="enterprise-main">
          <header class="enterprise-header">
            <div class="enterprise-brand-box">
               ${(vacancy.company?.name || "C")[0]}
            </div>
            <div class="enterprise-title-area">
              <h1 class="enterprise-h1">${vacancy.title}</h1>
              <p class="enterprise-subtitle">${vacancy.company?.name} • ${vacancy.city || "Ubicación por definir"}</p>
            </div>
          </header>

          <div class="enterprise-grid-specs">
            <div class="spec-item"><span class="spec-label">Modalidad</span><span class="spec-value">${modalityLabels[vacancy.modality]}</span></div>
            <div class="spec-item"><span class="spec-label">Contrato</span><span class="spec-value">${typeLabels[vacancy.type]}</span></div>
            <div class="spec-item"><span class="spec-label">Nivel</span><span class="spec-value">${vacancy.level}</span></div>
          </div>

          <section class="enterprise-section">
            <h2 class="enterprise-h2">Descripción Ejecutiva</h2>
            <div class="enterprise-rich-text">${vacancy.description}</div>
          </section>

          <section class="enterprise-section">
            <h2 class="enterprise-h2">Requerimientos Técnicos</h2>
            <div class="enterprise-rich-text">${vacancy.requirements}</div>
          </section>
        </main>

        <aside class="enterprise-sidebar">
          <div class="enterprise-card sticky-card">
            <h3 class="enterprise-h3">Gestión de Candidatura</h3>
            <p class="enterprise-text-sm">Finalice su proceso de aplicación adjuntando su perfil profesional actualizado.</p>
            <div class="enterprise-actions-stack">
              ${actionButtons}
            </div>
          </div>
        </aside>
      </div>
    </div>

    <div class="enterprise-modal-overlay" id="apply-modal" style="display: none;">
      <div class="enterprise-modal">
        <div class="enterprise-modal-header">
          <h3 class="enterprise-h3">Confirmar Postulación</h3>
          <button class="enterprise-modal-close" id="close-modal">✕</button>
        </div>
        <div class="enterprise-modal-body">
          <form id="apply-form">
            <div class="enterprise-form-group">
              <label class="enterprise-label">Mensaje de presentación (Opcional)</label>
              <textarea id="cover-letter" class="enterprise-textarea" placeholder="Describa brevemente su valor añadido para la organización..."></textarea>
            </div>
            <div class="enterprise-alert-info">
              Su currículum vitae y datos de contacto se adjuntarán automáticamente de acuerdo a su perfil registrado.
            </div>
            <div class="enterprise-modal-footer">
              <button type="button" class="btn-enterprise-outline" id="cancel-apply">Descartar</button>
              <button type="submit" class="btn-enterprise-primary" id="submit-apply">Confirmar y Enviar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  const styles = `
    :root {
      --primary-heavy: #1e293b;
      --accent-blue: #2563eb;
      --text-main: #334155;
      --text-light: #64748b;
      --border-color: #e2e8f0;
      --bg-page: #f8fafc;
    }

    .vacancy-detail-page { background: var(--bg-page); font-family: 'Inter', system-ui, sans-serif; color: var(--text-main); }
    .enterprise-layout { display: grid; grid-template-columns: 1fr 340px; gap: 40px; padding: 40px 0; }
    .enterprise-main { background: white; border: 1px solid var(--border-color); border-radius: 4px; padding: 48px; }
    .enterprise-header { display: flex; align-items: center; gap: 24px; margin-bottom: 40px; }
    .enterprise-brand-box { width: 64px; height: 64px; background: var(--primary-heavy); color: white; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 600; border-radius: 4px; }
    .enterprise-h1 { font-size: 32px; font-weight: 700; color: var(--primary-heavy); margin: 0; letter-spacing: -0.02em; }
    .enterprise-subtitle { font-size: 16px; color: var(--text-light); margin-top: 4px; }
    .enterprise-grid-specs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding: 24px 0; border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); margin-bottom: 40px; }
    .spec-label { display: block; font-size: 12px; text-transform: uppercase; color: var(--text-light); letter-spacing: 0.05em; font-weight: 600; }
    .spec-value { font-size: 15px; font-weight: 500; color: var(--primary-heavy); }
    .enterprise-section { margin-bottom: 40px; }
    .enterprise-h2 { font-size: 18px; font-weight: 600; color: var(--primary-heavy); margin-bottom: 16px; border-left: 3px solid var(--accent-blue); padding-left: 12px; }
    .enterprise-rich-text { line-height: 1.7; color: var(--text-main); font-size: 15px; }
    .sticky-card { position: sticky; top: 100px; background: white; border: 1px solid var(--border-color); padding: 32px; border-radius: 4px; }
    .enterprise-h3 { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
    .enterprise-actions-stack { display: flex; flex-direction: column; gap: 12px; margin-top: 24px; }
    .btn-enterprise-primary { background: var(--primary-heavy); color: white; border: none; padding: 12px 24px; border-radius: 4px; font-weight: 500; cursor: pointer; text-align: center; transition: background 0.2s; }
    .btn-enterprise-primary:hover { background: #0f172a; }
    .btn-enterprise-outline { background: transparent; border: 1px solid var(--border-color); color: var(--text-main); padding: 12px 24px; border-radius: 4px; font-weight: 500; cursor: pointer; transition: background 0.2s; }
    .btn-enterprise-outline:hover { background: #f1f5f9; }
    .btn-enterprise-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 12px 24px; border-radius: 4px; width: 100%; font-weight: 500; }
    .btn-enterprise-link { text-decoration: none; color: var(--text-light); font-size: 14px; }
    .enterprise-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 9999; }
    .enterprise-modal { background: white; width: 100%; max-width: 500px; border-radius: 4px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
    .enterprise-modal-header { padding: 24px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; }
    .enterprise-modal-body { padding: 24px; }
    .enterprise-textarea { width: 100%; border: 1px solid var(--border-color); border-radius: 4px; padding: 12px; min-height: 120px; font-family: inherit; margin-bottom: 16px; }
    .enterprise-alert-info { background: #eff6ff; color: #1e40af; padding: 16px; font-size: 13px; border-radius: 4px; margin-bottom: 24px; }
    .enterprise-modal-footer { display: flex; justify-content: flex-end; gap: 12px; }
  `;

  return renderPage({
    navbar,
    main: mainContent,
    pageClass: "vacancy-detail-page",
    extraStyles: styles,
  });
}

function initVacancyDetailEvents(vacancy, hasApplied) {
  const applyBtn = document.getElementById("apply-btn");
  const applyModal = document.getElementById("apply-modal");
  const applyForm = document.getElementById("apply-form");

  // Botón Abrir Modal
  if (applyBtn && !hasApplied) {
    applyBtn.onclick = () => (applyModal.style.display = "flex");
  }

  // CAMBIO 3: Activar el botón de "Guardar en favoritos"
  const saveBtn = document.getElementById("save-job-btn");
  if (saveBtn) {
    saveBtn.onclick = async () => {
      try {
        await applicationService.saveJob(vacancy.id);
        saveBtn.textContent = "Guardado";
        saveBtn.disabled = true;
        saveBtn.classList.remove("btn-enterprise-outline");
        saveBtn.classList.add("btn-enterprise-success");
      } catch (err) {
        console.error("No se pudo guardar la vacante", err);
      }
    };
  }

  // Cerrar Modal
  const closeModal = () => (applyModal.style.display = "none");
  document.getElementById("close-modal")?.addEventListener("click", closeModal);
  document
    .getElementById("cancel-apply")
    ?.addEventListener("click", closeModal);

  // Submit de Postulación
  if (applyForm) {
    applyForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById("submit-apply");
      const coverLetter = document.getElementById("cover-letter")?.value;

      submitBtn.disabled = true;
      submitBtn.textContent = "Transmitiendo...";

      try {
        // CAMBIO 1: Corregir nombre de función a applyToVacancy y limpiar parámetros
        await applicationService.applyToVacancy({
          vacancyId: vacancy.id,
          coverLetter,
        });

        window.location.hash = "#/candidate/dashboard";
      } catch (error) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Reintentar envío";
        alert(
          resolveRequestErrorMessage(
            error,
            "Fallo en el servidor. Intente más tarde.",
          ),
        );
      }
    });
  }
}
