// Candidate Dashboard Page Controller
import { authService } from '@services/auth.service';
import { vacancyService } from '@services/vacancy.service';
import { applicationService } from '@services/application.service';
import { store } from '@core/store';
import { showLoading, renderNavbar, renderPage } from '@utils/ui.js';

let dashboardData = { vacancies: [], savedJobs: [], applications: [] };

const styles = `
  .dashboard-layout { display: flex; min-height: calc(100vh - 70px); background: #f3f4f6; }
  .dashboard-sidebar {
    width: 260px; flex-shrink: 0; background: white; border-right: 1px solid #e5e7eb;
    position: sticky; top: 70px; height: calc(100vh - 70px); overflow-y: auto;
    display: flex; flex-direction: column;
  }
  .dashboard-sidebar__brand { padding: 24px 20px; border-bottom: 1px solid #f3f4f6; }
  .dashboard-sidebar__brand-title { font-size: 16px; font-weight: 700; color: #111827; margin: 0 0 2px; }
  .dashboard-sidebar__brand-sub { font-size: 12px; color: #6b7280; margin: 0; }
  .dashboard-sidebar__nav { padding: 16px 0; flex: 1; }
  .dashboard-sidebar__link {
    display: flex; align-items: center; gap: 12px; padding: 11px 20px;
    color: #6b7280; text-decoration: none; font-size: 14px; font-weight: 500;
    transition: all 0.15s; border-right: 3px solid transparent; cursor: pointer;
  }
  .dashboard-sidebar__link:hover { background: #f9fafb; color: #111827; }
  .dashboard-sidebar__link--active { background: #eff6ff; color: #2563eb; border-right-color: #2563eb; }
  .dashboard-main { flex: 1; padding: 32px; min-width: 0; }
  .dashboard-main__title { font-size: 24px; font-weight: 700; color: #111827; margin: 0 0 4px; }
  .dashboard-main__subtitle { color: #6b7280; margin: 0 0 28px; font-size: 14px; }
  .dashboard-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 28px; }
  .dashboard-stat { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
  .dashboard-stat__icon { color: #3b82f6; margin-bottom: 8px; }
  .dashboard-stat__value { font-size: 26px; font-weight: 700; color: #111827; }
  .dashboard-stat__label { font-size: 12px; color: #6b7280; margin-top: 4px; }
  .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
  .dashboard-card { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); overflow: hidden; }
  .dashboard-card__header { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-bottom: 1px solid #f3f4f6; }
  .dashboard-card__title { font-size: 15px; font-weight: 600; color: #111827; margin: 0; }
  .dashboard-card__link { color: #3b82f6; text-decoration: none; font-size: 13px; font-weight: 500; }
  .dashboard-card__link:hover { text-decoration: underline; }
  .dashboard-card__body { padding: 14px 18px; }
  .detail-card { padding: 16px; border: 1px solid #f3f4f6; border-radius: 10px; margin-bottom: 12px; transition: all 0.15s; }
  .detail-card:hover { border-color: #e5e7eb; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
  .detail-card:last-child { margin-bottom: 0; }
  .detail-card__header { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
  .detail-card__logo { width: 44px; height: 44px; border-radius: 10px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; font-weight: 600; color: #6b7280; font-size: 18px; flex-shrink: 0; }
  .detail-card__info { flex: 1; min-width: 0; }
  .detail-card__title { font-size: 14px; font-weight: 600; color: #111827; margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .detail-card__company { font-size: 12px; color: #6b7280; margin: 0; }
  .detail-card__tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
  .detail-tag { padding: 3px 10px; background: #f3f4f6; border-radius: 9999px; font-size: 11px; font-weight: 500; color: #4b5563; text-transform: capitalize; }
  .detail-card__salary { font-size: 14px; font-weight: 600; color: #10b981; margin: 0 0 10px; }
  .detail-card__actions { display: flex; gap: 8px; }
  .detail-card__bottom { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
  .detail-date { font-size: 12px; color: #9ca3af; }
  .status-badge { display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 500; }
  .status--pending { background: #fef3c7; color: #92400e; }
  .status--reviewed { background: #dbeafe; color: #1e40af; }
  .status--interview { background: #e0e7ff; color: #3730a3; }
  .status--accepted { background: #d1fae5; color: #065f46; }
  .status--rejected { background: #fee2e2; color: #991b1b; }
  .empty-state { text-align: center; color: #9ca3af; padding: 24px 0; font-size: 13px; }
  .section-panel { }
  @media (max-width: 1024px) {
    .dashboard-layout { flex-direction: column; }
    .dashboard-sidebar { width: 100%; position: static; height: auto; border-right: none; border-bottom: 1px solid #e5e7eb; }
    .dashboard-sidebar__brand { display: none; }
    .dashboard-sidebar__nav { display: flex; flex-direction: row; overflow-x: auto; padding: 8px 0; gap: 0; }
    .dashboard-sidebar__link { border-right: none; border-bottom: 3px solid transparent; white-space: nowrap; padding: 10px 16px; }
    .dashboard-sidebar__link--active { border-bottom-color: #2563eb; }
    .dashboard-main { padding: 20px 16px; }
  }
`;

