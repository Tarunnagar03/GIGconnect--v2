// client/src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Vite proxy will handle this
  timeout: 15000, // 15-second timeout to prevent hanging requests and memory leaks
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add the token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global Response Interceptor for handling expired tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Session expired or unauthorized. Redirecting to login.");
      localStorage.removeItem('token');
      window.location.href = '/'; // Direct user to the HomePage for login
    }
    return Promise.reject(error);
  }
);

export default api;