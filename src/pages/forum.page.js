// Forum Page Controller
import { forumService } from '@services/forum.service';
import { authService } from '@services/auth.service';
import { store } from '@core/store';
import { showLoading, renderNavbar, renderPage } from '@utils/ui.js';

export async function initForumPage(params, query) {
  const isAuthenticated = store.get('isAuthenticated');
  const user = store.get('user');

  showLoading('Cargando foro...');

  try {
    const [threadsData, catData] = await Promise.all([
      forumService.getThreads({ limit: 20 }).catch(() => ({ data: [] })),
      forumService.getCategories().catch(() => ({ data: [] })),
    ]);
    const threads = threadsData.data || [];
    const categories = catData.data || [];
    document.getElementById('app').innerHTML = getForumHTML(threads, categories, isAuthenticated, user);
    initForumEvents();
  } catch (error) {
    console.error('Error loading forum:', error);
    document.getElementById('app').innerHTML = getForumHTML([], [], isAuthenticated, user);
    initForumEvents();
  }
}

function getForumHTML(threads, categories, isAuthenticated, user) {
  const navbar = renderNavbar({ activeRoute: 'forum', isAuthenticated, user });

  const threadsHTML = threads.length > 0
    ? threads.map(t => `
        <article class="forum-thread">
          <div class="forum-thread__avatar">${(t.author?.firstName || 'U')[0]}</div>
          <div class="forum-thread__info">
            <h3 class="forum-thread__title"><a href="#/forum/thread/${t.id}">${t.title || 'Sin título'}</a></h3>
            <p class="forum-thread__meta">
              Por ${t.author ? `${t.author.firstName || ''} ${t.author.lastName || ''}`.trim() : 'Anónimo'}
              ${t.createdAt ? ` • ${new Date(t.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}` : ''}
              ${t.category ? ` • ${t.category.name}` : ''}
            </p>
          </div>
          <div class="forum-thread__stats">
            <span class="thread-stat">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              ${t.postCount || 0}
            </span>
          </div>
        </article>
      `).join('')
    : `<div class="empty-state">
        <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        <h3>No hay discusiones aún</h3>
        <p>Sé el primero en crear un tema</p>
        ${isAuthenticated ? '<button class="btn btn--primary" style="margin-top:20px;" id="new-thread-btn">Crear Tema</button>' : '<a href="#/login" class="btn btn--primary" style="margin-top:20px;">Inicia sesión</a>'}
       </div>`;

  const mainContent = `
    <div class="container">
      <div class="forum-header">
        <div>
          <h1 class="forum-title">Foro de la Comunidad</h1>
          <p class="forum-subtitle">Comparte experiencias y conecta con profesionales</p>
        </div>
        ${isAuthenticated ? '<button class="btn btn--primary" id="new-thread-btn">+ Nuevo Tema</button>' : ''}
      </div>
      ${categories.length > 0 ? `<div class="forum-categories">${categories.map(c => `<span class="category-tag">${c.name}</span>`).join('')}</div>` : ''}
      <div class="forum-threads">${threadsHTML}</div>
    </div>
  `;

  const styles = `
    .forum-page { min-height: calc(100vh - 70px); padding: 40px 0; background: #f9fafb; }
    .forum-title { font-size: 32px; font-weight: 700; color: #111827; margin: 0 0 8px; }
    .forum-subtitle { color: #6b7280; margin: 0; font-size: 16px; }
    .forum-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; flex-wrap: wrap; gap: 16px; }
    .forum-categories { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
    .category-tag { padding: 6px 16px; background: white; border: 1px solid #e5e7eb; border-radius: 9999px; font-size: 14px; color: #374151; }
    .forum-threads { display: flex; flex-direction: column; gap: 12px; }
    .forum-thread { background: white; padding: 20px 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 16px; }
    .forum-thread__avatar { width: 44px; height: 44px; border-radius: 50%; background: #3b82f6; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 18px; flex-shrink: 0; }
    .forum-thread__info { flex: 1; }
    .forum-thread__title { font-size: 16px; font-weight: 600; margin: 0 0 4px; }
    .forum-thread__title a { color: #111827; text-decoration: none; }
    .forum-thread__title a:hover { color: #3b82f6; }
    .forum-thread__meta { font-size: 13px; color: #9ca3af; margin: 0; }
    .forum-thread__stats { flex-shrink: 0; }
    .thread-stat { display: flex; align-items: center; gap: 4px; color: #6b7280; font-size: 14px; }
    .empty-state { text-align: center; padding: 64px 24px; background: white; border-radius: 12px; }
    .empty-state svg { color: #d1d5db; margin-bottom: 16px; }
    .empty-state h3 { font-size: 18px; color: #374151; margin: 0 0 8px; }
    .empty-state p { color: #6b7280; margin: 0; }
    @media (max-width: 768px) { .forum-header { flex-direction: column; } }
  `;

  return renderPage({ navbar, main: mainContent, pageClass: 'forum-page', extraStyles: styles });
}

function initForumEvents() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try { await authService.logout(); window.location.hash = '#/'; } catch (error) { console.error('Logout error:', error); }
    });
  }

  const newBtn = document.getElementById('new-thread-btn');
  if (newBtn) {
    newBtn.addEventListener('click', () => { alert('La creación de temas estará disponible próximamente.'); });
  }
}
