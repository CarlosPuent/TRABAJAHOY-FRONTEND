// Authentication Service
import { api } from "@services/api";
import { store } from "@core/store";
import { storage } from "@utils/storage";
import { ROLE, resolveRolesFromPayload } from "@core/roles";

const AUTH_ROLE_VALIDATION_ERROR =
  "No se pudo validar el rol de tu cuenta al iniciar sesión. Inténtalo nuevamente.";
const AUTH_ROLE_MISSING_ERROR =
  "No pudimos iniciar sesión porque tu cuenta no tiene un rol asignado.";

function extractPayload(response) {
  if (response && typeof response === "object") {
    if (response.data && typeof response.data === "object") {
      return response.data;
    }
    return response;
  }
  return {};
}

function normalizeCompanyMembershipEntry(entry = {}) {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const company =
    entry.company && typeof entry.company === "object" ? entry.company : null;

  const companyId =
    entry.companyId ||
    entry.company_id ||
    company?.id ||
    company?.companyId ||
    company?.company_id ||
    "";

  if (!companyId) {
    return null;
  }

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
    payload?.company_members,
    payload?.companyMemberships,
    payload?.company_memberships,
    payload?.memberships,
    payload?.companyMembership,
    payload?.company_membership,
    user?.companyMembers,
    user?.company_members,
    user?.companyMemberships,
    user?.company_memberships,
    user?.memberships,
    user?.companyMembership,
    user?.company_membership,
  ];

  const asArray = sources.flatMap((source) =>
    Array.isArray(source) ? source : source ? [source] : [],
  );

  const map = new Map();
  asArray.forEach((item) => {
    const normalized = normalizeCompanyMembershipEntry(item);
    if (!normalized?.companyId) return;

    const previous = map.get(normalized.companyId);
    if (!previous || (!previous.companyName && normalized.companyName)) {
      map.set(normalized.companyId, normalized);
    }
  });

  return [...map.values()];
}

function enrichUserWithCompanyContext(user = null, payload = {}) {
  if (!user || typeof user !== "object") {
    return user;
  }

  const memberships = collectCompanyMemberships(payload, user);
  const firstMembership = memberships[0] || null;

  const resolvedCompanyId =
    user.companyId ||
    user.company_id ||
    user.company?.id ||
    user.company?.companyId ||
    user.company?.company_id ||
    firstMembership?.companyId ||
    "";

  const resolvedCompanyName =
    user.companyName ||
    user.company_name ||
    user.company?.name ||
    user.company?.companyName ||
    user.company?.company_name ||
    firstMembership?.companyName ||
    "";

  return {
    ...user,
    companyId: resolvedCompanyId ? String(resolvedCompanyId).trim() : undefined,
    companyName: resolvedCompanyName
      ? String(resolvedCompanyName).trim()
      : undefined,
    companyMembers: memberships,
    company_members: memberships,
    companyMemberships: memberships,
    company_memberships: memberships,
  };
}

function resolveSession(payload = {}) {
  const accessToken = payload?.accessToken || null;
  const refreshToken = payload?.refreshToken || null;
  const user = enrichUserWithCompanyContext(payload?.user || null, payload);
  const roles = resolveRolesFromPayload(payload);

  return { accessToken, refreshToken, user, roles };
}

function persistAuthSession(payload = {}, options = {}) {
  const { fallbackRoles = [] } = options;
  const session = resolveSession(payload);
  session.roles = resolveRolesFromPayload(payload, fallbackRoles);

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

export const authService = {
  /**
   * Register a new candidate
   * @param {Object} data - { email, password, firstName, lastName }
   */
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

  /**
   * Login user
   * @param {Object} credentials - { email, password }
   */
  async login(credentials) {
    const response = await api.post("/auth/login", credentials);

    const payload = extractPayload(response);
    const session = persistAuthSession(payload);

    if (session.roles.length === 0) {
      try {
        await this.fetchCurrentUserProfile();
      } catch {
        store.clearAuth();
        storage.clearAuthSession();
        throw new Error(AUTH_ROLE_VALIDATION_ERROR);
      }

      if (store.getRoles().length === 0) {
        store.clearAuth();
        storage.clearAuthSession();
        throw new Error(AUTH_ROLE_MISSING_ERROR);
      }
    }

    return payload;
  },

  /**
   * Refresh access token
   * @param {string} refreshToken
   */
  async refreshToken(refreshToken) {
    const response = await api.post("/auth/refresh", { refreshToken });
    const payload = extractPayload(response);
    const accessToken = payload?.accessToken || null;
    const newRefreshToken = payload?.refreshToken || null;

    if (!accessToken) {
      throw new Error("No se pudo refrescar el access token");
    }

    // Update store and storage
    store.set("accessToken", accessToken);
    store.set("refreshToken", newRefreshToken);
    storage.setTokens({ accessToken, refreshToken: newRefreshToken });

    return payload;
  },

  /**
   * Get current user profile
   */
  async fetchCurrentUserProfile() {
    const response = await api.get("/auth/me");
    const payload = extractPayload(response);
    const user = enrichUserWithCompanyContext(payload?.user || null, payload);
    const roles = resolveRolesFromPayload(payload);

    if (!user) {
      throw new Error("No se pudo obtener el perfil del usuario autenticado");
    }

    // Update store
    store.set("user", user);
    store.set("roles", roles);
    storage.setUser(user);
    storage.setRoles(roles);

    return { user, roles };
  },

  /**
   * Logout user
   */
  async logout() {
    const hadSession = Boolean(
      store.get("accessToken") ||
      store.get("refreshToken") ||
      storage.getAccessToken() ||
      storage.getRefreshToken(),
    );

    // Local first: guarantees logout even if the request fails or the page reloads.
    store.clearAuth();
    storage.clearAuthSession();

    if (!hadSession) {
      return;
    }

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

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return store.get("isAuthenticated");
  },

  /**
   * Get current user
   */
  getCurrentUser() {
    return store.get("user");
  },

  /**
   * Get user roles
   */
  getUserRoles() {
    return store.get("roles");
  },

  /**
   * Check if user has specific role
   */
  hasRole(roleName) {
    const roles = store.get("roles");
    return roles && roles.includes(roleName);
  },
};
