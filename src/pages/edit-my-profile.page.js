// Edit My Profile Page Controller - Tab-based modern UI
import { candidateService } from '@services/candidate.service';
import { authService } from '@services/auth.service';
import { store } from '@core/store';
import { showLoading, renderNavbar, renderPage } from '@utils/ui.js';

let currentProfile = null;
let currentExperiences = [];
let currentEducation = [];
let currentSkills = [];
let currentLanguages = [];

export async function initEditMyProfilePage(params, query) {
  const user = store.get('user');
  showLoading('Cargando perfil...');

  try {
    const candidateId = user?.id;
    const [profileData, expData, eduData, skillsData, langData] = await Promise.allSettled([
      candidateService.getProfileById(candidateId).catch(() => null),
      candidateService.getExperiences(candidateId).catch(() => ({ data: [] })),
      candidateService.getEducation(candidateId).catch(() => ({ data: [] })),
      candidateService.getSkills(candidateId).catch(() => ({ data: [] })),
      candidateService.getLanguages(candidateId).catch(() => ({ data: [] })),
    ]);

    currentProfile = profileData.status === 'fulfilled' ? profileData.value?.data : null;
    currentExperiences = expData.status === 'fulfilled' ? expData.value?.data || [] : [];
    currentEducation = eduData.status === 'fulfilled' ? eduData.value?.data || [] : [];
    currentSkills = skillsData.status === 'fulfilled' ? skillsData.value?.data || [] : [];
    currentLanguages = langData.status === 'fulfilled' ? langData.value?.data || [] : [];

    document.getElementById('app').innerHTML = getEditHTML(user);
    initEditEvents();
  } catch (error) {
    console.error('Error loading profile for edit:', error);
    document.getElementById('app').innerHTML = getEditHTML(user);
    initEditEvents();
  }
}

