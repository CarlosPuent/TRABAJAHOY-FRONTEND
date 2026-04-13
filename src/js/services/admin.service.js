// Admin Service
import { api } from '@services/api';

export const adminService = {
  // User Management
  async getUsers(params = {}) {
    const response = await api.get('/admin/users', params);
    return response.data;
  },

  async getUserRoles(userId) {
    const response = await api.get(`/admin/users/${userId}/roles`);
    return response.data;
  },

  async assignRole(userId, roleName) {
    const response = await api.post(`/admin/users/${userId}/roles`, { roleName });
    return response.data;
  },

  async removeRole(userId) {
    const response = await api.delete(`/admin/users/${userId}/roles`);
    return response.data;
  },

  // Role Management
  async getRoles() {
    const response = await api.get('/admin/roles');
    return response.data;
  },

  async getUsersByRole(roleName) {
    const response = await api.get(`/admin/roles/${roleName}/users`);
    return response.data;
  },
};
