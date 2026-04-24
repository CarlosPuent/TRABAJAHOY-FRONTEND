// HTTP Client Configuration with Axios
import axios from "axios";
import { config } from "@core/config";
import { store } from "@core/store";
import { storage } from "@utils/storage";

// Create axios instance
const apiClient = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

function shouldSkipRefreshForRequest(requestUrl = "") {
  const normalizedUrl = String(requestUrl || "").toLowerCase();
  return normalizedUrl.includes("/auth/logout");
}

function isExpectedLogoutUnauthorizedError(error, shouldSkipRefresh) {
  return shouldSkipRefresh && error?.response?.status === 401;
}

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = store.get("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor - Handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const shouldSkipRefresh = shouldSkipRefreshForRequest(originalRequest?.url);

    if (isExpectedLogoutUnauthorizedError(error, shouldSkipRefresh)) {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized - Token expired
    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !shouldSkipRefresh
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = store.get("refreshToken");

        if (!refreshToken) {
          store.clearAuth();
          storage.clearAuthSession();
          window.location.hash = "#/login";
          return Promise.reject(error);
        }

        const response = await axios.post(
          `${config.API_BASE_URL}/auth/refresh`,
          { refreshToken },
        );

        const { accessToken, refreshToken: newRefreshToken } =
          response.data.data;

        store.set("accessToken", accessToken);
        store.set("refreshToken", newRefreshToken);
        storage.setTokens({ accessToken, refreshToken: newRefreshToken });

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        store.clearAuth();
        storage.clearAuthSession();
        window.location.hash = "#/login";
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 403:
          store.addToast({ type: "error", message: "No tienes permisos" });
          break;
        case 404:
          store.addToast({ type: "error", message: "Recurso no encontrado" });
          break;
        case 409:
          store.addToast({
            type: "error",
            message: data?.message || "Conflicto",
          });
          break;
        case 500:
          store.addToast({ type: "error", message: "Error del servidor" });
          break;
        default:
          store.addToast({
            type: "error",
            message: data?.message || "Error inesperado",
          });
      }
    } else if (error.request) {
      store.addToast({ type: "error", message: "Error de conexión" });
    }

    return Promise.reject(error);
  },
);

// Helper methods
export const api = {
  get: async (url, params = {}) => {
    const response = await apiClient.get(url, { params });
    return response.data;
  },

  post: async (url, data = {}) => {
    const response = await apiClient.post(url, data);
    return response.data;
  },

  patch: async (url, data = {}) => {
    const response = await apiClient.patch(url, data);
    return response.data;
  },

  put: async (url, data = {}) => {
    const response = await apiClient.put(url, data);
    return response.data;
  },

  delete: async (url) => {
    const response = await apiClient.delete(url);
    return response.data;
  },

  // 🚀 MÉTODO UPLOAD CORREGIDO
  upload: async (url, formData, onProgress = null) => {
    try {
      const response = await apiClient.post(url, formData, {
        // SOBREESCRIBIMOS EL HEADER: Al ponerlo en undefined, Axios
        // borra el "application/json" global y deja que el navegador
        // elija el multipart/form-data correcto.
        headers: {
          "Content-Type": undefined,
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            onProgress(percentCompleted);
          }
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error en upload api.js:", error);
      throw error;
    }
  },

  download: async (url, filename) => {
    const response = await apiClient.get(url, { responseType: "blob" });
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },
};

export default apiClient;
