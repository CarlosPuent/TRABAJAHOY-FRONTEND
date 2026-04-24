import apiClient, { api } from "@services/api";

export const adminService = {
  /* =========================
     USERS
  ========================= */

  async getUsers(params = {}) {
    return await api.get("/admin/users", params);
  },

  async getUsersByRole(roleName, params = {}) {
    return await api.get(`/admin/roles/${roleName}/users`, params);
  },

  async getUserRoles(userId) {
    return await api.get(`/admin/users/${userId}/roles`);
  },

  async assignRole(userId, roleName) {
    return await api.post(`/admin/users/${userId}/roles`, { roleName });
  },

  async removeRole(userId, roleName) {
    const response = await apiClient.delete(`/admin/users/${userId}/roles`, {
      data: { roleName },
    });
    return response.data;
  },

  async updateUser(userId, data) {
    const response = await api.patch(`/admin/users/${userId}`, data);
    return response.data?.data || response.data;
  },

  async deleteUser(userId) {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data?.data || response.data;
  },

  async updateCompany(companyId, data) {
    const response = await api.patch(
      `/admin/users/companies/${companyId}`,
      data,
    );

    return response.data?.data || response.data;
  },

  async toggleUserStatus(userId, isActive) {
    const response = await api.patch(`/admin/users/${userId}/status`, {
      isActive,
    });
    return response.data?.data || response.data;
  },

  /* =========================
     ROLES
  ========================= */

  async getRoles() {
    return await api.get("/admin/roles");
  },

  /* =========================
     DASHBOARD
  ========================= */

  async getDashboard() {
    return await api.get("/admin/dashboard");
  },

  async getCompanies(params = {}) {
    return await api.get("/admin/companies", params);
  },

  async approveCompany(companyId) {
    const response = await api.post(`/admin/companies/${companyId}/approve`);
    return response.data?.data || response.data;
  },

  async rejectCompany(companyId, reason = "") {
    const response = await api.post(`/admin/companies/${companyId}/reject`, {
      reason,
    });
    return response.data?.data || response.data;
  },

  async deleteCompany(companyId) {
    const response = await api.delete(`/admin/companies/${companyId}`);
    return response.data?.data || response.data;
  },
};
