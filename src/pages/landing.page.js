import { vacancyService } from "@services/vacancy.service";
import { authService } from "@services/auth.service";
import { store } from "@core/store";
import { config } from "@core/config";
import { showLoading, renderNavbar, renderPage } from "@utils/ui.js";

/* =====================================================
   UTILIDADES DE FORMATO (ESTILO EJECUTIVO)
===================================================== */

const formatCurrency = (val) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 0 }).format(val);

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* =====================================================
   CONTROLADOR PRINCIPAL
===================================================== */

export async function initLandingPage(params, query) {
  const app = document.getElementById("app");
  const isAuthenticated = store.get("isAuthenticated");
  const user = store.get("user");

  showLoading("Sincronizando vacantes...");

  try {
    const response = await vacancyService.getVacancies({ limit: 6 });
    const vacancies = Array.isArray(response) ? response : response.data || [];

    renderLanding(app, vacancies, isAuthenticated, user);
    initLandingEvents();
  } catch (error) {
    console.error("Error loading landing page:", error);
    renderLanding(app, [], isAuthenticated, user);
    initLandingEvents();
  }
}

/* =====================================================
   VISTAS Y COMPONENTES (MINIMALISMO PROFESIONAL)
===================================================== */

function renderLanding(container, vacancies, isAuthenticated, user) {
  const jobsHTML =
    vacancies.length > 0
      ? vacancies.map((v) => getJobCardHTML(v)).join("\n")
      : `<div class="empty-results-msg">No se encontraron vacantes activas en este momento.</div>`;

  const navbar = renderNavbar({ activeRoute: "", isAuthenticated, user });

  const mainContent = `
    <section class="hero-original">
      <div class="container">
        <h1 class="hero-original__title">Encuentra tu próximo empleo hoy</h1>
        
        <div class="hero-original__search-container">
          <div class="search-input-group search-input-group--main">
            <input type="text" id="search-keywords" placeholder="Palabras clave" />
            <svg class="input-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
          
          <div class="search-input-group search-input-group--location">
            <svg class="input-icon" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <input type="text" id="search-location" placeholder="Ubicación" />
          </div>
          <button type="button" id="search-btn" class="search-submit-btn">Buscar</button>
        </div>
        
        <p class="hero-original__caption">Miles de oportunidades laborales publicadas por empresas verificadas</p>
      </div>
    </section>

    <section class="featured-section">
      <div class="container">
        <div class="section-meta">
          <h2 class="section-meta__title">Empleos destacados</h2>
          <div class="section-meta__line"></div>
        </div>
        
        <div class="professional-grid">
          ${jobsHTML}
        </div>
        
        <div class="action-footer">
          <a href="#/vacancies" class="btn-all-vacancies">Explorar catálogo completo</a>
        </div>
      </div>
    </section>
  `;

  container.innerHTML = renderPage({
    navbar,
    main: mainContent,
    extraStyles: getExecutiveStyles(),
  });
}

function getJobCardHTML(v) {
  const company = v.company || {};
  const companyName = company.name || "Empresa Privada";
  const initial = companyName.charAt(0).toUpperCase();

  return `
    <article class="job-card-exec" onclick="window.location.hash='#/vacancies/${v.id}'">
      <div class="job-card-exec__header">
        <div class="job-card-exec__logo">
          ${
            company.logoUrl
              ? `<img src="${company.logoUrl}" alt="${companyName}">`
              : `<span>${initial}</span>`
          }
        </div>
        <div class="job-card-exec__meta">
          <span class="company-name">${escapeHtml(companyName)}</span>
          <span class="verification-tag">Verificada</span>
        </div>
      </div>
      
      <div class="job-card-exec__body">
        <h4 class="job-title">${escapeHtml(v.title)}</h4>
        <p class="job-location">
          <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          ${v.city || "El Salvador"} • ${v.modality || "Presencial"}
        </p>
      </div>

      <div class="job-card-exec__footer">
        <div class="job-salary">
          ${
            v.salaryMin
              ? `<span class="salary-range">$${formatCurrency(v.salaryMin)} - $${formatCurrency(v.salaryMax)}</span> <span class="currency-label">USD</span>`
              : '<span class="salary-unspecified">Salario según aptitudes</span>'
          }
        </div>
        <div class="job-card-exec__actions" onclick="event.stopPropagation()">
          <a href="#/register" class="btn-apply-now" style="text-decoration: none; text-align: center;">
            Postularme
          </a>
        </div>
      </div>
    </article>
  `;
}

/* =====================================================
   LÓGICA DE EVENTOS
===================================================== */

/* =====================================================
   LÓGICA DE EVENTOS (CON REDIRECCIÓN A REGISTRO)
===================================================== */

