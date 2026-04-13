// Vacancies Listing Page Controller
import { vacancyService } from '@services/vacancy.service';
import { applicationService } from '@services/application.service';
import { authService } from '@services/auth.service';
import { store } from '@core/store';
import { config } from '@core/config';
import { showLoading, renderNavbar, renderPage } from '@utils/ui.js';

export async function initVacanciesPage(params, query) {
  const app = document.getElementById('app');
  const isAuthenticated = store.get('isAuthenticated');
  const user = store.get('user');

  showLoading('Cargando empleos...');

  try {
    const filters = {};
    if (query.page) filters.page = query.page;
    if (query.limit) filters.limit = query.limit;
    if (query.search) filters.search = query.search;
    if (query.country) filters.country = query.country;
    if (query.city) filters.city = query.city;
    if (query.type) filters.type = query.type;
    if (query.modality) filters.modality = query.modality;
    if (query.level) filters.level = query.level;
    if (query.categoryId) filters.categoryId = query.categoryId;

    const [vacanciesData, categoriesData] = await Promise.all([
      vacancyService.getVacancies(Object.keys(filters).length ? filters : {}).catch((err) => {
        console.error('Error fetching vacancies:', err);
        return [];
      }),
      vacancyService.getCategories().catch(() => ({ data: [] })),
    ]);

    console.log('=== VACANCIES API RESPONSE ===');
    console.log('vacanciesData:', vacanciesData);
    console.log('vacanciesData.data:', vacanciesData.data);
    console.log('vacanciesData.pagination:', vacanciesData.pagination);

    // Handle both envelope format { data: [], pagination: {} } and direct array []
    const vacancies = Array.isArray(vacanciesData) ? vacanciesData : (vacanciesData.data || []);
    const pagination = vacanciesData.pagination || null;

    console.log('Resolved vacancies array:', vacancies);
    console.log('Resolved pagination:', pagination);

    app.innerHTML = getVacanciesHTML(vacancies, pagination, filters, isAuthenticated, user);
    initVacanciesEvents(filters);
  } catch (error) {
    console.error('Error loading vacancies:', error);
    app.innerHTML = getVacanciesHTML([], null, {}, isAuthenticated, user);
    initVacanciesEvents({});
  }
}

