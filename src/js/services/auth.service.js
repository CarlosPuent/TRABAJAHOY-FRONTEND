// Authentication Service
import { api } from "@services/api";
import { store } from "@core/store";
import { storage } from "@utils/storage";
import { ROLE, resolveRolesFromPayload } from "@core/roles";

const AUTH_ROLE_VALIDATION_ERROR =
  "No se pudo validar el rol de tu cuenta al iniciar sesión. Inténtalo nuevamente.";
const AUTH_ROLE_MISSING_ERROR =
  "No pudimos iniciar sesión porque tu cuenta no tiene un rol asignado.";

/* =========================
   HELPERS
========================= */

function extractPayload(response) {
  if (response && typeof response === "object") {
    if (response.data && typeof response.data === "object") {
      return response.data;
    }
    return response;
  }
  return {};
}

function normalizeRoles(roles = []) {
  return roles.map((r) => String(r).toUpperCase());
}

function normalizeCompanyMembershipEntry(entry = {}) {
  if (!entry || typeof entry !== "object") return null;

  const company =
    entry.company && typeof entry.company === "object" ? entry.company : null;

  const companyId =
    entry.companyId ||
    entry.company_id ||
    company?.id ||
    company?.companyId ||
    company?.company_id ||
    "";

  if (!companyId) return null;

  const companyName =
    entry.companyName ||
    entry.company_name ||
    company?.name ||
    company?.companyName ||
    company?.company_name ||
    company?.legalName ||
    "";

  return {
    ...entry,
    companyId: String(companyId).trim(),
    companyName: String(companyName || "").trim(),
  };
}

function collectCompanyMemberships(payload = {}, user = null) {
  const sources = [
    payload?.companyMembers,
    payload?.companyMemberships,
    payload?.memberships,
    user?.companyMembers,
    user?.companyMemberships,
    user?.memberships,
  ];

  const asArray = sources.flatMap((s) => (Array.isArray(s) ? s : s ? [s] : []));

  const map = new Map();

  asArray.forEach((item) => {
    const normalized = normalizeCompanyMembershipEntry(item);
    if (!normalized?.companyId) return;

    const prev = map.get(normalized.companyId);
    if (!prev || (!prev.companyName && normalized.companyName)) {
      map.set(normalized.companyId, normalized);
    }
  });

  return [...map.values()];
}

function enrichUserWithCompanyContext(user = null, payload = {}) {
  if (!user || typeof user !== "object") return user;

  const memberships = collectCompanyMemberships(payload, user);
  const first = memberships[0] || null;

  return {
    ...user,
    companyId:
      user.companyId || user.company?.id || first?.companyId || undefined,
    companyName:
      user.companyName || user.company?.name || first?.companyName || undefined,
    companyMemberships: memberships,
  };
}

function resolveSession(payload = {}) {
  const accessToken = payload?.accessToken || null;
  const refreshToken = payload?.refreshToken || null;

  const user = enrichUserWithCompanyContext(payload?.user || null, payload);

  let roles = resolveRolesFromPayload(payload);
  roles = normalizeRoles(roles);

  return { accessToken, refreshToken, user, roles };
}

function persistAuthSession(payload = {}, options = {}) {
  const { fallbackRoles = [] } = options;

  const session = resolveSession(payload);

  let roles = resolveRolesFromPayload(payload, fallbackRoles);
  roles = normalizeRoles(roles);

  session.roles = roles;

  if (!session.accessToken || !session.user) {
    throw new Error("Respuesta de autenticacion invalida");
  }

  store.setAuth(
    {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    },
    session.user,
    session.roles,
  );

  storage.setAuthSession(session);

  return session;
}

function isUnauthorizedError(error) {
  return error?.response?.status === 401;
}

/* =========================
   SERVICE
========================= */

export const authService = {
  async registerCandidate(data) {
    const response = await api.post("/auth/register", data);

    const payload = extractPayload(response);
    const session = persistAuthSession(payload, {
      fallbackRoles: [ROLE.CANDIDATE],
    });

    if (session.roles.length === 0) {
      try {
        await this.fetchCurrentUserProfile();
      } catch {
        store.set("roles", [ROLE.CANDIDATE]);
        storage.setRoles([ROLE.CANDIDATE]);
      }
    }

    return payload;
  },

  async login(credentials) {
    const response = await api.post("/auth/login", credentials);

    const payload = extractPayload(response);
    const session = persistAuthSession(payload);

    // 🔥 VALIDACIÓN FUERTE DE ROLES
    if (!session.roles || session.roles.length === 0) {
      try {
        const profile = await this.fetchCurrentUserProfile();

        if (!profile.roles || profile.roles.length === 0) {
          throw new Error(AUTH_ROLE_MISSING_ERROR);
        }
      } catch {
        store.clearAuth();
        storage.clearAuthSession();
        throw new Error(AUTH_ROLE_VALIDATION_ERROR);
      }
    }

    // 🔥 evitar race condition con router
    await new Promise((resolve) => setTimeout(resolve, 0));

    return payload;
  },

  async refreshToken(refreshToken) {
    const response = await api.post("/auth/refresh", { refreshToken });

    const payload = extractPayload(response);

    const accessToken = payload?.accessToken || null;
    const newRefreshToken = payload?.refreshToken || null;

    if (!accessToken) {
      throw new Error("No se pudo refrescar el access token");
    }

    store.set("accessToken", accessToken);
    store.set("refreshToken", newRefreshToken);

    storage.setTokens({
      accessToken,
      refreshToken: newRefreshToken,
    });

    return payload;
  },

  async fetchCurrentUserProfile() {
    const response = await api.get("/auth/me");

    const payload = extractPayload(response);

    const user = enrichUserWithCompanyContext(payload?.user || null, payload);

    let roles = resolveRolesFromPayload(payload);
    roles = normalizeRoles(roles);

    if (!user) {
      throw new Error("No se pudo obtener el perfil del usuario autenticado");
    }

    store.set("user", user);
    store.set("roles", roles);

    storage.setUser(user);
    storage.setRoles(roles);

    return { user, roles };
  },

  async logout() {
    const hadSession = Boolean(
      store.get("accessToken") ||
      store.get("refreshToken") ||
      storage.getAccessToken(),
    );

    store.clearAuth();
    storage.clearAuthSession();

    if (!hadSession) return;

    try {
      await api.post("/auth/logout");
    } catch (error) {
      if (isUnauthorizedError(error)) {
        console.warn(
          "Logout warning: backend respondió 401, sesión local cerrada.",
        );
        return;
      }
      console.warn("Logout backend warning:", error?.message || error);
    }
  },

  isAuthenticated() {
    return store.get("isAuthenticated");
  },

  getCurrentUser() {
    return store.get("user");
  },

  getUserRoles() {
    return store.get("roles");
  },

  hasRole(roleName) {
    const roles = store.get("roles") || [];
    return roles.includes(String(roleName).toUpperCase());
  },
};
