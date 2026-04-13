import { config } from "@core/config";

export const ROLE = Object.freeze({
  ADMIN: "admin",
  RECRUITER: "recruiter",
  CANDIDATE: "candidate",
  MODERATOR: "moderator",
});

export const VALID_ROLES = Object.freeze(Object.values(ROLE));

export const ROLE_PRIORITY = Object.freeze([
  ROLE.ADMIN,
  ROLE.MODERATOR,
  ROLE.RECRUITER,
  ROLE.CANDIDATE,
]);

export const DASHBOARD_BY_ROLE = Object.freeze({
  [ROLE.CANDIDATE]: config.ROUTES.CANDIDATE_DASHBOARD,
  [ROLE.RECRUITER]: config.ROUTES.COMPANY_DASHBOARD,
  [ROLE.ADMIN]: config.ROUTES.ADMIN_DASHBOARD,
  [ROLE.MODERATOR]: config.ROUTES.FORUM,
});

const PUBLIC_NAVIGATION = Object.freeze([
  { href: `#${config.ROUTES.LANDING}`, label: "Inicio" },
  { href: `#${config.ROUTES.VACANCIES}`, label: "Buscar empleos" },
  { href: `#${config.ROUTES.RESOURCES}`, label: "Recursos" },
  { href: `#${config.ROUTES.FORUM}`, label: "Foro" },
]);

const ROLE_NAVIGATION = Object.freeze({
  [ROLE.CANDIDATE]: [
    { href: `#${config.ROUTES.CANDIDATE_DASHBOARD}`, label: "Dashboard" },
    { href: `#${config.ROUTES.VACANCIES}`, label: "Buscar empleos" },
    { href: `#${config.ROUTES.SAVED_JOBS}`, label: "Guardados" },
    { href: `#${config.ROUTES.MY_APPLICATIONS}`, label: "Mis postulaciones" },
    { href: `#${config.ROUTES.MY_PROFILE}`, label: "Mi Perfil" },
    { href: `#${config.ROUTES.MANAGE_CV}`, label: "CV" },
  ],
  [ROLE.RECRUITER]: [
    { href: `#${config.ROUTES.COMPANY_DASHBOARD}`, label: "Dashboard empresa" },
    { href: `#${config.ROUTES.COMPANY_PROFILE}`, label: "Perfil empresa" },
    { href: `#${config.ROUTES.CREATE_VACANCY}`, label: "Crear Vacante" },
  ],
  [ROLE.ADMIN]: [
    { href: `#${config.ROUTES.ADMIN_DASHBOARD}`, label: "Dashboard admin" },
    { href: `#${config.ROUTES.ADMIN_USERS}`, label: "Usuarios" },
  ],
  [ROLE.MODERATOR]: [
    { href: `#${config.ROUTES.FORUM}`, label: "Moderación" },
    { href: `#${config.ROUTES.RESOURCES}`, label: "Recursos" },
  ],
});

const ROLE_LABELS = Object.freeze({
  [ROLE.CANDIDATE]: "Candidato",
  [ROLE.RECRUITER]: "Reclutador",
  [ROLE.ADMIN]: "Administrador",
  [ROLE.MODERATOR]: "Moderador",
});

export function isValidRole(role) {
  return VALID_ROLES.includes(
    String(role || "")
      .trim()
      .toLowerCase(),
  );
}

export function normalizeRoles(roles) {
  if (!Array.isArray(roles)) return [];

  const normalized = roles
    .map((role) =>
      String(role || "")
        .trim()
        .toLowerCase(),
    )
    .filter((role) => isValidRole(role));

  return [...new Set(normalized)];
}

export function resolveRolesFromPayload(payload = {}, fallbackRoles = []) {
  const candidateRoles = [
    ...(Array.isArray(payload?.roles) ? payload.roles : []),
    ...(Array.isArray(payload?.user?.roles) ? payload.user.roles : []),
    ...(payload?.role ? [payload.role] : []),
    ...(payload?.user?.role ? [payload.user.role] : []),
    ...(Array.isArray(fallbackRoles) ? fallbackRoles : [fallbackRoles]),
  ];

  return normalizeRoles(candidateRoles);
}

export function getPrimaryRole(roles) {
  const normalized = normalizeRoles(roles);
  return (
    ROLE_PRIORITY.find((role) => normalized.includes(role)) ||
    normalized[0] ||
    null
  );
}

export function getDashboardRouteForRoles(
  roles,
  fallback = config.ROUTES.LANDING,
) {
  const primaryRole = getPrimaryRole(roles);
  return (primaryRole && DASHBOARD_BY_ROLE[primaryRole]) || fallback;
}

export function hasAnyRole(userRoles, allowedRoles) {
  const normalizedUserRoles = normalizeRoles(userRoles);
  const normalizedAllowedRoles = normalizeRoles(allowedRoles);

  if (normalizedAllowedRoles.length === 0) return true;
  return normalizedAllowedRoles.some((role) =>
    normalizedUserRoles.includes(role),
  );
}

export function getNavigationForRoles(roles, isAuthenticated = false) {
  if (!isAuthenticated) {
    return [...PUBLIC_NAVIGATION];
  }

  const primaryRole = getPrimaryRole(roles);
  if (!primaryRole) {
    return [...PUBLIC_NAVIGATION];
  }

  return [...(ROLE_NAVIGATION[primaryRole] || PUBLIC_NAVIGATION)];
}

export function getRoleLabel(role) {
  const normalizedRole = String(role || "")
    .trim()
    .toLowerCase();

  return ROLE_LABELS[normalizedRole] || "Usuario";
}
