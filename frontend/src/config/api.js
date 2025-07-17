import axios from 'axios';

// Determine the correct API base URL
const getApiBaseUrl = () => {
  // Check if we have a custom API URL from environment
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // For development and production, determine based on current domain
  const hostname = window.location.hostname;
  
  if (hostname === 'qctracker.a-naviq.com') {
    return 'https://qctracker.a-naviq.com/api';
  } else if (hostname === '192.168.1.182' || hostname === 'localhost') {
    // When running through Vite dev server, use the proxy
    return '/api';
  }
  
  // Default fallback to proxy for development
  return '/api';
};

// Create axios instance with base configuration
const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
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
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      url: error.config?.url,
      baseURL: error.config?.baseURL
    });
    
    return Promise.reject(error);
  }
);

export default api;