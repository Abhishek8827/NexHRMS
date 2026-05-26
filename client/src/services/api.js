// import axios from 'axios';
// import { store } from '../app/store';
// import { logout, setAccessToken } from '../features/auth/authSlice';

// const api = axios.create({
// //   baseURL: '/api/v1',
// baseURL: 'http://localhost:5000/api/v1',
//   withCredentials: true,
// });

// // Attach token to every request
// api.interceptors.request.use((config) => {
//   const token = store.getState().auth.accessToken;
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// // Auto refresh token if expired
// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     if (error.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;
//       try {
//         // const res = await axios.post('/api/v1/auth/refresh-token', {}, { withCredentials: true });
//         const res = await axios.post('http://localhost:5000/api/v1/auth/refresh-token', {}, { withCredentials: true });
//         const newToken = res.data.data.accessToken;
//         store.dispatch(setAccessToken(newToken));
//         originalRequest.headers.Authorization = `Bearer ${newToken}`;
//         return api(originalRequest);
//       } catch {
//         store.dispatch(logout());
//         window.location.href = '/login';
//       }
//     }
//     return Promise.reject(error);
//   }
// );

// export default api;



// new 
import axios from 'axios';
import { store } from '../app/store';
import { logout, setAccessToken } from '../features/auth/authSlice';

// const BASE_URL = 'http://localhost:5000/api/v1';
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken
    || localStorage.getItem('nexhr_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(
          `${BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        const newToken = res.data.data.accessToken;
        store.dispatch(setAccessToken(newToken));
        localStorage.setItem('nexhr_token', newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        store.dispatch(logout());
        localStorage.removeItem('nexhr_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;