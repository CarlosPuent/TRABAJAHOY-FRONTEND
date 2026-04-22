// Resource Detail Page
import { resourceService } from '@services/resource.service';
import { authService } from '@services/auth.service';
import { store } from '@core/store';
import { showLoading, renderNavbar, renderPage } from '@utils/ui.js';
import { formatters } from '@utils/formatters.js';
import { starFilled, renderStars as renderSvgStars } from '@utils/icons.js';

export async function initResourceDetailPage(resourceId) {
  const isAuthenticated = store.get('isAuthenticated');
  const user = store.get('user');

  showLoading('Cargando recurso...');

  try {
    const [resData, ratingsData, relatedData] = await Promise.all([
      resourceService.getResourceById(resourceId).catch(() => null),
      resourceService.getRatings(resourceId).catch(() => []),
      resourceService.getRelatedResources(resourceId).catch(() => []),
    ]);
    const resource = resData?.data || resData || null;
    const ratings = Array.isArray(ratingsData) ? ratingsData : (ratingsData?.data || []);
    const related = Array.isArray(relatedData) ? relatedData : (relatedData?.data || []);

    // Check if current user has already rated this resource
    const hasRated = isAuthenticated && user && ratings.some(r =>
      r.userId === user.id || r.user?.id === user.id
    );

    document.getElementById('app').innerHTML = getDetailHTML(resource, ratings, related, resourceId, isAuthenticated, user, hasRated);
    initDetailEvents(resource, resourceId, isAuthenticated, hasRated);
  } catch (error) {
    console.error('Error loading resource:', error);
    document.getElementById('app').innerHTML = getDetailHTML(null, [], [], resourceId, isAuthenticated, user, false);
    initDetailEvents(null, resourceId, isAuthenticated, false);
  }
}

