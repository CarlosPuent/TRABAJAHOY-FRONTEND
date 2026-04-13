// Candidate Profile Service
import { api } from '@services/api';

export const candidateService = {
  // Main Profile
  async createProfile(data) {
    const response = await api.post('/candidate/profile', data);
    return response.data;
  },

  async getProfileById(id) {
    const response = await api.get(`/candidate/profile/${id}`);
    return response.data;
  },

  async updateProfile(id, data) {
    const response = await api.patch(`/candidate/profile/${id}`, data);
    return response.data;
  },

  async deleteProfile(id) {
    const response = await api.delete(`/candidate/profile/${id}`);
    return response.data;
  },

  // Experiences
  async getExperiences(profileId) {
    const response = await api.get(`/candidate/profile/${profileId}/experiences`);
    return response.data;
  },

  async addExperience(candidateId, data) {
    const response = await api.post(`/candidate/profile/${candidateId}/experiences`, data);
    return response.data;
  },

  async getExperience(id) {
    const response = await api.get(`/candidate/profile/experiences/${id}`);
    return response.data;
  },

  async updateExperience(id, data) {
    const response = await api.patch(`/candidate/profile/experiences/${id}`, data);
    return response.data;
  },

  async deleteExperience(id) {
    const response = await api.delete(`/candidate/profile/experiences/${id}`);
    return response.data;
  },

  // Education
  async getEducation(profileId) {
    const response = await api.get(`/candidate/profile/${profileId}/education`);
    return response.data;
  },

  async addEducation(candidateId, data) {
    const response = await api.post(`/candidate/profile/${candidateId}/education`, data);
    return response.data;
  },

  async getEducationItem(id) {
    const response = await api.get(`/candidate/profile/education/${id}`);
    return response.data;
  },

  async updateEducationItem(id, data) {
    const response = await api.patch(`/candidate/profile/education/${id}`, data);
    return response.data;
  },

  async deleteEducationItem(id) {
    const response = await api.delete(`/candidate/profile/education/${id}`);
    return response.data;
  },

  // Skills
  async getSkills(profileId) {
    const response = await api.get(`/candidate/profile/${profileId}/skills`);
    return response.data;
  },

  async addSkill(candidateId, data) {
    const response = await api.post(`/candidate/profile/${candidateId}/skills`, data);
    return response.data;
  },

  async getSkill(id) {
    const response = await api.get(`/candidate/profile/skills/${id}`);
    return response.data;
  },

  async updateSkill(id, data) {
    const response = await api.patch(`/candidate/profile/skills/${id}`, data);
    return response.data;
  },

  async deleteSkill(id) {
    const response = await api.delete(`/candidate/profile/skills/${id}`);
    return response.data;
  },

  // Languages
  async getLanguages(profileId) {
    const response = await api.get(`/candidate/profile/${profileId}/languages`);
    return response.data;
  },

  async addLanguage(candidateId, data) {
    const response = await api.post(`/candidate/profile/${candidateId}/languages`, data);
    return response.data;
  },

  async getLanguage(id) {
    const response = await api.get(`/candidate/profile/languages/${id}`);
    return response.data;
  },

  async updateLanguage(id, data) {
    const response = await api.patch(`/candidate/profile/languages/${id}`, data);
    return response.data;
  },

  async deleteLanguage(id) {
    const response = await api.delete(`/candidate/profile/languages/${id}`);
    return response.data;
  },

  // CV Files
  async getCVs(profileId) {
    const response = await api.get(`/candidate/profile/${profileId}/cv`);
    return response.data;
  },

  async uploadCV(candidateId, formData, onProgress = null) {
    const response = await api.upload(`/candidate/profile/${candidateId}/cv`, formData, onProgress);
    return response.data;
  },

  async getCV(id) {
    const response = await api.get(`/candidate/profile/cv/${id}`);
    return response.data;
  },

  async deleteCV(id) {
    const response = await api.delete(`/candidate/profile/cv/${id}`);
    return response.data;
  },

  // Interests
  async getInterests(profileId) {
    const response = await api.get(`/candidate/profile/${profileId}/interests`);
    return response.data;
  },

  async addInterest(candidateId, data) {
    const response = await api.post(`/candidate/profile/${candidateId}/interests`, data);
    return response.data;
  },

  async getInterest(id) {
    const response = await api.get(`/candidate/profile/interests/${id}`);
    return response.data;
  },

  async deleteInterest(id) {
    const response = await api.delete(`/candidate/profile/interests/${id}`);
    return response.data;
  },
};
