// Company Service
import { api } from '@services/api';

export const companyService = {
  // Public endpoints
  async getCompanies(params = {}) {
    const response = await api.get('/companies', params);
    return response.data;
  },

  async getCompanyById(id) {
    const response = await api.get(`/companies/${id}`);
    return response.data;
  },

  // Authenticated endpoints
  async createCompany(data) {
    const response = await api.post('/companies', data);
    return response.data;
  },

  async updateCompany(id, data) {
    const response = await api.patch(`/companies/${id}`, data);
    return response.data;
  },

  async deleteCompany(id) {
    const response = await api.delete(`/companies/${id}`);
    return response.data;
  },

  // Locations
  async addLocation(companyId, data) {
    const response = await api.post(`/companies/${companyId}/locations`, data);
    return response.data;
  },

  async getLocations(companyId) {
    const response = await api.get(`/companies/${companyId}/locations`);
    return response.data;
  },

  async updateLocation(companyId, locId, data) {
    const response = await api.patch(`/companies/${companyId}/locations/${locId}`, data);
    return response.data;
  },

  async deleteLocation(companyId, locId) {
    const response = await api.delete(`/companies/${companyId}/locations/${locId}`);
    return response.data;
  },

  // Benefits
  async addBenefit(companyId, data) {
    const response = await api.post(`/companies/${companyId}/benefits`, data);
    return response.data;
  },

  async getBenefits(companyId) {
    const response = await api.get(`/companies/${companyId}/benefits`);
    return response.data;
  },

  async updateBenefit(companyId, benId, data) {
    const response = await api.patch(`/companies/${companyId}/benefits/${benId}`, data);
    return response.data;
  },

  async deleteBenefit(companyId, benId) {
    const response = await api.delete(`/companies/${companyId}/benefits/${benId}`);
    return response.data;
  },

  // Members
  async addMember(companyId, data) {
    const response = await api.post(`/companies/${companyId}/members`, data);
    return response.data;
  },

  async getMembers(companyId) {
    const response = await api.get(`/companies/${companyId}/members`);
    return response.data;
  },

  async updateMember(companyId, memId, data) {
    const response = await api.patch(`/companies/${companyId}/members/${memId}`, data);
    return response.data;
  },

  async removeMember(companyId, memId) {
    const response = await api.delete(`/companies/${companyId}/members/${memId}`);
    return response.data;
  },

  // Verification
  async submitVerification(companyId, formData) {
    const response = await api.upload(`/companies/${companyId}/verification`, formData);
    return response.data;
  },

  async getVerificationStatus(companyId) {
    const response = await api.get(`/companies/${companyId}/verification`);
    return response.data;
  },

  async getVerificationDocuments(companyId) {
    const response = await api.get(`/companies/${companyId}/verification/documents`);
    return response.data;
  },

  // Admin: Review verification
  async reviewVerification(companyId, submissionId, data) {
    const response = await api.post(
      `/companies/${companyId}/verification/submissions/${submissionId}/review`,
      data
    );
    return response.data;
  },
};
