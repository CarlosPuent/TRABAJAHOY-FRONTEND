// Landing Page Controller
import { vacancyService } from '@services/vacancy.service';
import { authService } from '@services/auth.service';
import { store } from '@core/store';
import { config } from '@core/config';
import { showLoading, renderNavbar, renderPage } from '@utils/ui.js';

export async function initLandingPage(params, query) {
  const app = document.getElementById('app');
  const isAuthenticated = store.get('isAuthenticated');
  const user = store.get('user');
  const fullName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';

  showLoading('Cargando empleos...');

  try {
    const vacanciesData = await vacancyService.getVacancies({ limit: 6 });
    const vacancies = Array.isArray(vacanciesData) ? vacanciesData : (vacanciesData.data || []);

    renderLanding(app, vacancies, isAuthenticated, user, fullName);
    initLandingEvents();
  } catch (error) {
    console.error('Error loading landing page:', error);
    renderLanding(app, [], isAuthenticated, user, fullName);
    initLandingEvents();
  }
}

function renderLanding(container, vacancies, isAuthenticated, user, fullName) {
  const jobsHTML = vacancies.length > 0
    ? vacancies.map(v => getJobCardHTML(v)).join('\n')
    : getPlaceholderJobCard().repeat(3);

  const navbar = renderNavbar({ activeRoute: '', isAuthenticated, user });

  const mainContent = `
    <section class="hero">
      <div class="hero__gradient"></div>
      <div class="container hero__container">
        <div class="hero__top-row">
          <div class="hero__copy">
            <h1 class="hero__title">Encuentra tu próximo empleo hoy</h1>
          </div>
        </div>
        <div class="hero__search-grid">
          <div class="hero__search-main">
            <input type="text" class="hero__input" id="search-keywords" placeholder="Palabras clave" aria-label="Palabras clave" />
            <button type="button" class="hero__icon-btn" id="search-btn" aria-label="Buscar">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </div>
          <div class="hero__search-location">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <input type="text" class="hero__input hero__input--location" id="search-location" placeholder="Ubicación" aria-label="Ubicación" />
          </div>
        </div>
        <p class="hero__caption">Miles de oportunidades laborales publicadas por empresas verificadas</p>
      </div>
    </section>

    <section class="featured-jobs section">
      <div class="container">
        <h2 class="section-heading">Empleos destacados</h2>
        <div class="jobs-grid">
          ${jobsHTML}
        </div>
        <div style="text-align: center; margin-top: 56px; margin-bottom: 8px;">
          <a href="#/vacancies" class="btn btn--primary">Ver todos los empleos</a>
        </div>
      </div>
    </section>
  `;

  container.innerHTML = renderPage({ navbar, main: mainContent });
}

function getJobCardHTML(v) {
  return `
    <article class="job-card">
      <div class="job-card__company">
        <div class="job-card__company-logo">${(v.companyName || 'C')[0]}</div>
        <h3 class="job-card__company-name">${v.companyName || 'Compañía'}</h3>
      </div>
      <h4 class="job-card__position">${v.title || 'Puesto de trabajo'}</h4>
      <p class="job-card__meta">${v.city || 'Ciudad'} • ${v.modality || 'Remoto/Presencial'}</p>
      ${v.salaryMin ? `<p class="job-card__salary">$${v.salaryMin} - $${v.salaryMax} ${v.currency || ''}</p>` : ''}
      <div class="job-card__actions">
        <button type="button" class="job-btn job-btn--apply" data-vacancy-id="${v.id}">Aplicar</button>
        <button type="button" class="job-btn job-btn--save" data-vacancy-id="${v.id}">Guardar</button>
      </div>
    </article>
  `;
}

function getPlaceholderJobCard() {
  return `
    <article class="job-card">
      <div class="job-card__company">
        <div class="job-card__company-logo">G</div>
        <h3 class="job-card__company-name">Nombre de compañía</h3>
      </div>
      <h4 class="job-card__position">Nombre del puesto de trabajo</h4>
      <p class="job-card__meta">Ubicación • Remoto/Presencial</p>
      <div class="job-card__actions">
        <button type="button" class="job-btn job-btn--apply">Aplicar</button>
        <button type="button" class="job-btn job-btn--save">Guardar</button>
      </div>
    </article>
  `;
}

function initLandingEvents() {
  const searchBtn = document.getElementById('search-btn');
  const keywordsInput = document.getElementById('search-keywords');
  const locationInput = document.getElementById('search-location');

  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const keywords = keywordsInput?.value || '';
      const location = locationInput?.value || '';
      const params = new URLSearchParams();
      if (keywords) params.set('search', keywords);
      if (location) params.set('city', location);
      window.location.hash = `#/vacancies${params.toString() ? '?' + params.toString() : ''}`;
    });
  }

  [keywordsInput, locationInput].forEach(input => {
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchBtn?.click();
      });
    }
  });

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try { await authService.logout(); window.location.hash = '#/'; }
      catch (error) { console.error('Logout error:', error); }
    });
  }
}
