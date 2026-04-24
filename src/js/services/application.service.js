// Application Service
import { api } from "@services/api";

export const applicationService = {
  /**
   * Apply to a vacancy
   * @param {Object} data - { vacancyId, coverLetter, cvFileUrl, resumeUrl }
   */
  async applyToVacancy(data) {
    const response = await api.post("/applications", data);
    return response.data;
  },

  /**
   * List applications (role-based)
   * - candidate: sees own applications
   * - recruiter/admin: sees all applications
   * @param {Object} params - { page, limit, status, vacancyId }
   */
  async getApplications(params = {}) {
    if (params.vacancyId) {
      // use specialized recruiter route
      const { vacancyId, ...rest } = params;
      const response = await api.get(
        `/applications/vacancies/${vacancyId}/applicants`,
        rest,
      );
      return response.data;
    }
    const response = await api.get("/applications", params);
    return response.data;
  },

  /**
   * Get application by ID
   * @param {string} id - Application ID
   */
  async getApplicationById(id) {
    const response = await api.get(`/applications/${id}`);
    return response.data;
  },

  /**
   * Update application
   * @param {string} id - Application ID
   * @param {Object} data - Updated data
   */
  async updateApplication(id, data) {
    const response = await api.patch(`/applications/${id}`, data);
    return response.data;
  },

  // Application Status (recruiter, admin)
  async changeApplicationStatus(id, data) {
    const response = await api.post(`/applications/${id}/status`, {
      toStatus: data.toStatus,
      notes: data.notes,
    });
    return response.data;
  },

  // Application History
  async getApplicationHistory(id) {
    const response = await api.get(`/applications/${id}/history`);
    return response.data;
  },

  // Application Comments
  async addComment(applicationId, content) {
    const response = await api.post(`/applications/${applicationId}/comments`, {
      content,
    });
    return response.data;
  },

  async getComments(applicationId) {
    const response = await api.get(`/applications/${applicationId}/comments`);
    return response.data;
  },

  async getComment(commentId) {
    const response = await api.get(`/applications/comments/${commentId}`);
    return response.data;
  },

  async updateComment(commentId, content) {
    const response = await api.patch(`/applications/comments/${commentId}`, {
      content,
    });
    return response.data;
  },

  async deleteComment(commentId) {
    const response = await api.delete(`/applications/comments/${commentId}`);
    return response.data;
  },

  // Saved Jobs
  async saveJob(vacancyId) {
    const response = await api.post("/applications/saved-jobs", { vacancyId });
    return response.data;
  },

  async getSavedJobs() {
    const response = await api.get("/applications/saved-jobs");
    return response.data;
  },

  async unsaveJob(id) {
    const response = await api.delete(`/applications/saved-jobs/${id}`);
    return response.data;
  },

  // Company Follows
  async followCompany(companyId) {
    const response = await api.post("/applications/follows", { companyId });
    return response.data;
  },

  async getFollowedCompanies() {
    const response = await api.get("/applications/follows");
    return response.data;
  },

  async unfollowCompany(id) {
    const response = await api.delete(`/applications/follows/${id}`);
    return response.data;
  },
};
