// Edit My Profile Page Controller - Tab-based modern UI
import { candidateService } from "@services/candidate.service";
import {
  getAuthUiContext,
  showLoading,
  renderNavbar,
  renderPage,
} from "@utils/ui.js";

let currentProfile = null;
let currentExperiences = [];
let currentEducation = [];
let currentSkills = [];
let currentLanguages = [];

export async function initEditMyProfilePage(params, query) {
  const authContext = getAuthUiContext();
  const user = authContext.user;
  showLoading("Cargando perfil...");

  try {
    const candidateId = user?.id;
    const [profileData, expData, eduData, skillsData, langData] =
      await Promise.allSettled([
        candidateService.getProfileById(candidateId).catch(() => null),
        candidateService.getExperiences(candidateId).catch(() => []),
        candidateService.getEducation(candidateId).catch(() => []),
        candidateService.getSkills(candidateId).catch(() => []),
        candidateService.getLanguages(candidateId).catch(() => []),
      ]);

    currentProfile =
      profileData.status === "fulfilled" ? profileData.value || null : null;
    currentExperiences =
      expData.status === "fulfilled" ? expData.value || [] : [];
    currentEducation =
      eduData.status === "fulfilled" ? eduData.value || [] : [];
    currentSkills =
      skillsData.status === "fulfilled" ? skillsData.value || [] : [];
    currentLanguages =
      langData.status === "fulfilled" ? langData.value || [] : [];
    document.getElementById("app").innerHTML = getEditHTML(authContext, false);
    initEditEvents();
  } catch (error) {
    console.error("Error loading profile for edit:", error);
    document.getElementById("app").innerHTML = getEditHTML(authContext, true);
    initEditEvents();
  }
}