function getVacanciesHTML(vacancies, pagination, filters, isAuthenticated, user) {
  const fullName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
  const navbar = renderNavbar({ activeRoute: 'vacancies', isAuthenticated, user });

  const jobsHTML = vacancies.length > 0
    ? vacancies.map(v => getVacancyCardHTML(v)).join('\n')
    : `<div class="empty-state">
        <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
        </svg>
        <h3>No se encontraron empleos</h3>
        <p>Intenta con otros filtros o busca más tarde</p>
       </div>`;

  const paginationHTML = pagination && pagination.totalPages > 1
    ? getPaginationHTML(pagination, filters) : '';

  const mainContent = `
    <div class="container">
      <div class="vacancies-layout">
        <aside class="vacancies-filters">
          <div class="vacancies-filters__header">
            <h2 class="vacancies-filters__title">Filtros</h2>
            <button class="vacancies-filters__clear" id="clear-filters">Limpiar</button>
          </div>
          <form class="vacancies-filters__form" id="filters-form">
            <div class="filter-group">
              <label class="filter-label">Buscar</label>
              <input type="text" class="filter-input" id="filter-search" placeholder="Palabras clave..." value="${filters.search || ''}" />
            </div>
            <div class="filter-group">
              <label class="filter-label">Ubicación</label>
              <input type="text" class="filter-input" id="filter-city" placeholder="Ciudad..." value="${filters.city || ''}" />
            </div>
            <div class="filter-group">
              <label class="filter-label">Modalidad</label>
              <select class="filter-select" id="filter-modality">
                <option value="">Todas</option>
                <option value="remote" ${filters.modality === 'remote' ? 'selected' : ''}>Remoto</option>
                <option value="hybrid" ${filters.modality === 'hybrid' ? 'selected' : ''}>Híbrido</option>
                <option value="onsite" ${filters.modality === 'onsite' ? 'selected' : ''}>Presencial</option>
              </select>
            </div>
            <div class="filter-group">
              <label class="filter-label">Tipo</label>
              <select class="filter-select" id="filter-type">
                <option value="">Todos</option>
                <option value="full-time" ${filters.type === 'full-time' ? 'selected' : ''}>Tiempo completo</option>
                <option value="part-time" ${filters.type === 'part-time' ? 'selected' : ''}>Medio tiempo</option>
                <option value="contract" ${filters.type === 'contract' ? 'selected' : ''}>Contrato</option>
                <option value="freelance" ${filters.type === 'freelance' ? 'selected' : ''}>Freelance</option>
                <option value="internship" ${filters.type === 'internship' ? 'selected' : ''}>Prácticas</option>
              </select>
            </div>
            <div class="filter-group">
              <label class="filter-label">Nivel</label>
              <select class="filter-select" id="filter-level">
                <option value="">Todos</option>
                <option value="junior" ${filters.level === 'junior' ? 'selected' : ''}>Junior</option>
                <option value="mid" ${filters.level === 'mid' ? 'selected' : ''}>Mid</option>
                <option value="senior" ${filters.level === 'senior' ? 'selected' : ''}>Senior</option>
                <option value="lead" ${filters.level === 'lead' ? 'selected' : ''}>Lead</option>
                <option value="manager" ${filters.level === 'manager' ? 'selected' : ''}>Manager</option>
              </select>
            </div>
            <button type="submit" class="btn btn--primary btn--full-width">Aplicar Filtros</button>
          </form>
        </aside>
        <section class="vacancies-results">
          <div class="vacancies-results__header">
            <h1 class="vacancies-results__title">${pagination ? `${pagination.total} empleos encontrados` : 'Empleos disponibles'}</h1>
          </div>
          <div class="vacancies-grid">${jobsHTML}</div>
          ${paginationHTML}
        </section>
      </div>
    </div>
  `;

  const styles = `
    .vacancies-page { min-height: calc(100vh - 70px); padding: 32px 0; background: #f9fafb; }
    .vacancies-layout { display: grid; grid-template-columns: 280px 1fr; gap: 32px; }
    .vacancies-filters {
      background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      height: fit-content; position: sticky; top: 90px;
    }
    .vacancies-filters__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb; }
    .vacancies-filters__title { font-size: 18px; font-weight: 600; margin: 0; }
    .vacancies-filters__clear { background: none; border: none; color: #3b82f6; cursor: pointer; font-size: 14px; }
    .vacancies-filters__form { display: flex; flex-direction: column; gap: 20px; }
    .filter-label { display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; }
    .filter-input, .filter-select {
      width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px;
      font-size: 14px; transition: all 0.2s;
    }
    .filter-input:focus, .filter-select:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    .vacancies-results__header { margin-bottom: 24px; }
    .vacancies-results__title { font-size: 24px; font-weight: 700; margin: 0; color: #111827; }
    .vacancies-grid { display: grid; gap: 20px; }
    .vacancy-card {
      background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      transition: all 0.2s; cursor: pointer;
    }
    .vacancy-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); transform: translateY(-2px); }
    .vacancy-card__header { display: flex; gap: 16px; margin-bottom: 16px; }
    .vacancy-card__logo {
      width: 56px; height: 56px; border-radius: 12px; background: #f3f4f6;
      display: flex; align-items: center; justify-content: center; font-weight: 600;
      color: #6b7280; font-size: 24px; flex-shrink: 0;
    }
    .vacancy-card__info { flex: 1; }
    .vacancy-card__company { font-size: 14px; color: #6b7280; margin: 0 0 4px; }
    .vacancy-card__title { font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 8px; }
    .vacancy-card__meta { display: flex; flex-wrap: wrap; gap: 12px; font-size: 14px; color: #6b7280; margin-bottom: 16px; }
    .vacancy-card__meta-item { display: flex; align-items: center; gap: 6px; }
    .vacancy-card__salary { font-size: 16px; font-weight: 600; color: #10b981; margin-bottom: 16px; }
    .vacancy-card__tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
    .vacancy-card__tag {
      padding: 4px 12px; background: #f3f4f6; border-radius: 9999px; font-size: 12px; color: #374151;
    }
    .vacancy-card__actions { display: flex; gap: 12px; }
    .pagination { display: flex; justify-content: center; gap: 8px; margin-top: 32px; }
    .pagination__btn {
      padding: 8px 16px; border: 1px solid #d1d5db; background: white; border-radius: 8px;
      cursor: pointer; transition: all 0.2s; text-decoration: none; color: #374151; font-size: 14px;
    }
    .pagination__btn:hover { background: #f9fafb; }
    .pagination__btn--active { background: #3b82f6; color: white; border-color: #3b82f6; }
    .empty-state { text-align: center; padding: 64px 24px; color: #9ca3af; grid-column: 1 / -1; }
    .empty-state svg { margin-bottom: 16px; }
    .empty-state h3 { font-size: 18px; margin: 0 0 8px; color: #6b7280; }
    .empty-state p { margin: 0; }
    @media (max-width: 1024px) {
      .vacancies-layout { grid-template-columns: 1fr; }
      .vacancies-filters { position: static; }
    }
  `;

  return renderPage({ navbar, main: mainContent, pageClass: 'vacancies-page', extraStyles: styles });
}

