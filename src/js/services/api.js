// HTTP Client Configuration with Axios
import axios from 'axios';
import { config } from '@core/config';
import { store } from '@core/store';
import { storage } from '@utils/storage';

// Create axios instance
const apiClient = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = store.get('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = store.get('refreshToken');
        
        if (!refreshToken) {
          // No refresh token, redirect to login
          store.clearAuth();
          storage.clearTokens();
          window.location.hash = '#/login';
          return Promise.reject(error);
        }

        // Attempt to refresh token
        const response = await axios.post(`${config.API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        // Update store with new tokens
        store.set('accessToken', accessToken);
        store.set('refreshToken', newRefreshToken);
        storage.setTokens({ accessToken, refreshToken: newRefreshToken });

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        store.clearAuth();
        storage.clearTokens();
        window.location.hash = '#/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 403:
          store.addToast({
            type: 'error',
            message: 'No tienes permisos para realizar esta acción',
          });
          break;
        case 404:
          store.addToast({
            type: 'error',
            message: 'Recurso no encontrado',
          });
          break;
        case 409:
          store.addToast({
            type: 'error',
            message: data?.message || 'Conflicto con el recurso',
          });
          break;
        case 500:
          store.addToast({
            type: 'error',
            message: 'Error del servidor. Inténtalo más tarde',
          });
          break;
        default:
          store.addToast({
            type: 'error',
            message: data?.message || 'Error inesperado',
          });
      }
    } else if (error.request) {
      store.addToast({
        type: 'error',
        message: 'Error de conexión. Verifica tu conexión a internet',
      });
    }

    return Promise.reject(error);
  }
);

// Helper methods for common operations
export const api = {
  // GET request
  get: async (url, params = {}) => {
    const response = await apiClient.get(url, { params });
    return response.data;
  },

  // POST request
  post: async (url, data = {}) => {
    const response = await apiClient.post(url, data);
    return response.data;
  },

  // PATCH request
  patch: async (url, data = {}) => {
    const response = await apiClient.patch(url, data);
    return response.data;
  },

  // PUT request
  put: async (url, data = {}) => {
    const response = await apiClient.put(url, data);
    return response.data;
  },

  // DELETE request
  delete: async (url) => {
    const response = await apiClient.delete(url);
    return response.data;
  },

  // File upload (multipart/form-data)
  upload: async (url, formData, onProgress = null) => {
    const response = await apiClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress,
    });
    return response.data;
  },

  // Download file
  download: async (url, filename) => {
    const response = await apiClient.get(url, {
      responseType: 'blob',
    });
    
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },
};

export default apiClient;