function initLandingEvents() {
  const container = document.getElementById("app"); // Usamos el contenedor principal
  const searchBtn = document.getElementById("search-btn");
  const keywordsInput = document.getElementById("search-keywords");
  const locationInput = document.getElementById("search-location");

  // 1. Manejo de Búsqueda
  if (searchBtn) {
    searchBtn.onclick = () => {
      const keywords = keywordsInput?.value.trim() || "";
      const location = locationInput?.value.trim() || "";
      const params = new URLSearchParams();
      if (keywords) params.set("search", keywords);
      if (location) params.set("city", location);
      window.location.hash = `#/vacancies${params.toString() ? "?" + params.toString() : ""}`;
    };
  }

  // Soporte para Enter en inputs
  [keywordsInput, locationInput].forEach((input) => {
    input?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") searchBtn?.click();
    });
  });
  container.addEventListener("click", (e) => {
    // Verificamos si el clic fue en el botón de postularse
    if (e.target && e.target.classList.contains("btn-apply-now")) {
      e.preventDefault();
      e.stopPropagation(); // Evitamos que el clic active el evento de la tarjeta

      const vacancyId = e.target.getAttribute("data-vacancy-id");
      console.log(`Redirigiendo a registro para la vacante: ${vacancyId}`);

      // Enviamos al usuario a la página de registro
      window.location.hash = "#/register";
    }
  });
}

/* =====================================================
   ESTILOS DE ALTO NIVEL (SIN ELEMENTOS INFANTILES)
===================================================== */

function getExecutiveStyles() {
  return `
    /* HERO: MANTENIENDO TU FONDO PERSONALIZADO */
    .hero-original { 
      padding: 80px 0; 
      background: linear-gradient(to right, #ef812a, #a26591, #3b59df); 
      color: white; 
      text-align: left;
    }
    .hero-original__title { font-size: 42px; font-weight: 800; margin-bottom: 32px; letter-spacing: -0.03em; }
    
    /* BUSCADOR DENTRO DEL HERO */
    .hero-original__search-container { 
      display: flex; gap: 12px; background: rgba(255,255,255,1); padding: 10px; border-radius: 50px; max-width: 900px; box-shadow: 0 15px 35px rgba(0,0,0,0.2); 
    }
    .search-input-group { display: flex; align-items: center; padding: 0 15px; flex: 1; }
    .search-input-group--main { border-right: 1px solid #e2e8f0; }
    .search-input-group input { border: none; outline: none; width: 100%; height: 40px; font-size: 15px; color: #1e293b; padding-left: 10px; }
    .input-icon { width: 18px; height: 18px; color: #94a3b8; stroke: currentColor; fill: none; stroke-width: 2; }
    .search-submit-btn { background: #0f172a; color: white; border: none; padding: 0 35px; border-radius: 50px; font-weight: 600; cursor: pointer; transition: background 0.3s; }
    .search-submit-btn:hover { background: #334155; }
    .hero-original__caption { margin-top: 20px; font-size: 13px; opacity: 0.9; font-weight: 500; }

    /* SECCIÓN DE EMPLEOS */
    .featured-section { padding: 80px 0; background: #f8fafc; }
    .section-meta { margin-bottom: 40px; display: flex; align-items: center; gap: 20px; }
    .section-meta__title { font-size: 24px; font-weight: 700; color: #0f172a; white-space: nowrap; }
    .section-meta__line { height: 1px; background: #e2e8f0; width: 100%; }
    
    .professional-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }

    /* TARJETAS EJECUTIVAS */
    .job-card-exec { 
      background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; cursor: pointer; 
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column;
    }
    .job-card-exec:hover { border-color: #cbd5e1; transform: translateY(-4px); box-shadow: 0 10px 25px rgba(0,0,0,0.04); }
    
    .job-card-exec__header { display: flex; gap: 12px; margin-bottom: 20px; align-items: center; }
    .job-card-exec__logo { 
      width: 44px; height: 44px; background: #f1f5f9; border-radius: 4px; display: flex; align-items: center; justify-content: center; overflow: hidden; 
      font-weight: 800; color: #475569; font-size: 18px; 
    }
    .job-card-exec__logo img { width: 100%; height: 100%; object-fit: cover; }
    .job-card-exec__meta { display: flex; flex-direction: column; }
    .company-name { font-size: 14px; font-weight: 600; color: #64748b; }
    .verification-tag { font-size: 10px; color: #10b981; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    
    .job-title { font-size: 17px; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
    .job-location { font-size: 13px; color: #64748b; display: flex; align-items: center; gap: 6px; }
    .job-location svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; }
    
    .job-card-exec__footer { margin-top: auto; padding-top: 20px; border-top: 1px solid #f8fafc; display: flex; justify-content: space-between; align-items: center; }
    .salary-range { font-weight: 700; color: #1e293b; font-size: 14px; }
    .currency-label { font-size: 10px; color: #94a3b8; font-weight: 600; }
    .btn-apply-now { background: transparent; border: 1.5px solid #0f172a; color: #0f172a; padding: 8px 16px; border-radius: 4px; font-size: 13px; font-weight: 700; cursor: pointer; transition: 0.2s; }
    .btn-apply-now:hover { background: #0f172a; color: white; }

    .action-footer { text-align: center; margin-top: 50px; }
    .btn-all-vacancies { display: inline-block; padding: 12px 35px; border-radius: 4px; background: #0f172a; color: white; font-weight: 600; font-size: 14px; text-decoration: none; transition: opacity 0.2s; }
    .btn-all-vacancies:hover { opacity: 0.9; }
    .empty-results-msg { text-align: center; padding: 60px; color: #94a3b8; font-style: italic; }
  `;
}
