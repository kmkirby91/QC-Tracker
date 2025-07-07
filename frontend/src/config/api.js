import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.response?.data);
    
    // Handle common error scenarios
    if (error.response?.status === 403) {
      console.error('Access forbidden - check CORS configuration');
    } else if (error.response?.status === 404) {
      console.error('API endpoint not found');
    } else if (error.code === 'NETWORK_ERROR') {
      console.error('Network error - check if backend is running');
    }
    
    return Promise.reject(error);
  }
);

export default api;