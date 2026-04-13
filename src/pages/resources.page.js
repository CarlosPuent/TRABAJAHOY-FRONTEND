// Resources Page Controller
import { resourceService } from '@services/resource.service';
import { authService } from '@services/auth.service';
import { store } from '@core/store';
import { showLoading, renderNavbar, renderPage } from '@utils/ui.js';

export async function initResourcesPage(params, query) {
  const isAuthenticated = store.get('isAuthenticated');
  const user = store.get('user');

  showLoading('Cargando recursos...');

  try {
    const [resData, catData] = await Promise.all([
      resourceService.getResources({ limit: 20 }).catch(() => ({ data: [] })),
      resourceService.getCategories().catch(() => ({ data: [] })),
    ]);
    const resources = resData.data || [];
    const categories = catData.data || [];
    document.getElementById('app').innerHTML = getResourcesHTML(resources, categories, isAuthenticated, user);
    initResourcesEvents();
  } catch (error) {
    console.error('Error loading resources:', error);
    document.getElementById('app').innerHTML = getResourcesHTML([], [], isAuthenticated, user);
    initResourcesEvents();
  }
}

function getResourcesHTML(resources, categories, isAuthenticated, user) {
  const navbar = renderNavbar({ activeRoute: 'resources', isAuthenticated, user });

  const resHTML = resources.length > 0
    ? resources.map(r => `
        <article class="resource-card">
          <div class="resource-card__category">${r.category?.name || ''}</div>
          <h3 class="resource-card__title">${r.title || 'Sin título'}</h3>
          <p class="resource-card__excerpt">${r.excerpt || r.content?.substring(0, 150) || ''}</p>
          <div class="resource-card__meta">
            ${r.readTimeMinutes ? `<span>${r.readTimeMinutes} min</span>` : ''}
            ${r.averageRating ? `<span>★ ${r.averageRating}</span>` : ''}
          </div>
          <a href="#/resources/${r.id}" class="btn btn--sm btn--primary">Leer más</a>
        </article>
      `).join('')
    : `<div class="empty-state">
        <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
        <h3>No hay recursos disponibles</h3>
        <p>Vuelve más tarde</p>
       </div>`;

  const mainContent = `
    <div class="container">
      <h1 class="resources-title">Recursos</h1>
      <p class="resources-subtitle">Artículos y guías para impulsar tu carrera profesional</p>
      ${categories.length > 0 ? `<div class="resources-categories">${categories.map(c => `<span class="category-tag">${c.name}</span>`).join('')}</div>` : ''}
      <div class="resources-grid">${resHTML}</div>
    </div>
  `;

  const styles = `
    .resources-page { min-height: calc(100vh - 70px); padding: 40px 0; background: #f9fafb; }
    .resources-title { font-size: 32px; font-weight: 700; color: #111827; margin: 0 0 8px; }
    .resources-subtitle { color: #6b7280; margin: 0 0 32px; font-size: 16px; }
    .resources-categories { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 32px; }
    .category-tag { padding: 6px 16px; background: white; border: 1px solid #e5e7eb; border-radius: 9999px; font-size: 14px; color: #374151; }
    .resources-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
    .resource-card { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: flex; flex-direction: column; }
    .resource-card__category { font-size: 12px; color: #3b82f6; font-weight: 600; text-transform: uppercase; margin-bottom: 8px; }
    .resource-card__title { font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 8px; }
    .resource-card__excerpt { font-size: 14px; color: #6b7280; line-height: 1.6; margin: 0 0 12px; flex: 1; }
    .resource-card__meta { font-size: 13px; color: #9ca3af; margin: 0 0 16px; display: flex; gap: 12px; }
    .empty-state { text-align: center; padding: 64px 24px; background: white; border-radius: 12px; grid-column: 1 / -1; }
    .empty-state svg { color: #d1d5db; margin-bottom: 16px; }
    .empty-state h3 { font-size: 18px; color: #374151; margin: 0 0 8px; }
    .empty-state p { color: #6b7280; margin: 0; }
    @media (max-width: 768px) { .resources-grid { grid-template-columns: 1fr; } }
  `;

  return renderPage({ navbar, main: mainContent, pageClass: 'resources-page', extraStyles: styles });
}

function initResourcesEvents() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try { await authService.logout(); window.location.hash = '#/'; } catch (error) { console.error('Logout error:', error); }
    });
  }
}
