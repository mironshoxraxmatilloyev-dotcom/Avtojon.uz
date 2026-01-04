import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API URL - production (avtojon.uz/api - subdomain emas!)
const API_URL = 'https://avtojon.uz/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Retry konfiguratsiyasi
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

// Request interceptor - token qo'shish
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Token olishda xatolik:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - xatoliklarni qayta ishlash va retry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    
    // 401 - token yaroqsiz
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['token', 'user', 'refreshToken']);
      return Promise.reject(error);
    }
    
    // Network xatoliklari uchun retry
    if (!error.response && config && !config._retry) {
      config._retryCount = config._retryCount || 0;
      
      if (config._retryCount < MAX_RETRIES) {
        config._retryCount++;
        config._retry = true;
        
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * config._retryCount));
        return api(config);
      }
    }
    
    // 5xx server xatoliklari uchun retry
    if (error.response?.status >= 500 && config && !config._retry) {
      config._retryCount = config._retryCount || 0;
      
      if (config._retryCount < MAX_RETRIES) {
        config._retryCount++;
        config._retry = true;
        
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * config._retryCount));
        return api(config);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
