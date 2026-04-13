// Authentication Service
import { api } from '@services/api';
import { store } from '@core/store';
import { storage } from '@utils/storage';

export const authService = {
  /**
   * Register a new candidate
   * @param {Object} data - { email, password, firstName, lastName }
   */
  async registerCandidate(data) {
    const response = await api.post('/auth/register', data);
    
    // Store tokens and user data
    const { accessToken, refreshToken, user } = response.data;
    store.setAuth({ accessToken, refreshToken }, user);
    storage.setTokens({ accessToken, refreshToken });
    storage.setUser(user);
    storage.setRoles(user.roles || ['candidate']);
    
    // Update store roles
    store.set('roles', user.roles || ['candidate']);
    
    return response.data;
  },

  /**
   * Login user
   * @param {Object} credentials - { email, password }
   */
  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    
    // Store tokens and user data
    const { accessToken, refreshToken, user } = response.data;
    store.setAuth({ accessToken, refreshToken }, user);
    storage.setTokens({ accessToken, refreshToken });
    storage.setUser(user);
    storage.setRoles(user.roles || []);
    
    // Update store roles
    store.set('roles', user.roles || []);
    
    return response.data;
  },

  /**
   * Refresh access token
   * @param {string} refreshToken
   */
  async refreshToken(refreshToken) {
    const response = await api.post('/auth/refresh', { refreshToken });
    const { accessToken, refreshToken: newRefreshToken } = response.data;
    
    // Update store and storage
    store.set('accessToken', accessToken);
    store.set('refreshToken', newRefreshToken);
    storage.setTokens({ accessToken, refreshToken: newRefreshToken });
    
    return response.data;
  },

  /**
   * Get current user profile
   */
  async getCurrentUser() {
    const response = await api.get('/auth/me');
    const { user, roles } = response.data;
    
    // Update store
    store.set('user', user);
    store.set('roles', roles || user.roles || []);
    storage.setUser(user);
    storage.setRoles(roles || user.roles || []);
    
    return response.data;
  },

  /**
   * Logout user
   */
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all auth data
      store.clearAuth();
      storage.clearAll();
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return store.get('isAuthenticated');
  },

  /**
   * Get current user
   */
  getCurrentUser() {
    return store.get('user');
  },

  /**
   * Get user roles
   */
  getUserRoles() {
    return store.get('roles');
  },

  /**
   * Check if user has specific role
   */
  hasRole(roleName) {
    const roles = store.get('roles');
    return roles && roles.includes(roleName);
  },
};
