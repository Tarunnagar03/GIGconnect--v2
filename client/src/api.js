// client/src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Vite proxy will handle this
  timeout: 15000, // 15-second timeout to prevent hanging requests and memory leaks
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Global Response Interceptor for handling expired tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isUnauthorized = error.response && error.response.status === 401;
    const isSuspended = error.response && error.response.status === 403 && error.response.data?.msg?.includes('suspended');
    
    if (isUnauthorized || isSuspended) {
      console.warn("Session expired, unauthorized, or suspended. Redirecting to login.");
      if (window.location.pathname !== '/') {
        window.location.href = '/'; // Direct user to the HomePage for login
      }
    }
    return Promise.reject(error);
  }
);

export default api;