function getEditHTML(user) {
  const navbar = renderNavbar({ activeRoute: 'candidate/profile/edit', isAuthenticated: true, user });
  const p = currentProfile || {};

 

  const tabs = [
    { id: 'tab-personal', label: 'Información Personal', icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>` },
    { id: 'tab-experience', label: 'Experiencia', icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>` },
    { id: 'tab-education', label: 'Educación', icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>` },
    { id: 'tab-skills', label: 'Habilidades', icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>` },
    { id: 'tab-languages', label: 'Idiomas', icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>` },
  ];

  const mainContent = `
    <div class="edit-content">
      <!-- Tabs -->
      <div class="edit-tabs">
        ${tabs.map((t, i) => `<button class="edit-tab${i === 0 ? ' edit-tab--active' : ''}" data-tab="${t.id}"><span class="edit-tab__icon">${t.icon}</span> ${t.label}</button>`).join('')}
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
                <input class="form-input" id="edit-firstName" type="text" value="${user?.firstName || ''}" required />
              </div>
              <div class="form-field">
                <label class="form-label" for="edit-lastName">Apellido</label>
                <input class="form-input" id="edit-lastName" type="text" value="${user?.lastName || ''}" required />
              </div>
            </div>
            <div class="form-field">
              <label class="form-label" for="edit-headline">Título profesional</label>
              <input class="form-input" id="edit-headline" type="text" placeholder="Ej: Desarrollador Full Stack" value="${p.headline || ''}" />
            </div>
            <div class="form-field">
              <label class="form-label" for="edit-bio">Biografía</label>
              <textarea class="form-textarea" id="edit-bio" rows="4" placeholder="Cuéntanos sobre ti...">${p.bio || ''}</textarea>
            </div>
            <div class="form-grid form-grid--2">
              <div class="form-field">
                <label class="form-label" for="edit-location">Ubicación</label>
                <input class="form-input" id="edit-location" type="text" placeholder="Ciudad, País" value="${p.location || ''}" />
              </div>
              <div class="form-field">
                <label class="form-label" for="edit-availability">Disponibilidad</label>
                <select class="form-select" id="edit-availability">
                  <option value="immediately" ${p.availability === 'immediately' ? 'selected' : ''}>Disponible inmediatamente</option>
                  <option value="open" ${p.availability === 'open' ? 'selected' : ''}>Abierto a oportunidades</option>
                  <option value="notLooking" ${p.availability === 'notLooking' ? 'selected' : ''}>No buscando activamente</option>
                </select>
              </div>
            </div>
            <div class="form-grid form-grid--3">
              <div class="form-field">
                <label class="form-label" for="edit-website">Sitio web</label>
                <input class="form-input" id="edit-website" type="url" placeholder="https://..." value="${p.websiteUrl || ''}" />
              </div>
              <div class="form-field">
                <label class="form-label" for="edit-linkedin">LinkedIn</label>
                <input class="form-input" id="edit-linkedin" type="url" placeholder="https://linkedin.com/in/..." value="${p.linkedinUrl || ''}" />
              </div>
              <div class="form-field">
                <label class="form-label" for="edit-github">GitHub</label>
                <input class="form-input" id="edit-github" type="url" placeholder="https://github.com/..." value="${p.githubUrl || ''}" />
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
          <div id="experiences-list">
            ${currentExperiences.length > 0 ? currentExperiences.map((exp, i) => `
              <div class="edit-item" data-id="${exp.id}">
                <div class="edit-item__header">
                  <div>
                    <strong>${exp.position || 'Puesto'}</strong>
                    <span class="edit-item__sub">${exp.companyName || ''}</span>
                  </div>
                  <div class="edit-item__actions">
                    <button class="btn-icon btn-icon--edit" data-edit-exp="${exp.id}" title="Editar">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="btn-icon btn-icon--delete" data-del-exp="${exp.id}" title="Eliminar">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </div>
                <p class="edit-item__meta">${exp.startDate || ''} — ${exp.isCurrent ? 'Presente' : (exp.endDate || '')}${exp.location ? ` · ${exp.location}` : ''}</p>
                ${exp.description ? `<p class="edit-item__desc">${exp.description.substring(0, 120)}${exp.description.length > 120 ? '...' : ''}</p>` : ''}
              </div>
            `).join('') : '<p class="empty-list">No has agregado experiencias aún</p>'}
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
          <div id="education-list">
            ${currentEducation.length > 0 ? currentEducation.map(edu => `
              <div class="edit-item" data-id="${edu.id}">
                <div class="edit-item__header">
                  <div>
                    <strong>${edu.degree || 'Título'}${edu.fieldOfStudy ? ` en ${edu.fieldOfStudy}` : ''}</strong>
                    <span class="edit-item__sub">${edu.institutionName || ''}</span>
                  </div>
                  <div class="edit-item__actions">
                    <button class="btn-icon btn-icon--edit" data-edit-edu="${edu.id}" title="Editar">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="btn-icon btn-icon--delete" data-del-edu="${edu.id}" title="Eliminar">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </div>
                <p class="edit-item__meta">${edu.startDate || ''} — ${edu.isCurrent ? 'Presente' : (edu.endDate || '')}</p>
                ${edu.description ? `<p class="edit-item__desc">${edu.description.substring(0, 120)}${edu.description.length > 120 ? '...' : ''}</p>` : ''}
              </div>
            `).join('') : '<p class="empty-list">No has agregado educación aún</p>'}
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
          <div id="skills-list" class="tags-list">
            ${currentSkills.length > 0 ? currentSkills.map(s => `
              <div class="tag-item">
                <span class="tag-label">${s.name || ''}</span>
                <span class="tag-badge" style="background: ${{beginner:'#fef2f2',intermediate:'#fffbeb',advanced:'#eff6ff',expert:'#ecfdf5'}[s.level]};color: ${{beginner:'#dc2626',intermediate:'#d97706',advanced:'#2563eb',expert:'#059669'}[s.level]};">${{beginner:'Principiante',intermediate:'Intermedio',advanced:'Avanzado',expert:'Experto'}[s.level] || ''}</span>
                <button class="btn-icon btn-icon--delete" data-del-skill="${s.id}" title="Eliminar">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            `).join('') : '<p class="empty-list">No has agregado habilidades aún</p>'}
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
          <div id="languages-list" class="tags-list">
            ${currentLanguages.length > 0 ? currentLanguages.map(l => `
              <div class="tag-item">
                <span class="tag-label">${l.name || ''}</span>
                <span class="tag-badge" style="background: ${{basic:'#fef2f2',intermediate:'#fffbeb',advanced:'#eff6ff',native:'#ecfdf5'}[l.proficiency]};color: ${{basic:'#dc2626',intermediate:'#d97706',advanced:'#2563eb',native:'#059669'}[l.proficiency]};">${{basic:'Básico',intermediate:'Intermedio',advanced:'Avanzado',native:'Nativo'}[l.proficiency] || ''}</span>
                <button class="btn-icon btn-icon--delete" data-del-lang="${l.id}" title="Eliminar">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            `).join('') : '<p class="empty-list">No has agregado idiomas aún</p>'}
          </div>
        </div>
      </div>
    </div>
  `;

  const styles = `
    .edit-page { background: #f3f4f6; }
    .edit-content { max-width: 800px; margin: 0 auto; padding: 32px; }
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
    @media (max-width: 640px) {
      .form-grid--2, .form-grid--3 { grid-template-columns: 1fr; }
    }
  `;

  return renderPage({ navbar, main:  mainContent, pageClass: 'edit-page', extraStyles: styles });
}

function initEditEvents() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try { await authService.logout(); window.location.hash = '#/'; }
      catch (error) { console.error('Logout error:', error); }
    });
  }

  // Tab switching
  document.querySelectorAll('.edit-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.edit-tab').forEach(t => t.classList.remove('edit-tab--active'));
      document.querySelectorAll('.edit-panel').forEach(p => p.classList.remove('edit-panel--active'));
      tab.classList.add('edit-tab--active');
      document.getElementById(tab.dataset.tab)?.classList.add('edit-panel--active');
    });
  });

  // Save personal info
  const personalForm = document.getElementById('form-personal');
  if (personalForm) {
    personalForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = store.get('user');
      const data = {
        headline: document.getElementById('edit-headline').value,
        bio: document.getElementById('edit-bio').value,
        location: document.getElementById('edit-location').value,
        availability: document.getElementById('edit-availability').value,
        websiteUrl: document.getElementById('edit-website').value || null,
        linkedinUrl: document.getElementById('edit-linkedin').value || null,
        githubUrl: document.getElementById('edit-github').value || null,
      };

      const btn = personalForm.querySelector('button[type="submit"]');
      const origText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Guardando...';

      try {
        // Update name
        const firstName = document.getElementById('edit-firstName').value;
        const lastName = document.getElementById('edit-lastName').value;
        if (firstName !== user?.firstName || lastName !== user?.lastName) {
          // Note: API may not support name update via this endpoint
        }

        if (currentProfile?.id) {
          await candidateService.updateProfile(currentProfile.id, data);
        } else {
          await candidateService.createProfile(data);
        }
        btn.textContent = '✓ Guardado';
        setTimeout(() => { btn.textContent = origText; btn.disabled = false; }, 1500);
      } catch (error) {
        console.error('Save error:', error);
        btn.textContent = 'Error al guardar';
        setTimeout(() => { btn.textContent = origText; btn.disabled = false; }, 2000);
      }
    });
  }

  // Add buttons (placeholder - full modal forms would go here)
  const addBtns = { 'add-exp-btn': 'Experiencia', 'add-edu-btn': 'Educación', 'add-skill-btn': 'Habilidad', 'add-lang-btn': 'Idioma' };
  Object.entries(addBtns).forEach(([id, label]) => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => alert(`El formulario para agregar ${label.toLowerCase()} estará disponible próximamente.`));
  });

  // Delete buttons (placeholder)
  document.querySelectorAll('[data-del-exp]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('¿Eliminar esta experiencia?')) {
        try { await candidateService.deleteExperience(btn.dataset.delExp); btn.closest('.edit-item').remove(); }
        catch (e) { console.error(e); }
      }
    });
  });
  document.querySelectorAll('[data-del-edu]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('¿Eliminar esta educación?')) {
        try { await candidateService.deleteEducationItem(btn.dataset.delEdu); btn.closest('.edit-item').remove(); }
        catch (e) { console.error(e); }
      }
    });
  });
  document.querySelectorAll('[data-del-skill]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('¿Eliminar esta habilidad?')) {
        try { await candidateService.deleteSkill(btn.dataset.delSkill); btn.closest('.tag-item').remove(); }
        catch (e) { console.error(e); }
      }
    });
  });
  document.querySelectorAll('[data-del-lang]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('¿Eliminar este idioma?')) {
        try { await candidateService.deleteLanguage(btn.dataset.delLang); btn.closest('.tag-item').remove(); }
        catch (e) { console.error(e); }
      }
    });
  });
}
