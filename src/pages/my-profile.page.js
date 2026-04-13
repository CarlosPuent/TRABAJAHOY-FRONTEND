// My Profile Page Controller
import { candidateService } from '@services/candidate.service';
import { authService } from '@services/auth.service';
import { store } from '@core/store';
import { showLoading, renderNavbar, renderPage } from '@utils/ui.js';

export async function initMyProfilePage(params, query) {
  const user = store.get('user');
  showLoading('Cargando perfil...');

  try {
    const candidateId = user?.id;
    const [profileData, experiencesData, educationData, skillsData, languagesData] = await Promise.allSettled([
      candidateService.getProfileById(candidateId).catch(() => null),
      candidateService.getExperiences(candidateId).catch(() => ({ data: [] })),
      candidateService.getEducation(candidateId).catch(() => ({ data: [] })),
      candidateService.getSkills(candidateId).catch(() => ({ data: [] })),
      candidateService.getLanguages(candidateId).catch(() => ({ data: [] })),
    ]);

    const profile = profileData.status === 'fulfilled' ? profileData.value?.data : null;
    const experiences = experiencesData.status === 'fulfilled' ? experiencesData.value?.data || [] : [];
    const education = educationData.status === 'fulfilled' ? educationData.value?.data || [] : [];
    const skills = skillsData.status === 'fulfilled' ? skillsData.value?.data || [] : [];
    const languages = languagesData.status === 'fulfilled' ? languagesData.value?.data || [] : [];

    document.getElementById('app').innerHTML = getProfileHTML(user, profile, experiences, education, skills, languages);
    initProfileEvents();
  } catch (error) {
    console.error('Error loading profile:', error);
    document.getElementById('app').innerHTML = getProfileHTML(user, null, [], [], [], []);
    initProfileEvents();
  }
}

