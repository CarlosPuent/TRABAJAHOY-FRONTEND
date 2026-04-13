// Resource Service
import { api } from '@services/api';

export const resourceService = {
  // Public endpoints
  async getResources(params = {}) {
    const response = await api.get('/resources', params);
    return response.data;
  },

  async getResourceById(id) {
    const response = await api.get(`/resources/${id}`);
    return response.data;
  },

  async getCategories() {
    const response = await api.get('/resources/categories');
    return response.data;
  },

  async getCategoryById(id) {
    const response = await api.get(`/resources/categories/${id}`);
    return response.data;
  },

  async getRatings(resourceId) {
    const response = await api.get(`/resources/${resourceId}/ratings`);
    return response.data;
  },

  async getRelatedResources(resourceId) {
    const response = await api.get(`/resources/${resourceId}/related`);
    return response.data;
  },

  // Authenticated endpoints (admin, moderator)
  async createResource(data) {
    const response = await api.post('/resources', data);
    return response.data;
  },

  async updateResource(id, data) {
    const response = await api.patch(`/resources/${id}`, data);
    return response.data;
  },

  async deleteResource(id) {
    const response = await api.delete(`/resources/${id}`);
    return response.data;
  },

  // Resource Categories
  async createCategory(data) {
    const response = await api.post('/resources/categories', data);
    return response.data;
  },

  async updateCategory(id, data) {
    const response = await api.patch(`/resources/categories/${id}`, data);
    return response.data;
  },

  async deleteCategory(id) {
    const response = await api.delete(`/resources/categories/${id}`);
    return response.data;
  },

  // Ratings
  async rateResource(resourceId, rating, review) {
    const response = await api.post(`/resources/${resourceId}/ratings`, { rating, review });
    return response.data;
  },

  // Related Resources
  async addRelatedResource(resourceId, relatedResourceId) {
    const response = await api.post(`/resources/${resourceId}/related`, { resourceId: relatedResourceId });
    return response.data;
  },

  async removeRelatedResource(relatedId) {
    const response = await api.delete(`/resources/related/${relatedId}`);
    return response.data;
  },
};