function getVacancyCardHTML(v) {
  const modalityLabels = { remote: 'Remoto', hybrid: 'Híbrido', onsite: 'Presencial' };
  const typeLabels = { 'full-time': 'Tiempo completo', 'part-time': 'Medio tiempo', contract: 'Contrato', freelance: 'Freelance', internship: 'Prácticas' };
  const levelLabels = { junior: 'Junior', mid: 'Mid', senior: 'Senior', lead: 'Lead', manager: 'Manager' };

  return `
    <article class="vacancy-card" data-vacancy-id="${v.id}">
      <div class="vacancy-card__header">
        <div class="vacancy-card__logo">${(v.companyName || 'C')[0]}</div>
        <div class="vacancy-card__info">
          <p class="vacancy-card__company">${v.companyName || 'Empresa'}</p>
          <h3 class="vacancy-card__title">${v.title || 'Puesto'}</h3>
        </div>
      </div>
      <div class="vacancy-card__meta">
        ${v.city ? `<span class="vacancy-card__meta-item">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          ${v.city}${v.country ? `, ${v.country}` : ''}
        </span>` : ''}
        ${v.modality ? `<span class="vacancy-card__meta-item">${modalityLabels[v.modality] || v.modality}</span>` : ''}
        ${v.type ? `<span class="vacancy-card__meta-item">${typeLabels[v.type] || v.type}</span>` : ''}
        ${v.level ? `<span class="vacancy-card__meta-item">${levelLabels[v.level] || v.level}</span>` : ''}
      </div>
      ${v.salaryMin ? `<div class="vacancy-card__salary">$${v.salaryMin.toLocaleString()} - $${v.salaryMax?.toLocaleString()} ${v.currency || ''}</div>` : ''}
      <div class="vacancy-card__actions">
        <a href="#/vacancies/${v.id}" class="btn btn--primary">Ver Detalles</a>
        <button class="btn btn--outline" data-save-job="${v.id}">Guardar</button>
      </div>
    </article>
  `;
}

function getPaginationHTML(pagination, filters) {
  const { page, totalPages } = pagination;
  let buttons = '';
  for (let i = 1; i <= totalPages; i++) {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.city) params.set('city', filters.city);
    if (filters.modality) params.set('modality', filters.modality);
    if (filters.type) params.set('type', filters.type);
    if (filters.level) params.set('level', filters.level);
    params.set('page', i);
    const qs = params.toString();
    buttons += `<a href="#/vacancies${qs ? '?' + qs : ''}" class="pagination__btn ${i === page ? 'pagination__btn--active' : ''}">${i}</a>`;
  }
  return `<div class="pagination">${buttons}</div>`;
}

function initVacanciesEvents(filters) {
  const form = document.getElementById('filters-form');
  const clearBtn = document.getElementById('clear-filters');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const search = document.getElementById('filter-search')?.value || '';
      const city = document.getElementById('filter-city')?.value || '';
      const modality = document.getElementById('filter-modality')?.value || '';
      const type = document.getElementById('filter-type')?.value || '';
      const level = document.getElementById('filter-level')?.value || '';
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (city) params.set('city', city);
      if (modality) params.set('modality', modality);
      if (type) params.set('type', type);
      if (level) params.set('level', level);
      params.set('page', '1');
      const qs = params.toString();
      window.location.hash = `#/vacancies${qs ? '?' + qs : ''}`;
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => { window.location.hash = '#/vacancies'; });
  }

  document.querySelectorAll('[data-save-job]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!store.get('isAuthenticated')) { window.location.hash = '#/login'; return; }
      try {
        await applicationService.saveJob(btn.getAttribute('data-save-job'));
        btn.textContent = 'Guardado'; btn.disabled = true;
      } catch (error) { console.error('Error saving job:', error); }
    });
  });

  document.querySelectorAll('.vacancy-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') {
        window.location.hash = `#/vacancies/${card.getAttribute('data-vacancy-id')}`;
      }
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
