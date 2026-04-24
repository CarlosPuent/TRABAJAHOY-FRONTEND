// Application Configuration

const DEFAULT_LOCAL_API_BASE_URL = "http://localhost:3000/api";
const DEFAULT_PRODUCTION_API_BASE_URL =
  "https://trabajahoy-backend-production.up.railway.app/api";

function resolveApiBaseUrl() {
  const envApiBaseUrl =
    typeof import.meta.env.VITE_API_BASE_URL === "string"
      ? import.meta.env.VITE_API_BASE_URL.trim()
      : "";

  if (envApiBaseUrl) {
    return envApiBaseUrl.replace(/\/+$/, "");
  }

  // Fallback: local backend in development, Railway in production.
  return import.meta.env.DEV
    ? DEFAULT_LOCAL_API_BASE_URL
    : DEFAULT_PRODUCTION_API_BASE_URL;
}

export const config = {
  // API Base URL resolved from Vite env vars with safe environment fallbacks.
  API_BASE_URL: resolveApiBaseUrl(),

  // App settings
  APP_NAME: "TrabajaHoy",
  APP_VERSION: "1.0.0",

  // Token settings
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiration

  // Pagination defaults
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,

  // File upload limits
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_CV_FORMATS: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],

  // Routes
  ROUTES: {
    ADMIN_COMPANIES: "/admin/companies",
    LANDING: "/",
    LOGIN: "/login",
    REGISTER_CANDIDATE: "/register",
    REGISTER_COMPANY: "/register-company",
    CANDIDATE_DASHBOARD: "/candidate/dashboard",
    MY_PROFILE: "/candidate/profile",
    EDIT_PROFILE: "/candidate/profile/edit",
    MANAGE_CV: "/candidate/cv",
    SAVED_JOBS: "/candidate/saved-jobs",
    MY_APPLICATIONS: "/candidate/applications",
    VACANCIES: "/vacancies",
    VACANCY_DETAIL: "/vacancies/:id",
    COMPANY_DASHBOARD: "/company/dashboard",
    MY_VACANCIES: "/company/vacancies",
    COMPANY_PROFILE: "/company/profile", // 🔥 Esta es la ruta que usaremos
    CREATE_VACANCY: "/company/vacancies/create",
    EDIT_VACANCY: "/company/vacancies/edit/:id",
    VACANCY_APPLICANTS: "/company/vacancies/:id/applicants",
    ADMIN_DASHBOARD: "/admin/dashboard",
    ADMIN_USERS: "/admin/users",
    ADMIN_VERIFY_COMPANY: "/admin/verify-company/:id",
    RESOURCES: "/resources",
    RESOURCE_DETAIL: "/resources/:id",
    FORUM: "/forum",
    FORUM_THREAD: "/forum/thread/:id",
    COMPANY_RECRUITERS: "/company/recruiters",
  },
};

// Environment detection
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
