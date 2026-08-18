import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    console.log(`[API Request]: ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
    const token = localStorage.getItem('lending_admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('[API Request Error]:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle Token Expiration
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response ${response.status}]:`, response.config.url, response.data);
    return response.data;
  },
  (error) => {
    console.error('[API Response Error]:', error.config?.url, 'Status:', error.response?.status, 'Data/Error:', error.response?.data || error.message);
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('lending_admin_token');
      localStorage.removeItem('lending_admin_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data || { message: error.message });
  }
);

export default api;
