// Company Service - Frontend
import { api } from "@services/api";

export const companyService = {
  /* =========================
      Public
  ========================= */

  async getCompanies(params = {}) {
    const response = await api.get("/companies", { params });
    return response.data?.data || response.data;
  },

  async getCompanyById(id) {
    const response = await api.get(`/companies/${id}`);
    return response.data?.data || response.data;
  },

  /* =========================
      Company CRUD
  ========================= */

  async createCompany(data) {
    const response = await api.post("/companies", data);
    return response.data?.data || response.data;
  },

  async updateCompany(id, data) {
    const response = await api.patch(`/companies/${id}`, data);
    return response.data?.data || response.data;
  },

  async deleteCompany(id) {
    const response = await api.delete(`/companies/${id}`);
    return response.data?.data || response.data;
  },

  /* =========================
      Locations
  ========================= */

  async addLocation(companyId, data) {
    const response = await api.post(`/companies/${companyId}/locations`, data);
    return response.data?.data || response.data;
  },

  async getLocations(companyId) {
    const response = await api.get(`/companies/${companyId}/locations`);
    return response.data?.data || response.data;
  },

  async updateLocation(companyId, locId, data) {
    const response = await api.patch(
      `/companies/${companyId}/locations/${locId}`,
      data,
    );
    return response.data?.data || response.data;
  },

  async deleteLocation(companyId, locId) {
    const response = await api.delete(
      `/companies/${companyId}/locations/${locId}`,
    );
    return response.data?.data || response.data;
  },

  /* =========================
      Benefits
  ========================= */

  async addBenefit(companyId, data) {
    const response = await api.post(`/companies/${companyId}/benefits`, data);
    return response.data?.data || response.data;
  },

  async getBenefits(companyId) {
    const response = await api.get(`/companies/${companyId}/benefits`);
    return response.data?.data || response.data;
  },

  async updateBenefit(companyId, benId, data) {
    const response = await api.patch(
      `/companies/${companyId}/benefits/${benId}`,
      data,
    );
    return response.data?.data || response.data;
  },

  async deleteBenefit(companyId, benId) {
    const response = await api.delete(
      `/companies/${companyId}/benefits/${benId}`,
    );
    return response.data?.data || response.data;
  },

  /* =========================
      Members
  ========================= */

  async addMemberByEmail(companyId, payload) {
    const response = await api.post(
      `/companies/${companyId}/members/by-email`,
      payload,
    );
    return response.data?.data || response.data;
  },

  async addMember(companyId, data) {
    const response = await api.post(`/companies/${companyId}/members`, data);
    return response.data?.data || response.data;
  },

  async getDashboard(companyId) {
    const response = await api.get(`/companies/${companyId}/dashboard`);
    return response.data?.data || response.data;
  },

  /* =========================
   DASHBOARD EXTRA
  ========================= */

  async getApplicationsByStatus(companyId) {
    const response = await api.get(
      `/companies/${companyId}/dashboard/applications-by-status`,
    );
    return response.data?.data || response.data;
  },

  async getRecentApplications(companyId) {
    const response = await api.get(
      `/companies/${companyId}/dashboard/recent-applications`,
    );
    return response.data?.data || response.data;
  },

  async getMembers(companyId) {
    const response = await api.get(`/companies/${companyId}/members`);
    return response.data?.data || response.data;
  },

  async updateMember(companyId, memId, data) {
    const response = await api.patch(
      `/companies/${companyId}/members/${memId}`,
      data,
    );
    return response.data?.data || response.data;
  },

  async removeMember(companyId, memId) {
    const response = await api.delete(
      `/companies/${companyId}/members/${memId}`,
    );
    return response.data?.data || response.data;
  },

  /* =========================
      Verification
  ========================= */

  async submitVerification(companyId, formData) {
    const response = await api.upload(
      `/companies/${companyId}/verification`,
      formData,
    );
    return response.data?.data || response.data;
  },

  async getVerificationStatus(companyId) {
    const response = await api.get(`/companies/${companyId}/verification`);
    return response.data?.data || response.data;
  },

  async getVerificationDocuments(companyId) {
    const response = await api.get(
      `/companies/${companyId}/verification/documents`,
    );
    return response.data?.data || response.data;
  },

  /* =========================
      Admin
  ========================= */

  async reviewVerification(companyId, submissionId, data) {
    const response = await api.post(
      `/companies/${companyId}/verification/submissions/${submissionId}/review`,
      data,
    );
    return response.data?.data || response.data;
  },
};
