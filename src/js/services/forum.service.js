// Forum Service
import { api } from '@services/api';

export const forumService = {
  // Categories
  async getCategories() {
    const response = await api.get('/forum/categories');
    return response.data;
  },

  async getCategoryById(id) {
    const response = await api.get(`/forum/categories/${id}`);
    return response.data;
  },

  // Threads
  async getThreads(params = {}) {
    const response = await api.get('/forum/threads', params);
    return response.data;
  },

  async getThreadById(id) {
    const response = await api.get(`/forum/threads/${id}`);
    return response.data;
  },

  async createThread(data) {
    const response = await api.post('/forum/threads', data);
    return response.data;
  },

  async updateThread(id, data) {
    const response = await api.patch(`/forum/threads/${id}`, data);
    return response.data;
  },

  async deleteThread(id) {
    const response = await api.delete(`/forum/threads/${id}`);
    return response.data;
  },

  // Posts
  async getPosts(threadId) {
    const response = await api.get(`/forum/threads/${threadId}/posts`);
    return response.data;
  },

  async addPost(threadId, content) {
    const response = await api.post(`/forum/threads/${threadId}/posts`, { content });
    return response.data;
  },

  async getPostById(id) {
    const response = await api.get(`/forum/posts/${id}`);
    return response.data;
  },

  async updatePost(id, content) {
    const response = await api.patch(`/forum/posts/${id}`, { content });
    return response.data;
  },

  async deletePost(id) {
    const response = await api.delete(`/forum/posts/${id}`);
    return response.data;
  },

  // Reporting
  async reportThread(threadId, reason, details) {
    const response = await api.post(`/forum/threads/${threadId}/reports`, { reason, details });
    return response.data;
  },

  async reportPost(postId, reason, details) {
    const response = await api.post(`/forum/posts/${postId}/reports`, { reason, details });
    return response.data;
  },

  // Moderation (admin, moderator)
  async getReports(params = {}) {
    const response = await api.get('/forum/reports', params);
    return response.data;
  },

  async getReportById(id) {
    const response = await api.get(`/forum/reports/${id}`);
    return response.data;
  },

  async updateReport(id, data) {
    const response = await api.patch(`/forum/reports/${id}`, data);
    return response.data;
  },
};
