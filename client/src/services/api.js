import axios from 'axios';
import { signOut } from '@firebase/auth';
import { firebaseAuth } from './firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const firebaseUser = firebaseAuth?.currentUser;

  if (firebaseUser) {
    const idToken = await firebaseUser.getIdToken();
    config.headers.Authorization = `Bearer ${idToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && firebaseAuth?.currentUser) {
      await signOut(firebaseAuth).catch(() => {});
    }

    return Promise.reject(error);
  },
);

export default api;
