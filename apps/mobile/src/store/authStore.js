import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  loading: false,
  isAuthenticated: false,

  loadToken: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      if (token && userStr) {
        const user = JSON.parse(userStr);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        set({ token, user, isAuthenticated: true });
        return true;
      }
      return false;
    } catch (e) {
      console.error('Token yuklashda xatolik:', e);
      // Xatolik bo'lsa storage ni tozalash
      await AsyncStorage.multiRemove(['token', 'user', 'refreshToken']);
      return false;
    }
  },

  login: async (username, password) => {
    set({ loading: true });
    try {
      console.log('🔐 Login so\'rov:', { username, url: api.defaults.baseURL + '/auth/login' });
      const { data } = await api.post('/auth/login', { username, password });
      console.log('✅ Login javob:', JSON.stringify(data));
      // API javob strukturasi: { success, data: { user, accessToken, refreshToken } }
      const responseData = data.data || data;
      const token = responseData.accessToken || responseData.token; // accessToken yoki token
      const user = responseData.user;

      console.log('🔑 Token:', token ? 'bor' : 'yo\'q');
      if (data.success && token) {
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        if (responseData.refreshToken) {
          await AsyncStorage.setItem('refreshToken', responseData.refreshToken);
        }
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        set({
          token,
          user,
          isAuthenticated: true,
          loading: false
        });
        return { success: true, user, role: user?.role };
      }
      set({ loading: false });
      return { success: false, message: data.message || 'Login xatosi' };
    } catch (e) {
      console.error('❌ Login xato:', e.message, e.code, e.response?.status, e.response?.data);
      set({ loading: false });
      const errorMessage = e.response?.data?.message ||
        (e.code === 'ECONNABORTED' ? 'Server javob bermayapti' :
          e.code === 'ERR_NETWORK' ? 'Internet aloqasi yo\'q' : 'Server xatosi');
      return {
        success: false,
        message: errorMessage
      };
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'user', 'refreshToken']);
      delete api.defaults.headers.common['Authorization'];
    } catch (e) {
      console.error('Logout xatolik:', e);
    }
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
