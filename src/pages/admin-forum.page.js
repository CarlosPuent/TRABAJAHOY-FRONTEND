// Admin Forum Moderation Page - Moderate forum reports, manage threads, moderate reviews
import { forumService } from '@services/forum.service';
import { reviewService } from '@services/review.service';
import { authService } from '@services/auth.service';
import { store } from '@core/store';
import { showLoading, renderNavbar, renderPage } from '@utils/ui.js';
import { formatters } from '@utils/formatters.js';
import { flag, clipboard, folder, star, fileText, messageSquare, trash, check, xMark, pin, lock } from '@utils/icons.js';

export async function initAdminForumPage(params, query) {
  const isAuthenticated = store.get('isAuthenticated');
  const user = store.get('user');

  showLoading('Cargando moderación del foro...');

  try {
    const [reportsData, threadsData, catsData, reviewReportsData, allReviewsData] = await Promise.all([
      forumService.getReports().catch(() => []),
      forumService.getThreads({ limit: 50 }).catch(() => []),
      forumService.getCategories().catch(() => []),
      reviewService.getReportedReviews().catch(() => []),
      reviewService.getAllReviewsAdmin().catch(() => []),
    ]);
    const reports = Array.isArray(reportsData) ? reportsData : (reportsData?.data || []);
    const threads = Array.isArray(threadsData) ? threadsData : (threadsData?.data || []);
    const categories = Array.isArray(catsData) ? catsData : (catsData?.data || []);
    const reviewReports = Array.isArray(reviewReportsData) ? reviewReportsData : (reviewReportsData?.data || []);
    const allReviews = Array.isArray(allReviewsData) ? allReviewsData : (allReviewsData?.data || []);

    // Build thread map for quick content lookup in reports
    const threadMap = {};
    threads.forEach(t => { threadMap[t.id] = t; });

    // For post reports, fetch post content for those not embedded in report
    const postReports = reports.filter(r => r.postId && !r.post?.content);
    const postMap = {};
    await Promise.all(postReports.map(async r => {
      try {
        const postData = await forumService.getPostById(r.postId);
        const post = postData?.data || postData;
        if (post) postMap[r.postId] = post;
      } catch (_) {}
    }));

    document.getElementById('app').innerHTML = getAdminForumHTML(reports, threads, categories, reviewReports, allReviews, isAuthenticated, user, threadMap, postMap);
    initAdminForumEvents(reports, threads, reviewReports, allReviews);
  } catch (error) {
    console.error('Error loading admin forum:', error);
    document.getElementById('app').innerHTML = getAdminForumHTML([], [], [], [], [], isAuthenticated, user, {}, {});
    initAdminForumEvents([], [], [], []);
  }
}

const REPORT_STATUS = {
  pending: { label: 'Pendiente', bg: '#fef3c7', color: '#92400e' },
  resolved: { label: 'Resuelto', bg: '#d1fae5', color: '#059669' },
  dismissed: { label: 'Descartado', bg: '#f3f4f6', color: '#6b7280' },
};

