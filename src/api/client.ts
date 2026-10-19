import axios from 'axios';
import { auth } from '../config/firebase';

const rawApiUrl = (import.meta.env.VITE_API_URL || 'https://api.servfex.com/api/v1').trim();
const normalizedBaseURL = rawApiUrl.endsWith('/api/v1')
  ? rawApiUrl
  : `${rawApiUrl.replace(/\/+$/, '')}/api/v1`;

export const apiClient = axios.create({
  baseURL: normalizedBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Firebase ID token if user is authenticated
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (err) {
      console.warn('Failed to retrieve Firebase ID token for request', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiration & single retry with forced refresh (Refinement 4)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest?._retry && auth.currentUser) {
      originalRequest._retry = true;

      try {
        // Force refresh the Firebase ID token
        const newToken = await auth.currentUser.getIdToken(true);
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.warn('Firebase ID token force-refresh failed', refreshError);
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);