function getEditHTML(authContext, loadFailed = false) {
  const { user, isAuthenticated, roles, primaryRole } = authContext;
  const navbar = renderNavbar({
    activeRoute: "candidate/profile/edit",
    isAuthenticated,
    user,
    roles,
    primaryRole,
  });
  const p = currentProfile || {};

  const tabs = [
    {
      id: "tab-personal",
      label: "Información Personal",
      icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
    },
    {
      id: "tab-experience",
      label: "Experiencia",
      icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`,
    },
    {
      id: "tab-education",
      label: "Educación",
      icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>`,
    },
    {
      id: "tab-skills",
      label: "Habilidades",
      icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
    },
    {
      id: "tab-languages",
      label: "Idiomas",
      icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
    },
  ];

  const mainContent = `
    <div class="edit-content">
      ${loadFailed ? '<div class="edit-warning">No pudimos cargar completamente los datos actuales. Si editas, revisa cuidadosamente la información antes de guardar.</div>' : ""}
      <!-- Tabs -->
      <div class="edit-tabs">
        ${tabs.map((t, i) => `<button class="edit-tab${i === 0 ? " edit-tab--active" : ""}" data-tab="${t.id}"><span class="edit-tab__icon">${t.icon}</span> ${t.label}</button>`).join("")}
      </div>

      <!-- Tab: Personal Info -->
      <div class="edit-panel edit-panel--active" id="tab-personal">
        <div class="edit-card">
          <h2 class="edit-card__title">Información Personal</h2>
          <p class="edit-card__subtitle">Datos básicos que ven los empleadores</p>
          <form id="form-personal" class="edit-form">
            <div class="form-grid form-grid--2">
              <div class="form-field">
                <label class="form-label" for="edit-firstName">Nombre</label>
                <input class="form-input" id="edit-firstName" type="text" value="${user?.firstName || ""}" required />
              </div>
              <div class="form-field">
                <label class="form-label" for="edit-lastName">Apellido</label>
                <input class="form-input" id="edit-lastName" type="text" value="${user?.lastName || ""}" required />
              </div>
            </div>
            <div class="form-field">
              <label class="form-label" for="edit-headline">Título profesional</label>
              <input class="form-input" id="edit-headline" type="text" placeholder="Ej: Desarrollador Full Stack" value="${p.headline || ""}" />
            </div>
            <div class="form-field">
              <label class="form-label" for="edit-bio">Biografía</label>
              <textarea class="form-textarea" id="edit-bio" rows="4" placeholder="Cuéntanos sobre ti...">${p.bio || ""}</textarea>
            </div>
            <div class="form-grid form-grid--2">
              <div class="form-field">
                <label class="form-label" for="edit-location">Ubicación</label>
                <input class="form-input" id="edit-location" type="text" placeholder="Ciudad, País" value="${p.location || ""}" />
              </div>
              <div class="form-field">
                <label class="form-label" for="edit-availability">Disponibilidad</label>
                <select class="form-select" id="edit-availability">
                  <option value="immediately" ${p.availability === "immediately" ? "selected" : ""}>Disponible inmediatamente</option>
                  <option value="open" ${p.availability === "open" ? "selected" : ""}>Abierto a oportunidades</option>
                  <option value="notLooking" ${p.availability === "notLooking" ? "selected" : ""}>No buscando activamente</option>
                </select>
              </div>
            </div>
            <div class="form-grid form-grid--3">
              <div class="form-field">
                <label class="form-label" for="edit-website">Sitio web</label>
                <input class="form-input" id="edit-website" type="url" placeholder="https://..." value="${p.website || ""}" />
              </div>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn--primary">Guardar cambios</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Tab: Experience -->
<div class="edit-panel" id="tab-experience">
  <div class="edit-card">
    <div class="edit-card__header-row">
      <div>
        <h2 class="edit-card__title">Experiencia Laboral</h2>
        <p class="edit-card__subtitle">Tu historial profesional</p>
      </div>
      <button class="btn btn--primary btn--sm" id="add-exp-btn">+ Agregar</button>
    </div>

    <div id="experience-form-wrapper" class="inline-form-wrapper" style="display:none;">
      <div class="inline-form-card">
        <div class="form-grid form-grid--2">
          <div class="form-field">
            <label class="form-label" for="exp-company">Empresa</label>
            <input class="form-input" id="exp-company" type="text" />
          </div>
          <div class="form-field">
            <label class="form-label" for="exp-role">Cargo / puesto</label>
            <input class="form-input" id="exp-role" type="text" />
          </div>
        </div>

        <div class="form-grid form-grid--2">
          <div class="form-field">
            <label class="form-label" for="exp-location">Ubicación</label>
            <input class="form-input" id="exp-location" type="text" />
          </div>
          <div class="form-field">
            <label class="form-label" for="exp-start">Fecha de inicio</label>
            <input class="form-input" id="exp-start" type="date" />
          </div>
        </div>

        <div class="form-grid form-grid--2">
          <div class="form-field">
            <label class="form-label" for="exp-end">Fecha de finalización</label>
            <input class="form-input" id="exp-end" type="date" />
          </div>
          <div class="form-field form-checkbox-field">
            <label class="form-checkbox-label">
              <input id="exp-current" type="checkbox" />
              Trabajo actualmente aquí
            </label>
          </div>
        </div>

        <div class="form-field">
          <label class="form-label" for="exp-description">Descripción</label>
          <textarea class="form-textarea" id="exp-description" rows="3"></textarea>
        </div>

        <div class="form-actions">
          <button class="btn btn--primary" id="save-exp-btn" type="button">Guardar experiencia</button>
          <button class="btn btn--ghost" id="cancel-exp-btn" type="button">Cancelar</button>
        </div>
      </div>
    </div>

    <div id="experiences-list">
      ${
        currentExperiences.length > 0
          ? currentExperiences
              .map(
                (exp) => `
          <div class="edit-item" data-id="${exp.id}">
            <div class="edit-item__header">
              <div>
                <strong>${exp.role || exp.position || "Puesto"}</strong>
                <span class="edit-item__sub">${exp.companyName || ""}</span>
              </div>
              <div class="edit-item__actions">
                <button class="btn-icon btn-icon--delete" data-del-exp="${exp.id}" title="Eliminar">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>
            <p class="edit-item__meta">${exp.startDate || ""} — ${exp.isCurrent ? "Presente" : exp.endDate || ""}${exp.location ? ` · ${exp.location}` : ""}</p>
            ${exp.description ? `<p class="edit-item__desc">${exp.description}</p>` : ""}
          </div>
        `,
              )
              .join("")
          : '<p class="empty-list">No has agregado experiencias aún</p>'
      }
    </div>
  </div>
</div>

      <!-- Tab: Education -->
<div class="edit-panel" id="tab-education">
  <div class="edit-card">
    <div class="edit-card__header-row">
      <div>
        <h2 class="edit-card__title">Educación</h2>
        <p class="edit-card__subtitle">Tu formación académica</p>
      </div>
      <button class="btn btn--primary btn--sm" id="add-edu-btn">+ Agregar</button>
    </div>

    <div id="education-form-wrapper" class="inline-form-wrapper" style="display:none;">
      <div class="inline-form-card">
        <div class="form-grid form-grid--2">
          <div class="form-field">
            <label class="form-label" for="edu-institution">Institución</label>
            <input class="form-input" id="edu-institution" type="text" />
          </div>
          <div class="form-field">
            <label class="form-label" for="edu-degree">Título / carrera</label>
            <input class="form-input" id="edu-degree" type="text" />
          </div>
        </div>

        <div class="form-grid form-grid--2">
          <div class="form-field">
            <label class="form-label" for="edu-field">Área de estudio</label>
            <input class="form-input" id="edu-field" type="text" />
          </div>
          <div class="form-field">
            <label class="form-label" for="edu-start">Fecha de inicio</label>
            <input class="form-input" id="edu-start" type="date" />
          </div>
        </div>

        <div class="form-grid form-grid--2">
          <div class="form-field">
            <label class="form-label" for="edu-end">Fecha de finalización</label>
            <input class="form-input" id="edu-end" type="date" />
          </div>
          <div class="form-field form-checkbox-field">
            <label class="form-checkbox-label">
              <input id="edu-current" type="checkbox" />
              Estudio actualmente aquí
            </label>
          </div>
        </div>

        <div class="form-field">
          <label class="form-label" for="edu-description">Descripción</label>
          <textarea class="form-textarea" id="edu-description" rows="3"></textarea>
        </div>

        <div class="form-actions">
          <button class="btn btn--primary" id="save-edu-btn" type="button">Guardar educación</button>
          <button class="btn btn--ghost" id="cancel-edu-btn" type="button">Cancelar</button>
        </div>
      </div>
    </div>

    <div id="education-list">
      ${
        currentEducation.length > 0
          ? currentEducation
              .map(
                (edu) => `
          <div class="edit-item" data-id="${edu.id}">
            <div class="edit-item__header">
              <div>
                <strong>${edu.degree || "Título"}${edu.fieldOfStudy ? ` en ${edu.fieldOfStudy}` : ""}</strong>
                <span class="edit-item__sub">${edu.institution || edu.institutionName || ""}</span>
              </div>
              <div class="edit-item__actions">
                <button class="btn-icon btn-icon--delete" data-del-edu="${edu.id}" title="Eliminar">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>
            <p class="edit-item__meta">${edu.startDate || ""} — ${edu.endDate || "Presente"}</p>
            ${edu.description ? `<p class="edit-item__desc">${edu.description}</p>` : ""}
          </div>
        `,
              )
              .join("")
          : '<p class="empty-list">No has agregado educación aún</p>'
      }
    </div>
  </div>
</div>

      <!-- Tab: Skills -->
<div class="edit-panel" id="tab-skills">
  <div class="edit-card">
    <div class="edit-card__header-row">
      <div>
        <h2 class="edit-card__title">Habilidades</h2>
        <p class="edit-card__subtitle">Tus competencias técnicas y blandas</p>
      </div>
      <button class="btn btn--primary btn--sm" id="add-skill-btn">+ Agregar</button>
    </div>

    <div id="skill-form-wrapper" class="inline-form-wrapper" style="display:none;">
      <div class="inline-form-card">
        <div class="form-grid form-grid--2">
          <div class="form-field">
            <label class="form-label" for="skill-name">Nombre de la habilidad</label>
            <input class="form-input" id="skill-name" type="text" />
          </div>
          <div class="form-field">
            <label class="form-label" for="skill-level">Nivel</label>
            <select class="form-select" id="skill-level">
              <option value="beginner">Principiante</option>
              <option value="intermediate" selected>Intermedio</option>
              <option value="advanced">Avanzado</option>
              <option value="expert">Experto</option>
            </select>
          </div>
        </div>

        <div class="form-field">
          <label class="form-label" for="skill-years">Años de experiencia</label>
          <input class="form-input" id="skill-years" type="number" min="0" value="0" />
        </div>

        <div class="form-actions">
          <button class="btn btn--primary" id="save-skill-btn" type="button">Guardar habilidad</button>
          <button class="btn btn--ghost" id="cancel-skill-btn" type="button">Cancelar</button>
        </div>
      </div>
    </div>

    <div id="skills-list" class="tags-list">
      ${
        currentSkills.length > 0
          ? currentSkills
              .map(
                (s) => `
          <div class="tag-item">
            <span class="tag-label">${s.skillName || s.name || ""}</span>
            <span class="tag-badge" style="background: ${{ beginner: "#fef2f2", intermediate: "#fffbeb", advanced: "#eff6ff", expert: "#ecfdf5" }[s.level]};color: ${{ beginner: "#dc2626", intermediate: "#d97706", advanced: "#2563eb", expert: "#059669" }[s.level]};">${{ beginner: "Principiante", intermediate: "Intermedio", advanced: "Avanzado", expert: "Experto" }[s.level] || ""}</span>
            <button class="btn-icon btn-icon--delete" data-del-skill="${s.id}" title="Eliminar">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        `,
              )
              .join("")
          : '<p class="empty-list">No has agregado habilidades aún</p>'
      }
    </div>
  </div>
</div>

    <!-- Tab: Languages -->
<div class="edit-panel" id="tab-languages">
  <div class="edit-card">
    <div class="edit-card__header-row">
      <div>
        <h2 class="edit-card__title">Idiomas</h2>
        <p class="edit-card__subtitle">Idiomas que dominas</p>
      </div>
      <button class="btn btn--primary btn--sm" id="add-lang-btn">+ Agregar</button>
    </div>

    <div id="language-form-wrapper" class="inline-form-wrapper" style="display:none;">
      <div class="inline-form-card">
        <div class="form-grid form-grid--2">
          <div class="form-field">
            <label class="form-label" for="lang-name">Idioma</label>
            <input class="form-input" id="lang-name" type="text" />
          </div>
          <div class="form-field">
            <label class="form-label" for="lang-level">Nivel</label>
            <select class="form-select" id="lang-level">
              <option value="basic">Básico</option>
              <option value="intermediate" selected>Intermedio</option>
              <option value="advanced">Avanzado</option>
              <option value="native">Nativo</option>
            </select>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn btn--primary" id="save-lang-btn" type="button">Guardar idioma</button>
          <button class="btn btn--ghost" id="cancel-lang-btn" type="button">Cancelar</button>
        </div>
      </div>
    </div>

    <div id="languages-list" class="tags-list">
      ${
        currentLanguages.length > 0
          ? currentLanguages
              .map(
                (l) => `
          <div class="tag-item">
            <span class="tag-label">${l.languageName || l.name || ""}</span>
            <span class="tag-badge" style="background: ${{ basic: "#fef2f2", intermediate: "#fffbeb", advanced: "#eff6ff", native: "#ecfdf5" }[l.proficiency]};color: ${{ basic: "#dc2626", intermediate: "#d97706", advanced: "#2563eb", native: "#059669" }[l.proficiency]};">${{ basic: "Básico", intermediate: "Intermedio", advanced: "Avanzado", native: "Nativo" }[l.proficiency] || ""}</span>
            <button class="btn-icon btn-icon--delete" data-del-lang="${l.id}" title="Eliminar">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        `,
              )
              .join("")
          : '<p class="empty-list">No has agregado idiomas aún</p>'
      }
    </div>
  </div>
</div>
  `;

  const styles = `
    .edit-page { background: #f3f4f6; }
    .edit-content { max-width: 800px; margin: 0 auto; padding: 32px; }
    .edit-warning {
      margin: 0 0 14px;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid #fde68a;
      background: #fffbeb;
      color: #92400e;
      font-size: 13px;
    }
    .edit-tabs { display: flex; gap: 4px; margin-bottom: 32px; }
    .edit-tab {
      flex: 1; min-width: 0; justify-content: center; padding: 8px 6px; border: none; background: white; border-radius: 10px; font-size: 12px; font-weight: 500;
      color: #6b7280; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; gap: 3px;
      overflow: hidden;
    }
    .edit-tab__icon { flex-shrink: 0; width: 14px; height: 14px; display: none; }
    .edit-tab__icon svg { width: 14px; height: 14px; }
    .edit-tab__label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .edit-tab--active .edit-tab__icon { display: inline-flex; }
    .edit-tab:hover { background: #f9fafb; color: #374151; }
    .edit-tab--active { background: #3b82f6; color: white; }
    .edit-tab--active:hover { background: #2563eb; color: white; }
    .edit-panel { display: none; }
    .edit-panel--active { display: block; }
    .edit-card { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); padding: 24px; margin-bottom: 24px; }
    .edit-card__title { font-size: 20px; font-weight: 600; color: #111827; margin: 0 0 4px; }
    .edit-card__subtitle { font-size: 14px; color: #6b7280; margin: 0 0 24px; }
    .edit-card__header-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .edit-form { }
    .form-grid { display: grid; gap: 16px; margin-bottom: 16px; }
    .form-grid--2 { grid-template-columns: 1fr 1fr; }
    .form-grid--3 { grid-template-columns: 1fr 1fr 1fr; }
    .form-field { margin-bottom: 0; }
    .form-label { display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 6px; }
    .form-input, .form-textarea, .form-select {
      width: 100%; padding: 10px 14px; border: 1.5px solid #e5e7eb; border-radius: 8px; font-size: 14px;
      font-family: inherit; transition: all 0.15s; background: #fff;
    }
    .form-input:focus, .form-textarea:focus, .form-select:focus {
      outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
    }
    .form-textarea { resize: vertical; min-height: 80px; }
    .form-actions { margin-top: 24px; display: flex; gap: 12px; }
    .edit-item { padding: 16px; border: 1px solid #f3f4f6; border-radius: 8px; margin-bottom: 12px; transition: all 0.15s; }
    .edit-item:hover { border-color: #e5e7eb; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .edit-item__header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 4px; }
    .edit-item__header strong { font-size: 15px; color: #111827; }
    .edit-item__sub { font-size: 13px; color: #6b7280; margin-left: 8px; }
    .edit-item__actions { display: flex; gap: 4px; flex-shrink: 0; }
    .edit-item__meta { font-size: 13px; color: #9ca3af; margin: 0 0 4px; }
    .edit-item__desc { font-size: 13px; color: #4b5563; margin: 4px 0 0; }
    .tags-list { display: flex; flex-wrap: wrap; gap: 8px; }
    .tag-item {
      display: flex; align-items: center; gap: 8px; padding: 8px 14px; background: #f9fafb;
      border-radius: 8px; border: 1px solid #e5e7eb;
    }
    .tag-label { font-size: 14px; font-weight: 500; color: #374151; }
    .tag-badge { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 9999px; }
    .btn-icon { background: none; border: none; cursor: pointer; padding: 4px; border-radius: 4px; color: #9ca3af; transition: all 0.15s; display: flex; }
    .btn-icon:hover { background: #f3f4f6; color: #374151; }
    .btn-icon--edit:hover { color: #2563eb; background: #eff6ff; }
    .btn-icon--delete:hover { color: #dc2626; background: #fee2e2; }
    .empty-list { text-align: center; padding: 32px; color: #9ca3af; font-size: 14px; }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; text-decoration: none; border: none; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
    .btn--primary { background: #3b82f6; color: white; }
    .btn--primary:hover { background: #2563eb; }
    .btn--sm { padding: 7px 14px; font-size: 13px; }
    .inline-form-wrapper {
  margin-bottom: 20px;
}
.inline-form-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 18px;
  margin-bottom: 18px;
}
.form-checkbox-field {
  display: flex;
  align-items: end;
}
.form-checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #374151;
}
.btn--ghost {
  background: #f3f4f6;
  color: #374151;
}
.btn--ghost:hover {
  background: #e5e7eb;
}
    @media (max-width: 640px) {
      .form-grid--2, .form-grid--3 { grid-template-columns: 1fr; }
    }
  `;

  return renderPage({
    navbar,
    main: mainContent,
    pageClass: "edit-page",
    extraStyles: styles,
  });
}

