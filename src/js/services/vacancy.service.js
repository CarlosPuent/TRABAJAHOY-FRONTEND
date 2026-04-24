// Vacancy Service
import { api } from "@services/api";

export const vacancyService = {
  /**
   * Get all published vacancies (public)
   * @param {Object} params - { page, limit, categoryId, type, modality, level, country, city, search }
   */
  async getVacancies(params = {}) {
    const response = await api.get("/vacancies", params);
    return response.data;
  },

  // Agrega esto dentro del objeto vacancyService en vacancy.service.js
  async getVacanciesForManagement(params = {}) {
    // Usamos el mismo endpoint que ya tenías definido para gestión
    const response = await api.get("/vacancies/manage/all", params);
    return response.data;
  },

  /**
   * Get vacancy by ID (public)
   * @param {string} id - Vacancy ID
   */
  async getVacancyById(id) {
    const response = await api.get(`/vacancies/${id}`);
    return response.data;
  },

  /**
   * Get all vacancies (management view - requires auth)
   * @param {Object} params - Query parameters
   */
  async getAllVacancies(params = {}) {
    const response = await api.get("/vacancies/manage/all", params);
    return response.data;
  },

  async getPipeline(vacancyId) {
    const response = await api.get(
      `/vacancies/${vacancyId}/applications/pipeline`,
    );
    return response.data?.data || response.data;
  },

  async updateStatus(vacancyId, newStatus) {
    // Aprovechamos tu endpoint de updateVacancy que ya recibe el status
    const response = await api.patch(`/vacancies/${vacancyId}`, {
      status: newStatus,
    });
    return response.data?.data || response.data;
  },

  async updateApplicationStatus(applicationId, status) {
    const response = await api.post(`/applications/${applicationId}/status`, {
      toStatus: status,
      notes: "Movido desde Kanban",
    });
    return response.data?.data || response.data;
  },
  /**
   * Get vacancy with full details (requires auth)
   * @param {string} id - Vacancy ID
   */
  async getVacancyManage(id) {
    const response = await api.get(`/vacancies/manage/${id}`);
    return response.data;
  },

  /**
   * Create a new vacancy (requires auth - recruiter, admin)
   * @param {Object} data - Vacancy data
   */
  async createVacancy(data) {
    const response = await api.post("/vacancies", data);
    return response.data;
  },

  /**
   * Update a vacancy (requires auth - recruiter, admin)
   * @param {string} id - Vacancy ID
   * @param {Object} data - Updated vacancy data
   */
  async updateVacancy(id, data) {
    const response = await api.patch(`/vacancies/${id}`, data);
    return response.data;
  },

  /**
   * Delete a vacancy (requires auth - recruiter, admin)
   * @param {string} id - Vacancy ID
   */
  async deleteVacancy(id) {
    const response = await api.delete(`/vacancies/${id}`);
    return response.data;
  },

  /**
   * Close a vacancy (requires auth)
   * @param {string} id - Vacancy ID
   */
  async closeVacancy(id) {
    const response = await api.patch(`/vacancies/${id}/close`);
    return response.data;
  },

  /**
   * Archive a vacancy (requires auth)
   * @param {string} id - Vacancy ID
   */
  async archiveVacancy(id) {
    const response = await api.patch(`/vacancies/${id}/archive`);
    return response.data;
  },

  // Job Categories
  async getCategories() {
    const response = await api.get("/vacancies/categories");
    return response.data;
  },

  async getCategoryById(id) {
    const response = await api.get(`/vacancies/categories/${id}`);
    return response.data;
  },

  async createCategory(data) {
    const response = await api.post("/vacancies/categories", data);
    return response.data;
  },

  async updateCategory(id, data) {
    const response = await api.patch(`/vacancies/categories/${id}`, data);
    return response.data;
  },

  async deleteCategory(id) {
    const response = await api.delete(`/vacancies/categories/${id}`);
    return response.data;
  },

  // Vacancy Skills
  async getVacancySkills(vacancyId) {
    const response = await api.get(`/vacancies/${vacancyId}/skills`);
    return response.data;
  },

  async addVacancySkill(vacancyId, data) {
    const response = await api.post(`/vacancies/${vacancyId}/skills`, data);
    return response.data;
  },

  async updateVacancySkill(skillId, data) {
    const response = await api.patch(`/vacancies/skills/${skillId}`, data);
    return response.data;
  },

  async deleteVacancySkill(skillId) {
    const response = await api.delete(`/vacancies/skills/${skillId}`);
    return response.data;
  },

  // Vacancy Benefits
  async getVacancyBenefits(vacancyId) {
    const response = await api.get(`/vacancies/${vacancyId}/benefits`);
    return response.data;
  },

  async addVacancyBenefit(vacancyId, data) {
    const response = await api.post(`/vacancies/${vacancyId}/benefits`, data);
    return response.data;
  },

  async updateVacancyBenefit(benefitId, data) {
    const response = await api.patch(`/vacancies/benefits/${benefitId}`, data);
    return response.data;
  },

  async deleteVacancyBenefit(benefitId) {
    const response = await api.delete(`/vacancies/benefits/${benefitId}`);
    return response.data;
  },
};