function getAdminForumHTML(reports, threads, categories, reviewReports, allReviews, isAuthenticated, user, threadMap = {}, postMap = {}) {
  const navbar = renderNavbar({ activeRoute: '', isAuthenticated, user });

  const pendingReports = reports.filter(r => r.status === 'pending');
  const resolvedReports = reports.filter(r => r.status === 'resolved');
  const dismissedReports = reports.filter(r => r.status === 'dismissed');
  const pendingReviewReports = reviewReports.length;
  const reviewsForModeration = allReviews.length > 0
    ? allReviews
    : reviewReports.map(r => r.review || r);
  const totalReviews = reviewsForModeration.length;

  const mainContent = `
    <div class="af-container">
      <div class="af-header">
        <div>
          <h1 class="af-title">Moderación del Foro</h1>
          <p class="af-subtitle">Gestiona reportes y modera el contenido del foro</p>
        </div>
      </div>

      <!-- Stats -->
      <div class="af-stats">
        <div class="af-stat af-stat--amber">
          <div class="af-stat__number">${pendingReports.length}</div>
          <div class="af-stat__label">Reportes Pendientes</div>
        </div>
        <div class="af-stat af-stat--green">
          <div class="af-stat__number">${resolvedReports.length}</div>
          <div class="af-stat__label">Resueltos</div>
        </div>
        <div class="af-stat af-stat--gray">
          <div class="af-stat__number">${dismissedReports.length}</div>
          <div class="af-stat__label">Descartados</div>
        </div>
        <div class="af-stat af-stat--blue">
          <div class="af-stat__number">${threads.length}</div>
          <div class="af-stat__label">Hilos Totales</div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="af-section-tabs">
        <button class="af-sec-tab af-sec-tab--active" data-section="reports">${flag} Foro (${pendingReports.length})</button>
        <button class="af-sec-tab" data-section="threads">${clipboard} Hilos</button>
        <button class="af-sec-tab" data-section="categories">${folder} Categorías</button>
        <button class="af-sec-tab" data-section="reviews">${star} Reseñas (${totalReviews})</button>
      </div>

      <!-- Reports Section -->
      <div class="af-section" id="section-reports">
        <div class="af-filter-tabs">
          <button class="af-ftab af-ftab--active" data-report-filter="pending">Pendientes (${pendingReports.length})</button>
          <button class="af-ftab" data-report-filter="resolved">Resueltos (${resolvedReports.length})</button>
          <button class="af-ftab" data-report-filter="dismissed">Descartados (${dismissedReports.length})</button>
          <button class="af-ftab" data-report-filter="all">Todos (${reports.length})</button>
        </div>

        <div class="af-reports-list" id="reports-list">
          ${reports.length > 0 ? reports.map(report => {
            const rs = REPORT_STATUS[report.status] || REPORT_STATUS.pending;
            // Resolve reported content
            const reportedThread = report.thread || threadMap[report.threadId];
            const reportedPost = report.post || postMap[report.postId];
            const reportedContent = report.threadId
              ? (reportedThread ? `<div class="af-report__content-preview">
                  <strong>Hilo:</strong> <em>${reportedThread.title || 'Sin título'}</em>
                  ${reportedThread.content ? `<p class="af-report__content-text">${reportedThread.content.substring(0, 300)}${reportedThread.content.length > 300 ? '…' : ''}</p>` : ''}
                </div>` : '')
              : (reportedPost ? `<div class="af-report__content-preview">
                  <strong>Respuesta:</strong>
                  <p class="af-report__content-text">${(reportedPost.content || '').substring(0, 300)}${(reportedPost.content || '').length > 300 ? '…' : ''}</p>
                </div>` : '');
            return `
              <div class="af-report" data-id="${report.id}" data-status="${report.status}" ${report.status !== 'pending' ? 'style="display:none;"' : ''}>
                <div class="af-report__header">
                  <span class="af-report__badge" style="background:${rs.bg};color:${rs.color}">${rs.label}</span>
                  <span class="af-report__type">${report.threadId ? `${fileText} Hilo` : `${messageSquare} Respuesta`}</span>
                  <span class="af-report__date">${formatters.relativeTime(report.createdAt)}</span>
                </div>
                <div class="af-report__body">
                  ${reportedContent}
                  <div class="af-report__reason"><strong>Motivo:</strong> ${report.reason || 'No especificado'}</div>
                  ${report.details ? `<div class="af-report__details">${report.details}</div>` : ''}
                  ${report.moderatorNotes ? `<div class="af-report__mod-notes"><strong>Notas del moderador:</strong> ${report.moderatorNotes}</div>` : ''}
                </div>
                ${report.status === 'pending' ? `
                  <div class="af-report__actions">
                    <button class="btn btn--primary btn--sm resolve-report-btn" data-id="${report.id}">${check} Resolver</button>
                    <button class="btn btn--outline btn--sm dismiss-report-btn" data-id="${report.id}">${xMark} Descartar</button>
                    ${report.threadId ? `<button class="btn btn--sm" style="background:#fee2e2;color:#dc2626;border:none;" data-thread-id="${report.threadId}" class="delete-reported-thread">${trash} Eliminar Hilo</button>` : ''}
                    ${report.postId ? `<button class="btn btn--sm delete-reported-post" style="background:#fee2e2;color:#dc2626;border:none;" data-post-id="${report.postId}">${trash} Eliminar Respuesta</button>` : ''}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('') : '<div class="af-empty">No hay reportes</div>'}
        </div>
      </div>

      <!-- Threads Section -->
      <div class="af-section" id="section-threads" style="display:none;">
        <div class="af-threads-list">
          ${threads.length > 0 ? threads.map(t => {
            const tAuthor = `${t.author?.firstName || ''} ${t.author?.lastName || ''}`.trim() || 'Anónimo';
            return `
              <div class="af-thread-row" data-id="${t.id}">
                <div class="af-thread-row__info">
                  <h4 class="af-thread-row__title">
                    <a href="#/forum/thread/${t.id}">${t.title || 'Sin título'}</a>
                  </h4>
                  <div class="af-thread-row__meta">
                    <span>Por ${tAuthor}</span>
                    <span>${formatters.relativeTime(t.createdAt)}</span>
                    ${t.category?.name ? `<span class="ar-tag ar-tag--blue">${t.category.name}</span>` : ''}
                    ${t.isPinned ? `<span class="ar-tag" style="background:#fef3c7;color:#92400e;">${pin} Fijado</span>` : ''}
                    ${t.isLocked ? `<span class="ar-tag" style="background:#fee2e2;color:#991b1b;">${lock} Cerrado</span>` : ''}
                  </div>
                </div>
                <div class="af-thread-row__actions">
                  <button class="btn btn--outline btn--sm delete-thread-btn" data-id="${t.id}">Eliminar</button>
                </div>
              </div>
            `;
          }).join('') : '<div class="af-empty">No hay hilos en el foro</div>'}
        </div>
      </div>

      <!-- Categories Section -->
      <div class="af-section" id="section-categories" style="display:none;">
        <div class="af-cat-list">
          ${categories.length > 0 ? categories.map(c => `
            <div class="af-cat-row">
              <span class="af-cat-name">${c.name}</span>
              ${c.description ? `<span class="af-cat-desc">${c.description}</span>` : ''}
            </div>
          `).join('') : '<div class="af-empty">No hay categorías</div>'}
        </div>
      </div>

      <!-- Reviews Moderation Section -->
      <div class="af-section" id="section-reviews" style="display:none;">
        ${pendingReviewReports > 0 ? `
        <div class="af-filter-tabs" style="margin-bottom:16px;">
          <button class="af-ftab af-ftab--active" data-review-filter="reported">Reportadas (${pendingReviewReports})</button>
          <button class="af-ftab" data-review-filter="all">Todas (${totalReviews})</button>
        </div>` : ''}

        <!-- Reported reviews -->
        <div class="af-reviews-list" id="review-list-reported" ${pendingReviewReports > 0 ? '' : 'style="display:none;"'}>
          ${reviewReports.length > 0 ? reviewReports.map(r => {
            const review = r.review || r;
            const reviewer = review.user || review.author || r.reporter;
            const company = review.company;
            return `
              <div class="af-review-row" data-id="${r.id || review.id}">
                <div class="af-review-row__header">
                  <span class="af-report__badge" style="background:#fef3c7;color:#92400e">Reportada</span>
                  <span class="af-review-row__stars">${star} ${review.rating || r.rating || '?'}/5</span>
                  ${reviewer ? `<span class="af-review-row__author">Por ${reviewer.firstName || reviewer.name || ''} ${reviewer.lastName || ''}</span>` : ''}
                  ${company ? `<span class="af-review-row__company">Empresa: ${company.name || ''}</span>` : ''}
                  <span class="af-thread-row__meta">${formatters.relativeTime(r.createdAt || review.createdAt)}</span>
                </div>
                ${review.title ? `<h4 class="af-review-row__title">${review.title}</h4>` : ''}
                ${(review.content || review.body) ? `<p class="af-review-row__text">${review.content || review.body}</p>` : ''}
                ${(review.pros || review.cons) ? `<div class="af-review-row__pros-cons">
                  ${review.pros ? `<span class="af-review-row__pro">✓ ${review.pros}</span>` : ''}
                  ${review.cons ? `<span class="af-review-row__con">✗ ${review.cons}</span>` : ''}
                </div>` : ''}
                <div class="af-report__actions">
                  <button class="btn btn--primary btn--sm approve-review-btn" data-id="${review.id || r.id}">${check} Aprobar</button>
                  <button class="btn btn--outline btn--sm reject-review-btn" data-id="${review.id || r.id}">${xMark} Rechazar</button>
                </div>
              </div>
            `;
          }).join('') : '<div class="af-empty">No hay reseñas reportadas pendientes</div>'}
        </div>

        <!-- All reviews -->
        <div class="af-reviews-list" id="review-list-all" ${pendingReviewReports > 0 ? 'style="display:none;"' : ''}>
          ${reviewsForModeration.length > 0 ? reviewsForModeration.map(r => {
            const reviewer = r.user || r.author;
            const company = r.company;
            const statusColors = { approved: '#d1fae5', rejected: '#fee2e2', pending: '#fef3c7' };
            const statusTextColors = { approved: '#059669', rejected: '#dc2626', pending: '#92400e' };
            const statusLabels = { approved: 'Aprobada', rejected: 'Rechazada', pending: 'Pendiente' };
            const st = r.status || 'pending';
            return `
              <div class="af-review-row" data-id="${r.id}">
                <div class="af-review-row__header">
                  <span class="af-report__badge" style="background:${statusColors[st] || '#f3f4f6'};color:${statusTextColors[st] || '#6b7280'}">${statusLabels[st] || st}</span>
                  <span class="af-review-row__stars">${star} ${r.rating || '?'}/5</span>
                  ${reviewer ? `<span class="af-review-row__author">Por ${reviewer.firstName || reviewer.name || ''} ${reviewer.lastName || ''}</span>` : ''}
                  ${company ? `<span class="af-review-row__company">Empresa: ${company.name || ''}</span>` : ''}
                  <span class="af-thread-row__meta">${formatters.relativeTime(r.createdAt)}</span>
                </div>
                ${r.title ? `<h4 class="af-review-row__title">${r.title}</h4>` : ''}
                ${r.content ? `<p class="af-review-row__text">${r.content}</p>` : ''}
                ${(r.pros || r.cons) ? `<div class="af-review-row__pros-cons">
                  ${r.pros ? `<span class="af-review-row__pro">✓ ${r.pros}</span>` : ''}
                  ${r.cons ? `<span class="af-review-row__con">✗ ${r.cons}</span>` : ''}
                </div>` : ''}
                ${st !== 'rejected' ? `<div class="af-report__actions">
                  ${st !== 'approved' ? `<button class="btn btn--primary btn--sm approve-review-btn" data-id="${r.id}">${check} Aprobar</button>` : ''}
                  <button class="btn btn--outline btn--sm reject-review-btn" data-id="${r.id}">${xMark} Rechazar</button>
                </div>` : ''}
              </div>
            `;
          }).join('') : '<div class="af-empty">No hay reseñas</div>'}
        </div>
      </div>
    </div>

    <!-- Moderator Notes Modal -->
    <div class="modal-overlay" id="mod-notes-modal" style="display:none;">
      <div class="modal-content">
        <div class="modal-header">
          <h2 id="mod-modal-title">Resolver Reporte</h2>
          <button class="modal-close" id="close-mod-modal">&times;</button>
        </div>
        <form id="mod-notes-form">
          <input type="hidden" id="mod-report-id" />
          <input type="hidden" id="mod-action" />
          <div class="af-field">
            <label class="af-label">Notas del moderador</label>
            <textarea id="mod-notes" class="af-input" rows="3" placeholder="Agregar notas sobre la acción tomada..."></textarea>
          </div>
          <div class="af-form-actions" style="margin-top:16px;">
            <button type="button" class="btn btn--outline" id="cancel-mod">Cancelar</button>
            <button type="submit" class="btn btn--primary" id="confirm-mod">Confirmar</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const styles = `
    .af-page { min-height: calc(100vh - 70px); background: #f3f4f6; padding: 24px 0 60px; }
    .af-container { max-width: 960px; margin: 0 auto; padding: 0 24px; }
    .af-header { margin-bottom: 24px; }
    .af-title { font-size: 28px; font-weight: 700; color: #111827; margin: 0 0 4px; }
    .af-subtitle { color: #6b7280; margin: 0; font-size: 14px; }

    .af-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 24px; }
    .af-stat { background: #fff; padding: 16px 20px; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); border-left: 4px solid; }
    .af-stat--amber { border-color: #f59e0b; }
    .af-stat--green { border-color: #10b981; }
    .af-stat--gray { border-color: #9ca3af; }
    .af-stat--blue { border-color: #3b82f6; }
    .af-stat__number { font-size: 24px; font-weight: 700; color: #111827; }
    .af-stat__label { font-size: 13px; color: #6b7280; }

    .af-section-tabs { display: flex; gap: 4px; margin-bottom: 20px; background: #fff; border-radius: 10px; padding: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .af-sec-tab { padding: 10px 20px; border: none; background: none; font-size: 14px; font-weight: 500; color: #6b7280; border-radius: 8px; cursor: pointer; transition: all 0.15s; }
    .af-sec-tab:hover { background: #f3f4f6; }
    .af-sec-tab--active { background: #111827; color: #fff; }

    .af-filter-tabs { display: flex; gap: 4px; margin-bottom: 16px; }
    .af-ftab { padding: 6px 14px; border: 1px solid #e5e7eb; background: #fff; border-radius: 8px; font-size: 13px; cursor: pointer; color: #6b7280; transition: all 0.15s; }
    .af-ftab:hover { background: #f3f4f6; }
    .af-ftab--active { background: #3b82f6; color: #fff; border-color: #3b82f6; }

    .af-reports-list { display: flex; flex-direction: column; gap: 12px; }
    .af-report { background: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .af-report__header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .af-report__badge { padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
    .af-report__type { font-size: 13px; color: #6b7280; }
    .af-report__date { font-size: 12px; color: #9ca3af; margin-left: auto; }
    .af-report__reason { font-size: 14px; color: #374151; margin-bottom: 4px; }
    .af-report__details { font-size: 14px; color: #6b7280; margin-bottom: 8px; padding: 8px 12px; background: #f9fafb; border-radius: 8px; }
    .af-report__mod-notes { font-size: 13px; color: #059669; margin-top: 8px; padding: 8px 12px; background: #ecfdf5; border-radius: 8px; }
    .af-report__actions { display: flex; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #f3f4f6; }
    .af-report__content-preview { background: #f0f4ff; border-left: 3px solid #3b82f6; padding: 10px 14px; border-radius: 0 8px 8px 0; margin-bottom: 10px; font-size: 14px; color: #374151; }
    .af-report__content-text { margin: 6px 0 0; color: #4b5563; font-style: italic; }

    .af-threads-list { display: flex; flex-direction: column; gap: 8px; }
    .af-thread-row { display: flex; align-items: center; justify-content: space-between; background: #fff; padding: 14px 20px; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .af-thread-row__title { font-size: 15px; font-weight: 600; margin: 0 0 4px; }
    .af-thread-row__title a { color: #111827; text-decoration: none; }
    .af-thread-row__title a:hover { color: #3b82f6; }
    .af-thread-row__meta { display: flex; flex-wrap: wrap; gap: 8px; font-size: 13px; color: #9ca3af; align-items: center; }

    .ar-tag { padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 500; }
    .ar-tag--blue { background: #dbeafe; color: #2563eb; }

    .af-cat-list { display: flex; flex-direction: column; gap: 8px; }
    .af-cat-row { background: #fff; padding: 14px 20px; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); display: flex; align-items: center; gap: 12px; }
    .af-cat-name { font-weight: 600; color: #111827; }
    .af-cat-desc { font-size: 14px; color: #6b7280; }

    .af-empty { text-align: center; padding: 48px 24px; background: #fff; border-radius: 12px; color: #9ca3af; font-size: 15px; }

    .af-field { display: flex; flex-direction: column; gap: 6px; }
    .af-label { font-size: 14px; font-weight: 500; color: #374151; }
    .af-input { padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; font-family: inherit; outline: none; resize: vertical; }
    .af-input:focus { border-color: #3b82f6; }
    .af-form-actions { display: flex; justify-content: flex-end; gap: 12px; }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(4px); }
    .modal-content { background: #fff; border-radius: 16px; padding: 28px; max-width: 480px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.25); animation: modalIn 0.2s ease; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .modal-header h2 { margin: 0; font-size: 20px; color: #111827; }
    .modal-close { background: none; border: none; font-size: 28px; color: #9ca3af; cursor: pointer; }
    @keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

    .af-reviews-list { display: flex; flex-direction: column; gap: 12px; }
    .af-review-row { background: #fff; padding: 18px 20px; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .af-review-row__header { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
    .af-review-row__stars { font-size: 15px; color: #f59e0b; font-weight: 600; }
    .af-review-row__title { font-size: 15px; font-weight: 600; color: #111827; margin: 0 0 6px; }
    .af-review-row__text { font-size: 14px; color: #4b5563; margin: 0 0 8px; }
    .af-review-row__author { font-size: 13px; color: #374151; }
    .af-review-row__company { font-size: 13px; color: #3b82f6; font-weight: 500; }
    .af-review-row__pros-cons { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 8px; font-size: 13px; }
    .af-review-row__pro { color: #059669; }
    .af-review-row__con { color: #dc2626; }

    @media (max-width: 768px) {
      .af-section-tabs { flex-wrap: wrap; }
      .af-thread-row { flex-direction: column; align-items: flex-start; gap: 10px; }
      .af-report__actions { flex-wrap: wrap; }
    }
  `;

  return renderPage({ navbar, main: mainContent, pageClass: 'af-page', extraStyles: styles });
}

function initAdminForumEvents(reports, threads, reviewReports, allReviews) {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try { await authService.logout(); window.location.hash = '#/'; } catch (e) { console.error(e); }
    });
  }

  // Section tabs
  document.querySelectorAll('.af-sec-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.af-sec-tab').forEach(t => t.classList.remove('af-sec-tab--active'));
      tab.classList.add('af-sec-tab--active');
      const section = tab.dataset.section;
      document.querySelectorAll('.af-section').forEach(s => s.style.display = 'none');
      document.getElementById(`section-${section}`).style.display = '';
    });
  });

  // Report filter tabs
  document.querySelectorAll('.af-ftab[data-report-filter]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.af-ftab[data-report-filter]').forEach(t => t.classList.remove('af-ftab--active'));
      tab.classList.add('af-ftab--active');
      const filter = tab.dataset.reportFilter;
      document.querySelectorAll('.af-report').forEach(r => {
        r.style.display = (filter === 'all' || r.dataset.status === filter) ? '' : 'none';
      });
    });
  });

  // Review filter tabs
  document.querySelectorAll('.af-ftab[data-review-filter]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.af-ftab[data-review-filter]').forEach(t => t.classList.remove('af-ftab--active'));
      tab.classList.add('af-ftab--active');
      const filter = tab.dataset.reviewFilter;
      document.getElementById('review-list-reported').style.display = filter === 'reported' ? '' : 'none';
      document.getElementById('review-list-all').style.display = filter === 'all' ? '' : 'none';
    });
  });

  // Moderation notes modal
  const modModal = document.getElementById('mod-notes-modal');
  const closeModModal = () => { if (modModal) modModal.style.display = 'none'; };

  const openModModal = (reportId, action) => {
    document.getElementById('mod-report-id').value = reportId;
    document.getElementById('mod-action').value = action;
    document.getElementById('mod-modal-title').textContent = action === 'resolved' ? 'Resolver Reporte' : 'Descartar Reporte';
    document.getElementById('mod-notes').value = '';
    if (modModal) modModal.style.display = 'flex';
  };

  document.getElementById('close-mod-modal')?.addEventListener('click', closeModModal);
  document.getElementById('cancel-mod')?.addEventListener('click', closeModModal);
  modModal?.addEventListener('click', (e) => { if (e.target === modModal) closeModModal(); });

  // Resolve
  document.querySelectorAll('.resolve-report-btn').forEach(btn => {
    btn.addEventListener('click', () => openModModal(btn.dataset.id, 'resolved'));
  });

  // Dismiss
  document.querySelectorAll('.dismiss-report-btn').forEach(btn => {
    btn.addEventListener('click', () => openModModal(btn.dataset.id, 'dismissed'));
  });

  // Submit mod action
  document.getElementById('mod-notes-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const reportId = document.getElementById('mod-report-id').value;
    const status = document.getElementById('mod-action').value;
    const moderatorNotes = document.getElementById('mod-notes').value.trim();

    try {
      await forumService.updateReport(reportId, { status, moderatorNotes });
      store.addToast({ type: 'success', message: status === 'resolved' ? 'Reporte resuelto' : 'Reporte descartado' });
      closeModModal();
      window.location.reload();
    } catch (err) {
      store.addToast({ type: 'error', message: 'Error al actualizar reporte' });
    }
  });

  // Delete thread
  document.querySelectorAll('.delete-thread-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar este hilo y todas sus respuestas?')) return;
      try {
        await forumService.deleteThread(btn.dataset.id);
        store.addToast({ type: 'success', message: 'Hilo eliminado' });
        btn.closest('.af-thread-row')?.remove();
      } catch (err) {
        store.addToast({ type: 'error', message: 'Error al eliminar hilo' });
      }
    });
  });

  // Delete reported post
  document.querySelectorAll('.delete-reported-post').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar esta respuesta del foro?')) return;
      try {
        await forumService.deletePost(btn.dataset.postId);
        store.addToast({ type: 'success', message: 'Respuesta eliminada' });
      } catch (err) {
        store.addToast({ type: 'error', message: 'Error al eliminar' });
      }
    });
  });

  // Review moderation — approve
  document.querySelectorAll('.approve-review-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await reviewService.moderateReview(btn.dataset.id, { status: 'approved', moderatorNotes: 'Aprobada por moderador' });
        store.addToast({ type: 'success', message: 'Reseña aprobada' });
        btn.closest('.af-review-row')?.remove();
      } catch (err) {
        store.addToast({ type: 'error', message: err.response?.data?.message || 'Error al moderar reseña' });
      }
    });
  });

  // Review moderation — reject
  document.querySelectorAll('.reject-review-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const notes = prompt('Motivo del rechazo (opcional):') || 'Rechazada por moderador';
      try {
        await reviewService.moderateReview(btn.dataset.id, { status: 'rejected', moderatorNotes: notes });
        store.addToast({ type: 'success', message: 'Reseña rechazada' });
        btn.closest('.af-review-row')?.remove();
      } catch (err) {
        store.addToast({ type: 'error', message: err.response?.data?.message || 'Error al rechazar reseña' });
      }
    });
  });
}
