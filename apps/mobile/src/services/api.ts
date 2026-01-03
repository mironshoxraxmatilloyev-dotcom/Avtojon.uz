import axios from 'axios';

// Production URL - o'zgartiring
const API_URL = 'https://avtojon.uz/api';
// Development URL
// const API_URL = 'http://192.168.1.100:3000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`📥 ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ API Error:`, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