function getProfileHTML(user, profile, experiences, education, skills, languages) {
  const navbar = renderNavbar({ activeRoute: 'candidate/profile', isAuthenticated: true, user });
  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Usuario';
  const headline = profile?.headline || 'Define tu título profesional';
  const bio = profile?.bio || 'Aún no has escrito tu biografía profesional.';
  const location = profile?.location || 'Sin ubicación';
  const availability = profile?.availability || 'notLooking';
  const websiteUrl = profile?.websiteUrl || '';
  const linkedinUrl = profile?.linkedinUrl || '';
  const githubUrl = profile?.githubUrl || '';
  const email = user?.email || '';

  const availabilityLabels = {
    immediately: { text: 'Disponible inmediatamente', color: '#10b981', bg: '#d1fae5' },
    open: { text: 'Abierto a oportunidades', color: '#3b82f6', bg: '#dbeafe' },
    notLooking: { text: 'No buscando activamente', color: '#6b7280', bg: '#f3f4f6' },
  };
  const avail = availabilityLabels[availability] || availabilityLabels.notLooking;

  const levelLabels = { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado', expert: 'Experto' };
  const proficiencyLabels = { basic: 'Básico', intermediate: 'Intermedio', advanced: 'Avanzado', native: 'Nativo' };
  const levelColors = { beginner: '#ef4444', intermediate: '#f59e0b', advanced: '#3b82f6', expert: '#10b981' };
  const profColors = { basic: '#ef4444', intermediate: '#f59e0b', advanced: '#3b82f6', native: '#10b981' };

  const mainContent = `
    <div class="profile-content">
      <!-- Profile Header Card -->
      <div class="profile-card profile-card--header">
        <div class="profile-cover">
          <div class="profile-cover__gradient"></div>
        </div>
        <div class="profile-avatar-wrapper">
          <div class="profile-avatar-lg">${(user?.firstName || 'U')[0]}</div>
        </div>
        <div class="profile-header-top">
          <div class="profile-header-info">
            <h1 class="profile-headline">${headline}</h1>
            <div class="profile-meta">
              <span class="profile-meta-item">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                ${location}
              </span>
              <span class="profile-meta-item">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                ${email}
              </span>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
            <span class="availability-badge" style="background: ${avail.bg}; color: ${avail.color};">${avail.text}</span>
            <a href="#/candidate/profile/edit" class="btn btn--outline btn--sm">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              Editar perfil
            </a>
          </div>
        </div>
        <div class="profile-bio">${bio}</div>
        ${(websiteUrl || linkedinUrl || githubUrl) ? `
          <div class="profile-links">
            ${websiteUrl ? `<a href="${websiteUrl}" target="_blank" class="profile-link" rel="noopener">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
              Sitio web
            </a>` : ''}
            ${linkedinUrl ? `<a href="${linkedinUrl}" target="_blank" class="profile-link" rel="noopener">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              LinkedIn
            </a>` : ''}
            ${githubUrl ? `<a href="${githubUrl}" target="_blank" class="profile-link" rel="noopener">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              GitHub
            </a>` : ''}
          </div>
        ` : ''}
      </div>

      <!-- Stats Row -->
      <div class="profile-stats">
        <div class="profile-stat">
          <div class="profile-stat__icon" style="color: #3b82f6;">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
          </div>
          <div class="profile-stat__value">${experiences.length}</div>
          <div class="profile-stat__label">Experiencias</div>
        </div>
        <div class="profile-stat">
          <div class="profile-stat__icon" style="color: #10b981;">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
          </div>
          <div class="profile-stat__value">${education.length}</div>
          <div class="profile-stat__label">Educación</div>
        </div>
        <div class="profile-stat">
          <div class="profile-stat__icon" style="color: #f59e0b;">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          </div>
          <div class="profile-stat__value">${skills.length}</div>
          <div class="profile-stat__label">Habilidades</div>
        </div>
        <div class="profile-stat">
          <div class="profile-stat__icon" style="color: #8b5cf6;">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
          </div>
          <div class="profile-stat__value">${languages.length}</div>
          <div class="profile-stat__label">Idiomas</div>
        </div>
      </div>

      <!-- Experiences -->
      ${experiences.length > 0 ? `
        <div class="profile-card">
          <div class="profile-card__header">
            <h2 class="profile-card__title">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
              Experiencia Laboral
            </h2>
          </div>
          <div class="profile-timeline">
            ${experiences.map(exp => `
              <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <div class="timeline-header">
                    <div>
                      <h3 class="timeline-title">${exp.position || 'Puesto'}</h3>
                      <p class="timeline-company">${exp.companyName || 'Empresa'}${exp.location ? ` · ${exp.location}` : ''}</p>
                    </div>
                    <span class="timeline-date">${formatDate(exp.startDate)} — ${exp.isCurrent ? 'Presente' : formatDate(exp.endDate)}</span>
                  </div>
                  ${exp.description ? `<p class="timeline-desc">${exp.description}</p>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Education -->
      ${education.length > 0 ? `
        <div class="profile-card">
          <div class="profile-card__header">
            <h2 class="profile-card__title">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
              Educación
            </h2>
          </div>
          <div class="profile-timeline">
            ${education.map(edu => `
              <div class="timeline-item">
                <div class="timeline-dot" style="background: #10b981;"></div>
                <div class="timeline-content">
                  <div class="timeline-header">
                    <div>
                      <h3 class="timeline-title">${edu.degree || 'Título'}${edu.fieldOfStudy ? ` en ${edu.fieldOfStudy}` : ''}</h3>
                      <p class="timeline-company">${edu.institutionName || 'Institución'}</p>
                    </div>
                    <span class="timeline-date">${formatDate(edu.startDate)} — ${edu.isCurrent ? 'Presente' : formatDate(edu.endDate)}</span>
                  </div>
                  ${edu.description ? `<p class="timeline-desc">${edu.description}</p>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Skills -->
      ${skills.length > 0 ? `
        <div class="profile-card">
          <div class="profile-card__header">
            <h2 class="profile-card__title">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              Habilidades
            </h2>
          </div>
          <div class="skills-grid">
            ${skills.map(s => {
              const pct = { beginner: 25, intermediate: 50, advanced: 75, expert: 100 }[s.level] || 50;
              const clr = levelColors[s.level] || '#3b82f6';
              return `
                <div class="skill-item">
                  <div class="skill-header">
                    <span class="skill-name">${s.name || 'Habilidad'}</span>
                    <span class="skill-level" style="color: ${clr};">${levelLabels[s.level] || ''}</span>
                  </div>
                  <div class="skill-bar">
                    <div class="skill-bar__fill" style="width: ${pct}%; background: ${clr};"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Languages -->
      ${languages.length > 0 ? `
        <div class="profile-card">
          <div class="profile-card__header">
            <h2 class="profile-card__title">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
              Idiomas
            </h2>
          </div>
          <div class="languages-grid">
            ${languages.map(l => `
              <div class="language-item">
                <span class="language-name">${l.name || 'Idioma'}</span>
                <span class="language-level" style="background: ${profColors[l.proficiency] || '#6b7280'}20; color: ${profColors[l.proficiency] || '#6b7280'};">${proficiencyLabels[l.proficiency] || ''}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Empty states -->
      ${experiences.length === 0 && education.length === 0 && skills.length === 0 && languages.length === 0 ? `
        <div class="profile-card profile-card--empty">
          <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="#d1d5db" stroke-width="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <h3>Tu perfil está vacío</h3>
          <p>Completa tu información profesional para destacar ante los empleadores</p>
          <a href="#/candidate/profile/edit" class="btn btn--primary" style="margin-top: 20px;">Editar mi perfil</a>
        </div>
      ` : ''}
    </div>
  `;

  const styles = `
    .profile-page { background: #f3f4f6; }
    .profile-content { max-width: 900px; margin: 0 auto; padding: 32px; }
    .profile-card { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom: 24px; overflow: hidden; }
    .profile-card--header { padding: 0; position: relative; }
    .profile-cover { height: 160px; position: relative; overflow: hidden; border-radius: 12px 12px 0 0; }
    .profile-cover__gradient { position: absolute; inset: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #3b82f6 100%); }
    .profile-avatar-wrapper { position: absolute; top: 100px; left: 32px; }
    .profile-avatar-lg { width: 112px; height: 112px; border-radius: 50%; background: white; border: 4px solid white; display: flex; align-items: center; justify-content: center; font-size: 42px; font-weight: 700; color: #3b82f6; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .profile-header-top { padding: 72px 32px 32px; }
    .profile-card--empty { text-align: center; padding: 64px 32px; }
    .profile-card--empty svg { margin-bottom: 16px; }
    .profile-card--empty h3 { font-size: 18px; color: #374151; margin: 0 0 8px; }
    .profile-card--empty p { color: #6b7280; margin: 0 0 16px; }
    .profile-card__header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid #f3f4f6; }
    .profile-card__title { display: flex; align-items: center; gap: 10px; font-size: 18px; font-weight: 600; color: #111827; margin: 0; }
    .profile-card__title svg { color: #3b82f6; }
    .profile-header-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
    .profile-headline { font-size: 24px; font-weight: 700; color: #111827; margin: 0 0 12px; }
    .profile-meta { display: flex; flex-wrap: wrap; gap: 16px; }
    .profile-meta-item { display: flex; align-items: center; gap: 6px; font-size: 14px; color: #6b7280; }
    .profile-meta-item svg { color: #9ca3af; }
    .availability-badge { display: inline-block; padding: 6px 16px; border-radius: 9999px; font-size: 13px; font-weight: 500; white-space: nowrap; }
    .profile-bio { font-size: 15px; color: #4b5563; line-height: 1.7; margin-top: 20px; }
    .profile-links { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #f3f4f6; }
    .profile-link { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: #f9fafb; border-radius: 8px; color: #374151; font-size: 13px; font-weight: 500; text-decoration: none; transition: all 0.15s; }
    .profile-link:hover { background: #eff6ff; color: #2563eb; }
    .profile-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .profile-stat { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); text-align: center; }
    .profile-stat__icon { margin-bottom: 8px; }
    .profile-stat__value { font-size: 28px; font-weight: 700; color: #111827; }
    .profile-stat__label { font-size: 13px; color: #6b7280; margin-top: 4px; }
    .profile-timeline { padding: 24px; }
    .timeline-item { display: flex; gap: 16px; padding-bottom: 24px; position: relative; }
    .timeline-item:last-child { padding-bottom: 0; }
    .timeline-item:not(:last-child)::after { content: ''; position: absolute; left: 7px; top: 24px; bottom: 0; width: 2px; background: #e5e7eb; }
    .timeline-dot { width: 16px; height: 16px; border-radius: 50%; background: #3b82f6; flex-shrink: 0; margin-top: 4px; }
    .timeline-content { flex: 1; }
    .timeline-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; margin-bottom: 8px; }
    .timeline-title { font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 4px; }
    .timeline-company { font-size: 14px; color: #6b7280; margin: 0; }
    .timeline-date { font-size: 13px; color: #9ca3af; white-space: nowrap; }
    .timeline-desc { font-size: 14px; color: #4b5563; line-height: 1.6; margin: 8px 0 0; }
    .skills-grid { padding: 24px; display: grid; gap: 20px; }
    .skill-item { }
    .skill-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .skill-name { font-size: 14px; font-weight: 500; color: #374151; }
    .skill-level { font-size: 12px; font-weight: 500; }
    .skill-bar { height: 8px; background: #f3f4f6; border-radius: 9999px; overflow: hidden; }
    .skill-bar__fill { height: 100%; border-radius: 9999px; transition: width 0.5s ease; }
    .languages-grid { padding: 24px; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
    .language-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #f9fafb; border-radius: 8px; }
    .language-name { font-size: 14px; font-weight: 500; color: #374151; }
    .language-level { font-size: 12px; font-weight: 500; padding: 4px 10px; border-radius: 9999px; }
    @media (max-width: 1024px) {
      .profile-layout { grid-template-columns: 1fr; }
      .profile-sidebar { display: none; }
      .profile-content { padding: 24px 16px; }
      .profile-stats { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 640px) {
      .profile-stats { grid-template-columns: 1fr 1fr; }
      .profile-header-top { flex-direction: column; }
    }
  `;

  return renderPage({ navbar, main: mainContent, pageClass: 'profile-page', extraStyles: styles });
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr + '-01').toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

function initProfileEvents() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try { await authService.logout(); window.location.hash = '#/'; }
      catch (error) { console.error('Logout error:', error); }
    });
  }
}