// Show/hide experience form
function initEditEvents() {
  // Tab switching
  document.querySelectorAll(".edit-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document
        .querySelectorAll(".edit-tab")
        .forEach((t) => t.classList.remove("edit-tab--active"));
      document
        .querySelectorAll(".edit-panel")
        .forEach((p) => p.classList.remove("edit-panel--active"));

      tab.classList.add("edit-tab--active");
      document
        .getElementById(tab.dataset.tab)
        ?.classList.add("edit-panel--active");
    });
  });

  // Save personal info
  const personalForm = document.getElementById("form-personal");
  if (personalForm) {
    personalForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const user = getAuthUiContext().user;

      const data = {
        headline: document.getElementById("edit-headline").value,
        bio: document.getElementById("edit-bio").value,
        location: document.getElementById("edit-location").value,
        availability: document.getElementById("edit-availability").value,
        website: document.getElementById("edit-website").value || null,
      };

      const btn = personalForm.querySelector('button[type="submit"]');
      const origText = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Guardando...";

      try {
        let savedProfile;

        if (currentProfile?.id) {
          savedProfile = await candidateService.updateProfile(currentProfile.id, data);
        } else {
          savedProfile = await candidateService.createProfile(data);
        }

        currentProfile = savedProfile;

        btn.textContent = "✓ Guardado";
        setTimeout(() => {
          btn.textContent = origText;
          btn.disabled = false;
        }, 1500);
      } catch (error) {
        console.error("Save error:", error);
        btn.textContent = "Error al guardar";
        setTimeout(() => {
          btn.textContent = origText;
          btn.disabled = false;
        }, 2000);
      }
    });
  }

  // ---------- EXPERIENCE ----------
  const addExpBtn = document.getElementById("add-exp-btn");
  const expFormWrapper = document.getElementById("experience-form-wrapper");
  const cancelExpBtn = document.getElementById("cancel-exp-btn");
  const expCurrent = document.getElementById("exp-current");
  const expEnd = document.getElementById("exp-end");

  if (addExpBtn && expFormWrapper) {
    addExpBtn.addEventListener("click", () => {
      expFormWrapper.style.display = "block";
    });
  }

  if (cancelExpBtn && expFormWrapper) {
    cancelExpBtn.addEventListener("click", () => {
      expFormWrapper.style.display = "none";
    });
  }

  if (expCurrent && expEnd) {
    expCurrent.addEventListener("change", () => {
      expEnd.disabled = expCurrent.checked;
      if (expCurrent.checked) expEnd.value = "";
    });
  }

  const saveExpBtn = document.getElementById("save-exp-btn");
  if (saveExpBtn) {
    saveExpBtn.addEventListener("click", async () => {
      try {
        const user = getAuthUiContext().user;
        const isCurrent = document.getElementById("exp-current").checked;

        const payload = {
          companyName: document.getElementById("exp-company").value,
          role: document.getElementById("exp-role").value,
          location: document.getElementById("exp-location").value || "",
          startDate: document.getElementById("exp-start").value,
          isCurrent,
          description: document.getElementById("exp-description").value || "",
        };

        if (!payload.companyName || !payload.role || !payload.startDate) {
          alert("Completa empresa, cargo y fecha de inicio.");
          return;
        }

        if (!isCurrent) {
          const endDate = document.getElementById("exp-end").value;
          if (endDate) payload.endDate = endDate;
        }

        await candidateService.addExperience(user.id, payload);
        alert("Experiencia agregada correctamente");
        window.location.reload();
      } catch (error) {
        console.error("Error adding experience:", error);
        alert("No se pudo guardar la experiencia");
      }
    });
  }

  // ---------- EDUCATION ----------
  const addEduBtn = document.getElementById("add-edu-btn");
  const eduFormWrapper = document.getElementById("education-form-wrapper");
  const cancelEduBtn = document.getElementById("cancel-edu-btn");
  const eduCurrent = document.getElementById("edu-current");
  const eduEnd = document.getElementById("edu-end");

  if (addEduBtn && eduFormWrapper) {
    addEduBtn.addEventListener("click", () => {
      eduFormWrapper.style.display = "block";
    });
  }

  if (cancelEduBtn && eduFormWrapper) {
    cancelEduBtn.addEventListener("click", () => {
      eduFormWrapper.style.display = "none";
    });
  }

  if (eduCurrent && eduEnd) {
    eduCurrent.addEventListener("change", () => {
      eduEnd.disabled = eduCurrent.checked;
      if (eduCurrent.checked) eduEnd.value = "";
    });
  }

  const saveEduBtn = document.getElementById("save-edu-btn");
  if (saveEduBtn) {
    saveEduBtn.addEventListener("click", async () => {
      try {
        const user = getAuthUiContext().user;
        const isCurrent = document.getElementById("edu-current").checked;

        const payload = {
          institution: document.getElementById("edu-institution").value,
          degree: document.getElementById("edu-degree").value,
          fieldOfStudy: document.getElementById("edu-field").value || "",
          startDate: document.getElementById("edu-start").value,
          description: document.getElementById("edu-description").value || "",
        };

        if (!payload.institution || !payload.degree || !payload.startDate) {
          alert("Completa institución, título y fecha de inicio.");
          return;
        }

        if (!isCurrent) {
          const endDate = document.getElementById("edu-end").value;
          if (endDate) payload.endDate = endDate;
        }

        await candidateService.addEducation(user.id, payload);
        alert("Educación agregada correctamente");
        window.location.reload();
      } catch (error) {
        console.error("Error adding education:", error);
        alert("No se pudo guardar la educación");
      }
    });
  }

  // ---------- SKILLS ----------
  const addSkillBtn = document.getElementById("add-skill-btn");
  const skillFormWrapper = document.getElementById("skill-form-wrapper");
  const cancelSkillBtn = document.getElementById("cancel-skill-btn");

  if (addSkillBtn && skillFormWrapper) {
    addSkillBtn.addEventListener("click", () => {
      skillFormWrapper.style.display = "block";
    });
  }

  if (cancelSkillBtn && skillFormWrapper) {
    cancelSkillBtn.addEventListener("click", () => {
      skillFormWrapper.style.display = "none";
    });
  }

  const saveSkillBtn = document.getElementById("save-skill-btn");
  if (saveSkillBtn) {
    saveSkillBtn.addEventListener("click", async () => {
      try {
        const user = getAuthUiContext().user;
        const payload = {
          skillName: document.getElementById("skill-name").value,
          level: document.getElementById("skill-level").value,
          yearsOfExperience:
            Number(document.getElementById("skill-years").value) || 0,
        };

        if (!payload.skillName) {
          alert("Ingresa el nombre de la habilidad.");
          return;
        }

        await candidateService.addSkill(user.id, payload);
        alert("Habilidad agregada correctamente");
        window.location.reload();
      } catch (error) {
        console.error("Error adding skill:", error);
        alert("No se pudo guardar la habilidad");
      }
    });
  }

  // ---------- LANGUAGES ----------
  const addLangBtn = document.getElementById("add-lang-btn");
  const langFormWrapper = document.getElementById("language-form-wrapper");
  const cancelLangBtn = document.getElementById("cancel-lang-btn");

  if (addLangBtn && langFormWrapper) {
    addLangBtn.addEventListener("click", () => {
      langFormWrapper.style.display = "block";
    });
  }

  if (cancelLangBtn && langFormWrapper) {
    cancelLangBtn.addEventListener("click", () => {
      langFormWrapper.style.display = "none";
    });
  }

  const saveLangBtn = document.getElementById("save-lang-btn");
  if (saveLangBtn) {
    saveLangBtn.addEventListener("click", async () => {
      try {
        const user = getAuthUiContext().user;
        const payload = {
          languageName: document.getElementById("lang-name").value,
          proficiency: document.getElementById("lang-level").value,
        };

        if (!payload.languageName) {
          alert("Ingresa el idioma.");
          return;
        }

        await candidateService.addLanguage(user.id, payload);
        alert("Idioma agregado correctamente");
        window.location.reload();
      } catch (error) {
        console.error("Error adding language:", error);
        alert("No se pudo guardar el idioma");
      }
    });
  }

  // ---------- DELETE BUTTONS ----------
  document.querySelectorAll("[data-del-exp]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (confirm("¿Eliminar esta experiencia?")) {
        try {
          await candidateService.deleteExperience(btn.dataset.delExp);
          window.location.reload();
        } catch (e) {
          console.error(e);
          alert("No se pudo eliminar la experiencia");
        }
      }
    });
  });

  document.querySelectorAll("[data-del-edu]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (confirm("¿Eliminar esta educación?")) {
        try {
          await candidateService.deleteEducationItem(btn.dataset.delEdu);
          window.location.reload();
        } catch (e) {
          console.error(e);
          alert("No se pudo eliminar la educación");
        }
      }
    });
  });

  document.querySelectorAll("[data-del-skill]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (confirm("¿Eliminar esta habilidad?")) {
        try {
          await candidateService.deleteSkill(btn.dataset.delSkill);
          window.location.reload();
        } catch (e) {
          console.error(e);
          alert("No se pudo eliminar la habilidad");
        }
      }
    });
  });

  document.querySelectorAll("[data-del-lang]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (confirm("¿Eliminar este idioma?")) {
        try {
          await candidateService.deleteLanguage(btn.dataset.delLang);
          window.location.reload();
        } catch (e) {
          console.error(e);
          alert("No se pudo eliminar el idioma");
        }
      }
    });
  });
}