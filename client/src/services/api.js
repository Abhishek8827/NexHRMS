import axios from 'axios';
import { store } from '../app/store';
import { logout, setAccessToken } from '../features/auth/authSlice';

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token =
    store.getState().auth.accessToken ||
    localStorage.getItem('nexhr_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Handle expired tokens
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');

        const res = await axios.post(
          `${BASE_URL}/auth/refresh-token`,
          {
            refreshToken,
          }
        );

        const newToken = res.data.data.accessToken;

        store.dispatch(setAccessToken(newToken));

        localStorage.setItem('nexhr_token', newToken);

        originalRequest.headers.Authorization =
          `Bearer ${newToken}`;

        return api(originalRequest);

      } catch (err) {
        store.dispatch(logout());

        localStorage.removeItem('nexhr_token');
        localStorage.removeItem('refresh_token');

        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;