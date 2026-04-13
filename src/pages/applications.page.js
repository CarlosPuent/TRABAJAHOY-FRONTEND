// Applications Page Controller
import { applicationService } from '@services/application.service';
import { authService } from '@services/auth.service';
import { store } from '@core/store';
import { showLoading, renderNavbar, renderPage } from '@utils/ui.js';

export async function initApplicationsPage(params, query) {
  const user = store.get('user');
  showLoading('Cargando aplicaciones...');

  try {
    const data = await applicationService.getApplications({ limit: 50 });
    const applications = Array.isArray(data) ? data : (data.data || []);
    document.getElementById('app').innerHTML = getApplicationsHTML(user, applications);
    initApplicationsEvents();
  } catch (error) {
    console.error('Error loading applications:', error);
    document.getElementById('app').innerHTML = getApplicationsHTML(user, []);
    initApplicationsEvents();
  }
}

function getStatusBadge(status) {
  const map = {
    pending: { text: 'Pendiente', cls: 'status--pending' },
    reviewed: { text: 'Revisada', cls: 'status--reviewed' },
    interview: { text: 'Entrevista', cls: 'status--interview' },
    accepted: { text: 'Aceptada', cls: 'status--accepted' },
    rejected: { text: 'Rechazada', cls: 'status--rejected' },
  };
  const s = map[status] || { text: status, cls: '' };
  return `<span class="status-badge ${s.cls}">${s.text}</span>`;
}

function getApplicationsHTML(user, applications) {
  const navbar = renderNavbar({ activeRoute: 'candidate/applications', isAuthenticated: true, user });

  const appsHTML = applications.length > 0
    ? applications.map(app => {
        const v = app.vacancy || {};
        return `
          <article class="application-card">
            <div class="application-card__logo">${(v.companyName || 'C')[0]}</div>
            <div class="application-card__info">
              <h3 class="application-card__title">${v.title || 'Puesto'}</h3>
              <p class="application-card__company">${v.companyName || 'Empresa'}</p>
              <p class="application-card__date">Aplicado el ${app.createdAt ? new Date(app.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</p>
            </div>
            <div class="application-card__status">${getStatusBadge(app.status)}</div>
          </article>
        `;
      }).join('')
    : `<div class="empty-state">
        <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
        <h3>No has enviado aplicaciones aún</h3>
        <p>Cuando apliques a un empleo, aparecerá aquí con su estado</p>
        <a href="#/vacancies" class="btn btn--primary" style="margin-top:20px;">Explorar Empleos</a>
       </div>`;

  const mainContent = `
    <div class="container">
      <div class="applications-header">
        <h1 class="applications-title">Mis Aplicaciones</h1>
        <p class="applications-subtitle">${applications.length} aplicacion${applications.length !== 1 ? 'es' : ''} enviada${applications.length !== 1 ? 's' : ''}</p>
      </div>
      <div class="applications-grid">${appsHTML}</div>
    </div>
  `;

  const styles = `
    .applications-page { min-height: calc(100vh - 70px); padding: 40px 0; background: #f9fafb; }
    .applications-header { margin-bottom: 32px; }
    .applications-title { font-size: 28px; font-weight: 700; color: #111827; margin: 0 0 8px; }
    .applications-subtitle { color: #6b7280; margin: 0; }
    .applications-grid { display: grid; gap: 20px; }
    .application-card { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 16px; }
    .application-card__logo { width: 56px; height: 56px; border-radius: 12px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; font-weight: 600; color: #6b7280; font-size: 24px; flex-shrink: 0; }
    .application-card__info { flex: 1; }
    .application-card__title { font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 4px; }
    .application-card__company { font-size: 14px; color: #6b7280; margin: 0 0 4px; }
    .application-card__date { font-size: 13px; color: #9ca3af; margin: 0; }
    .application-card__status { flex-shrink: 0; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500; }
    .status--pending { background: #fef3c7; color: #92400e; }
    .status--reviewed { background: #dbeafe; color: #1e40af; }
    .status--interview { background: #e0e7ff; color: #3730a3; }
    .status--accepted { background: #d1fae5; color: #065f46; }
    .status--rejected { background: #fee2e2; color: #991b1b; }
    .empty-state { text-align: center; padding: 64px 24px; background: white; border-radius: 12px; grid-column: 1 / -1; }
    .empty-state svg { color: #d1d5db; margin-bottom: 16px; }
    .empty-state h3 { font-size: 18px; color: #374151; margin: 0 0 8px; }
    .empty-state p { color: #6b7280; margin: 0; }
  `;

  return renderPage({ navbar, main: mainContent, pageClass: 'applications-page', extraStyles: styles });
}

function initApplicationsEvents() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try { await authService.logout(); window.location.hash = '#/'; } catch (error) { console.error('Logout error:', error); }
    });
  }
}
