import axios from 'axios';

const getBaseURL = () => {
  // Vite environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Local development
  if (
    typeof window !== 'undefined' &&
    (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    )
  ) {
    return 'http://localhost:5001/api';
  }

  // Production
  return 'https://payment-management-d0yn.onrender.com/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    console.log(
      `[API Request]: ${config.method?.toUpperCase()} ${config.url}`,
      config.data || ''
    );

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

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    console.log(
      `[API Response ${response.status}]:`,
      response.config.url,
      response.data
    );

    return response.data;
  },
  (error) => {
    console.error(
      '[API Response Error]:',
      error.config?.url,
      'Status:',
      error.response?.status,
      'Data/Error:',
      error.response?.data || error.message
    );

    if (error.response?.status === 401) {
      localStorage.removeItem('lending_admin_token');
      localStorage.removeItem('lending_admin_user');

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(
      error.response?.data || { message: error.message }
    );
  }
);

export default api;