export async function initCandidateDashboardPage(params, query) {
  const user = store.get('user');
  showLoading('Cargando panel...');

  try {
    const [vacanciesData, savedJobsData, applicationsData] = await Promise.all([
      vacancyService.getVacancies({ limit: 5 }).catch(() => []),
      applicationService.getSavedJobs().catch(() => []),
      applicationService.getApplications({ limit: 5 }).catch(() => []),
    ]);

    dashboardData.vacancies = Array.isArray(vacanciesData) ? vacanciesData : (vacanciesData.data || []);
    dashboardData.savedJobs = Array.isArray(savedJobsData) ? savedJobsData : (savedJobsData.data || []);
    dashboardData.applications = Array.isArray(applicationsData) ? applicationsData : (applicationsData.data || []);

    document.getElementById('app').innerHTML = renderDashboardPage(user);
    initDashboardEvents();
  } catch (error) {
    console.error('Error loading dashboard:', error);
    document.getElementById('app').innerHTML = renderDashboardPage(user);
    initDashboardEvents();
  }
}

function renderDashboardPage(user) {
  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Usuario';
  const navbar = renderNavbar({ activeRoute: 'candidate/dashboard', isAuthenticated: true, user });

  const sidebarHTML = `
    <aside class="dashboard-sidebar">
      <div class="dashboard-sidebar__brand">
        <h3 class="dashboard-sidebar__brand-title">TrabajaHoy</h3>
        <p class="dashboard-sidebar__brand-sub">Panel de Candidato</p>
      </div>
      <nav class="dashboard-sidebar__nav">
        <a href="#panel:overview" class="dashboard-sidebar__link dashboard-sidebar__link--active" data-panel="overview">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          Resumen
        </a>
        <a href="#/candidate/profile" class="dashboard-sidebar__link">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          Mi Perfil
        </a>
        <a href="#/candidate/profile/edit" class="dashboard-sidebar__link">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          Editar Perfil
        </a>
        <a href="#/candidate/cv" class="dashboard-sidebar__link">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
          Mi CV
        </a>
        <a href="#panel:saved" class="dashboard-sidebar__link" data-panel="saved">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
          Empleos Guardados
        </a>
        <a href="#panel:applications" class="dashboard-sidebar__link" data-panel="applications">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          Mis Aplicaciones
        </a>
        <div style="border-top:1px solid #f3f4f6;margin:8px 0;"></div>
        <a href="#/vacancies" class="dashboard-sidebar__link">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          Buscar Empleos
        </a>
      </nav>
    </aside>
  `;

  const d = dashboardData;

  // Overview panel
  const overviewHTML = `
    <div class="section-panel" id="panel-overview">
      <h1 class="dashboard-main__title">Bienvenido, ${fullName}</h1>
      <p class="dashboard-main__subtitle">Resumen de tu actividad</p>
      <div class="dashboard-stats">
        <div class="dashboard-stat">
          <div class="dashboard-stat__icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg></div>
          <div class="dashboard-stat__value">${d.savedJobs.length}</div>
          <div class="dashboard-stat__label">Empleos Guardados</div>
        </div>
        <div class="dashboard-stat">
          <div class="dashboard-stat__icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg></div>
          <div class="dashboard-stat__value">${d.applications.length}</div>
          <div class="dashboard-stat__label">Aplicaciones Enviadas</div>
        </div>
        <div class="dashboard-stat">
          <div class="dashboard-stat__icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></div>
          <div class="dashboard-stat__value">${d.vacancies.length}</div>
          <div class="dashboard-stat__label">Recomendados</div>
        </div>
      </div>
      <div class="dashboard-grid">
        <div class="dashboard-card">
          <div class="dashboard-card__header"><h2 class="dashboard-card__title">Empleos Recomendados</h2><a href="#/vacancies" class="dashboard-card__link">Ver todos →</a></div>
          <div class="dashboard-card__body">
            ${d.vacancies.length ? d.vacancies.map(v => {
              const modLabels = { remote: 'Remoto', hybrid: 'Híbrido', onsite: 'Presencial' };
              return `<div class="detail-card">
                <div class="detail-card__header">
                  <div class="detail-card__logo">${(v.companyName||'C')[0]}</div>
                  <div class="detail-card__info">
                    <p class="detail-card__title">${v.title||'Puesto'}</p>
                    <p class="detail-card__company">${v.companyName||'Empresa'}${v.city?` · ${v.city}`:''}</p>
                  </div>
                </div>
                <div class="detail-card__tags">
                  ${v.modality?`<span class="detail-tag">${modLabels[v.modality]||v.modality}</span>`:''}
                  ${v.type?`<span class="detail-tag">${v.type}</span>`:''}
                  ${v.level?`<span class="detail-tag">${v.level}</span>`:''}
                </div>
                ${v.salaryMin?`<p class="detail-card__salary">$${v.salaryMin.toLocaleString()} - $${(v.salaryMax||v.salaryMin).toLocaleString()} ${v.currency||''}</p>`:''}
                <div class="detail-card__actions">
                  <a href="#/vacancies/${v.id}" class="btn btn--sm btn--primary">Ver Detalles</a>
                  <a href="#/vacancies/${v.id}" class="btn btn--sm btn--outline">Aplicar</a>
                </div>
              </div>`;
            }).join('') : '<p class="empty-state">Sin recomendaciones aún</p>'}
          </div>
        </div>
        <div class="dashboard-card">
          <div class="dashboard-card__header"><h2 class="dashboard-card__title">Empleos Guardados</h2><a href="#panel:saved" class="dashboard-card__link" data-panel="saved">Ver todos →</a></div>
          <div class="dashboard-card__body">
            ${d.savedJobs.length ? d.savedJobs.map(j => {
              const v = j.vacancy||{};
              return `<div class="detail-card">
                <div class="detail-card__header">
                  <div class="detail-card__logo">${(v.companyName||'C')[0]}</div>
                  <div class="detail-card__info">
                    <p class="detail-card__title">${v.title||'Puesto'}</p>
                    <p class="detail-card__company">${v.companyName||''}${v.city?` · ${v.city}`:''}</p>
                  </div>
                </div>
                <div class="detail-card__actions">
                  <a href="#/vacancies/${j.vacancyId}" class="btn btn--sm btn--primary">Ver Detalles</a>
                </div>
              </div>`;
            }).join('') : '<p class="empty-state">Sin empleos guardados</p>'}
          </div>
        </div>
        <div class="dashboard-card">
          <div class="dashboard-card__header"><h2 class="dashboard-card__title">Mis Aplicaciones</h2><a href="#panel:applications" class="dashboard-card__link" data-panel="applications">Ver todas →</a></div>
          <div class="dashboard-card__body">
            ${d.applications.length ? d.applications.map(a => {
              const v = a.vacancy||{};
              return `<div class="detail-card">
                <div class="detail-card__header">
                  <div class="detail-card__logo">${(v.companyName||'C')[0]}</div>
                  <div class="detail-card__info">
                    <p class="detail-card__title">${v.title||'Puesto'}</p>
                    <p class="detail-card__company">${v.companyName||''}</p>
                  </div>
                </div>
                <div class="detail-card__bottom">
                  <span class="status-badge status--${a.status}">${getStatusText(a.status)}</span>
                  ${a.createdAt?`<span class="detail-date">${new Date(a.createdAt).toLocaleDateString('es-ES',{day:'numeric',month:'short'})}</span>`:''}
                </div>
              </div>`;
            }).join('') : '<p class="empty-state">Sin aplicaciones</p>'}
          </div>
        </div>
      </div>
    </div>
  `;

  // Saved jobs panel
  const savedHTML = `
    <div class="section-panel" id="panel-saved" style="display:none;">
      <h1 class="dashboard-main__title">Empleos Guardados</h1>
      <p class="dashboard-main__subtitle">${d.savedJobs.length} empleo${d.savedJobs.length!==1?'s':''} guardado${d.savedJobs.length!==1?'s':''}</p>
      ${d.savedJobs.length ? `<div class="dashboard-grid">${d.savedJobs.map(j => {
        const v = j.vacancy||{};
        const modLabels = { remote: 'Remoto', hybrid: 'Híbrido', onsite: 'Presencial' };
        return `<div class="dashboard-card"><div class="dashboard-card__body">
          <div class="detail-card" style="border:none;padding:0;margin:0;">
            <div class="detail-card__header">
              <div class="detail-card__logo">${(v.companyName||'C')[0]}</div>
              <div class="detail-card__info">
                <p class="detail-card__title">${v.title||'Puesto'}</p>
                <p class="detail-card__company">${v.companyName||''}${v.city?` · ${v.city}`:''}</p>
              </div>
            </div>
            <div class="detail-card__tags">
              ${v.modality?`<span class="detail-tag">${modLabels[v.modality]||v.modality}</span>`:''}
              ${v.type?`<span class="detail-tag">${v.type}</span>`:''}
            </div>
            ${v.salaryMin?`<p class="detail-card__salary">$${v.salaryMin.toLocaleString()} - $${(v.salaryMax||v.salaryMin).toLocaleString()} ${v.currency||''}</p>`:''}
            <div class="detail-card__actions">
              <a href="#/vacancies/${v.id}" class="btn btn--sm btn--primary">Ver Detalles</a>
            </div>
          </div>
        </div></div>`;
      }).join('')}</div>` : '<div class="dashboard-card"><div class="dashboard-card__body"><p class="empty-state" style="padding:40px 0;">No tienes empleos guardados</p></div></div>'}
    </div>
  `;

  // Applications panel
  const appsHTML = `
    <div class="section-panel" id="panel-applications" style="display:none;">
      <h1 class="dashboard-main__title">Mis Aplicaciones</h1>
      <p class="dashboard-main__subtitle">${d.applications.length} aplicacion${d.applications.length!==1?'es':''}</p>
      ${d.applications.length ? `<div class="dashboard-grid">${d.applications.map(a => {
        const v = a.vacancy||{};
        const modLabels = { remote: 'Remoto', hybrid: 'Híbrido', onsite: 'Presencial' };
        return `<div class="dashboard-card"><div class="dashboard-card__body">
          <div class="detail-card" style="border:none;padding:0;margin:0;">
            <div class="detail-card__header">
              <div class="detail-card__logo">${(v.companyName||'C')[0]}</div>
              <div class="detail-card__info">
                <p class="detail-card__title">${v.title||'Puesto'}</p>
                <p class="detail-card__company">${v.companyName||''}${v.city?` · ${v.city}`:''}</p>
              </div>
            </div>
            <div class="detail-card__tags">
              ${v.modality?`<span class="detail-tag">${modLabels[v.modality]||v.modality}</span>`:''}
              ${v.type?`<span class="detail-tag">${v.type}</span>`:''}
            </div>
            ${v.salaryMin?`<p class="detail-card__salary">$${v.salaryMin.toLocaleString()} - $${(v.salaryMax||v.salaryMin).toLocaleString()} ${v.currency||''}</p>`:''}
            <div class="detail-card__bottom">
              <span class="status-badge status--${a.status}">${getStatusText(a.status)}</span>
              <span class="detail-date">Aplicado el ${a.createdAt?new Date(a.createdAt).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'}):'—'}</span>
            </div>
          </div>
        </div></div>`;
      }).join('')}</div>` : '<div class="dashboard-card"><div class="dashboard-card__body"><p class="empty-state" style="padding:40px 0;">No has enviado aplicaciones</p></div></div>'}
    </div>
  `;

  const mainContent = overviewHTML + savedHTML + appsHTML;

  return renderPage({
    navbar,
    main: `<div class="dashboard-layout">${sidebarHTML}<div class="dashboard-main">${mainContent}</div></div>`,
    extraStyles: styles,
  });
}

function getStatusText(status) {
  const map = { pending:'Pendiente', reviewed:'Revisada', interview:'Entrevista', accepted:'Aceptada', rejected:'Rechazada' };
  return map[status] || status;
}

function initDashboardEvents() {
  document.querySelectorAll('.dashboard-sidebar__link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const panel = link.dataset.panel;
      if (!panel) { window.location.hash = link.getAttribute('href'); return; }
      document.querySelectorAll('.dashboard-sidebar__link').forEach(l => l.classList.remove('dashboard-sidebar__link--active'));
      link.classList.add('dashboard-sidebar__link--active');
      document.querySelectorAll('.section-panel').forEach(p => p.style.display = 'none');
      const target = document.getElementById(`panel-${panel}`);
      if (target) target.style.display = 'block';
      window.scrollTo(0, 0);
    });
  });

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try { await authService.logout(); window.location.hash = '#/'; }
      catch (error) { console.error('Logout error:', error); }
    });
  }
}