function getDetailHTML(resource, ratings, related, resourceId, isAuthenticated, user, hasRated = false) {
  const navbar = renderNavbar({ activeRoute: 'resources', isAuthenticated, user });

  if (!resource) {
    return renderPage({
      navbar,
      main: `<div class="rd-container"><div class="rd-empty"><h2>Recurso no encontrado</h2><a href="#/resources" class="btn btn--primary">Volver a Recursos</a></div></div>`,
      pageClass: 'rd-page',
      extraStyles: `.rd-page { min-height: calc(100vh - 70px); background: #f3f4f6; padding: 40px 0; } .rd-container { max-width: 800px; margin: 0 auto; padding: 0 24px; } .rd-empty { text-align: center; padding: 80px 24px; } .rd-empty h2 { margin-bottom: 20px; }`,
    });
  }

  const avgRating = resource.averageRating || (ratings.length > 0 ? (ratings.reduce((s, r) => s + (r.rating || 0), 0) / ratings.length).toFixed(1) : null);

  const mainContent = `
    <div class="rd-container">
      <a href="#/resources" class="rd-back">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        Volver a Recursos
      </a>

      <article class="rd-article">
        ${resource.coverUrl ? `<img src="${resource.coverUrl}" alt="${resource.title}" class="rd-cover" />` : ''}
        
        <div class="rd-header">
          ${resource.category?.name ? `<span class="rd-category">${resource.category.name}</span>` : ''}
          <h1 class="rd-title">${resource.title || 'Sin título'}</h1>
          <div class="rd-meta">
            ${resource.author ? `<span class="rd-meta-item">Por ${resource.author.firstName || ''} ${resource.author.lastName || ''}</span>` : ''}
            ${resource.publishedAt ? `<span class="rd-meta-item">${formatters.date(resource.publishedAt)}</span>` : ''}
            ${resource.readTimeMinutes ? `<span class="rd-meta-item">${resource.readTimeMinutes} min de lectura</span>` : ''}
            ${avgRating ? `<span class="rd-meta-item rd-meta-item--rating">${starFilled(14)} ${avgRating}</span>` : ''}
          </div>
        </div>

        <div class="rd-content">${resource.content || '<p>Sin contenido disponible.</p>'}</div>

        <!-- Rating Section -->
        ${isAuthenticated ? (hasRated ? `
          <div class="rd-rating-section">
            <div class="rd-already-rated">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              Ya calificaste este recurso. ¡Gracias por tu opinión!
            </div>
          </div>
        ` : `
          <div class="rd-rating-section">
            <h3 class="rd-rating-title">¿Te fue útil este recurso?</h3>
            <div class="rd-stars" id="resource-stars">
              ${[1, 2, 3, 4, 5].map(i => `<button type="button" class="rd-star" data-value="${i}">${starFilled(22)}</button>`).join('')}
            </div>
            <input type="hidden" id="resource-rating-value" value="0" />
            <div id="rating-feedback" style="display:none; margin-top:12px;">
              <textarea id="rating-review" class="rd-review-input" rows="2" placeholder="Deja un comentario (opcional)..."></textarea>
              <button class="btn btn--primary btn--sm" id="submit-rating" style="margin-top:8px;">Enviar Calificación</button>
            </div>
          </div>
        `) : ''}

        <!-- Ratings List -->
        ${ratings.length > 0 ? `
          <div class="rd-ratings-list">
            <h3 class="rd-section-title">Calificaciones (${ratings.length})</h3>
            ${ratings.map(r => `
              <div class="rd-rating-item">
                <div class="rd-rating-item__header">
                  <div class="rd-rating-item__stars">${renderSvgStars(r.rating || 0, 5, 14)}</div>
                  <span class="rd-rating-item__date">${formatters.relativeTime(r.createdAt)}</span>
                </div>
                ${r.review ? `<p class="rd-rating-item__text">${r.review}</p>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
      </article>

      <!-- Related Resources -->
      ${related.length > 0 ? `
        <div class="rd-related">
          <h3 class="rd-section-title">Recursos Relacionados</h3>
          <div class="rd-related-grid">
            ${related.map(r => `
              <a href="#/resources/${r.id || r.relatedResourceId}" class="rd-related-card">
                <div class="rd-related-card__cat">${r.category?.name || ''}</div>
                <h4 class="rd-related-card__title">${r.title || r.relatedResource?.title || 'Recurso'}</h4>
              </a>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;

  const styles = `
    .rd-page { min-height: calc(100vh - 70px); background: #f3f4f6; padding: 24px 0 60px; }
    .rd-container { max-width: 800px; margin: 0 auto; padding: 0 24px; }
    .rd-back { display: inline-flex; align-items: center; gap: 6px; color: #6b7280; text-decoration: none; font-size: 14px; margin-bottom: 20px; transition: color 0.15s; }
    .rd-back:hover { color: #111827; }

    .rd-article { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .rd-cover { width: 100%; height: 300px; object-fit: cover; }
    .rd-header { padding: 32px 32px 0; }
    .rd-category { display: inline-block; padding: 4px 12px; background: #dbeafe; color: #2563eb; border-radius: 999px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 12px; }
    .rd-title { font-size: 28px; font-weight: 700; color: #111827; margin: 0 0 12px; line-height: 1.3; }
    .rd-meta { display: flex; flex-wrap: wrap; gap: 16px; padding-bottom: 20px; border-bottom: 1px solid #f3f4f6; }
    .rd-meta-item { font-size: 14px; color: #6b7280; display: inline-flex; align-items: center; gap: 4px; }
    .rd-meta-item--rating { color: #f59e0b; font-weight: 600; }

    .rd-content { padding: 28px 32px; font-size: 16px; color: #374151; line-height: 1.8; }
    .rd-content h2, .rd-content h3 { color: #111827; margin: 24px 0 12px; }
    .rd-content p { margin: 0 0 16px; }
    .rd-content ul, .rd-content ol { margin: 0 0 16px; padding-left: 24px; }
    .rd-content a { color: #3b82f6; }
    .rd-content img { max-width: 100%; border-radius: 8px; margin: 16px 0; }
    .rd-content blockquote { border-left: 4px solid #3b82f6; padding: 12px 20px; background: #f9fafb; border-radius: 0 8px 8px 0; margin: 16px 0; }

    .rd-rating-section { padding: 24px 32px; border-top: 1px solid #f3f4f6; text-align: center; }
    .rd-rating-title { font-size: 16px; color: #374151; margin: 0 0 12px; }
    .rd-already-rated { display: inline-flex; align-items: center; gap: 8px; color: #059669; font-size: 15px; font-weight: 500; background: #ecfdf5; padding: 10px 20px; border-radius: 999px; }
    .rd-stars { display: flex; justify-content: center; gap: 6px; }
    .rd-star { background: none; border: none; font-size: 32px; color: #d1d5db; cursor: pointer; transition: all 0.15s; padding: 0; }
    .rd-star.active, .rd-star:hover { color: #f59e0b; transform: scale(1.1); }
    .rd-review-input { width: 100%; max-width: 400px; margin: 0 auto; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; font-family: inherit; resize: vertical; outline: none; display: block; }
    .rd-review-input:focus { border-color: #3b82f6; }

    .rd-ratings-list { padding: 0 32px 24px; }
    .rd-section-title { font-size: 18px; font-weight: 600; color: #111827; margin: 24px 0 16px; }
    .rd-rating-item { padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
    .rd-rating-item__header { display: flex; justify-content: space-between; }
    .rd-rating-item__stars { color: #f59e0b; font-size: 16px; letter-spacing: 2px; }
    .rd-rating-item__date { font-size: 13px; color: #9ca3af; }
    .rd-rating-item__text { font-size: 14px; color: #4b5563; margin: 6px 0 0; }

    .rd-related { margin-top: 32px; }
    .rd-related-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
    .rd-related-card { background: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); text-decoration: none; transition: all 0.15s; }
    .rd-related-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.12); transform: translateY(-2px); }
    .rd-related-card__cat { font-size: 11px; color: #3b82f6; font-weight: 600; text-transform: uppercase; margin-bottom: 6px; }
    .rd-related-card__title { font-size: 15px; font-weight: 600; color: #111827; margin: 0; }

    @media (max-width: 768px) {
      .rd-header, .rd-content, .rd-rating-section, .rd-ratings-list { padding-left: 20px; padding-right: 20px; }
      .rd-title { font-size: 22px; }
    }
  `;

  return renderPage({ navbar, main: mainContent, pageClass: 'rd-page', extraStyles: styles });
}

function initDetailEvents(resource, resourceId, isAuthenticated, hasRated = false) {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try { await authService.logout(); window.location.hash = '#/'; } catch (e) { console.error(e); }
    });
  }

  // Star rating interaction — only when user hasn't rated yet
  if (!hasRated) {
    const stars = document.querySelectorAll('.rd-star');
    const feedback = document.getElementById('rating-feedback');
    stars.forEach(star => {
      star.addEventListener('click', () => {
        const val = parseInt(star.dataset.value);
        document.getElementById('resource-rating-value').value = val;
        stars.forEach((s, i) => { s.classList.toggle('active', i < val); });
        if (feedback) feedback.style.display = 'block';
      });
      star.addEventListener('mouseenter', () => {
        const val = parseInt(star.dataset.value);
        stars.forEach((s, i) => { s.style.color = i < val ? '#f59e0b' : '#d1d5db'; });
      });
    });
    document.getElementById('resource-stars')?.addEventListener('mouseleave', () => {
      const current = parseInt(document.getElementById('resource-rating-value')?.value || 0);
      stars.forEach((s, i) => { s.style.color = i < current ? '#f59e0b' : '#d1d5db'; });
    });

    // Submit rating
    document.getElementById('submit-rating')?.addEventListener('click', async () => {
      const rating = parseInt(document.getElementById('resource-rating-value').value);
      const review = document.getElementById('rating-review')?.value.trim() || undefined;
      if (!rating || rating < 1) return;

      try {
        await resourceService.rateResource(resourceId, rating, review);
        store.addToast({ type: 'success', message: '¡Gracias por tu calificación!' });
        window.location.reload();
      } catch (err) {
        store.addToast({ type: 'error', message: err.response?.data?.message || 'Error al enviar calificación' });
      }
    });
  }
}
