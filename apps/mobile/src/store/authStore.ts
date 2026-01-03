import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export type UserRole = 'super_admin' | 'admin' | 'business' | 'driver';

interface Subscription {
  plan: 'trial' | 'pro';
  startDate?: string;
  endDate?: string;
  isExpired: boolean;
  daysLeft?: number;
}

interface User {
  id: string;
  username: string;
  fullName?: string;
  role: UserRole;
  businessmanId?: string;
  userId?: string; // driver uchun
  subscription?: Subscription;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  checkAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({ token, user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  login: async (username: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { 
        username: username.trim(), 
        password 
      });
      
      if (response.data.success) {
        const { accessToken, user } = response.data.data;
        
        await AsyncStorage.setItem('token', accessToken);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        
        set({ token: accessToken, user, isAuthenticated: true });
        return { success: true };
      }
      return { success: false, message: response.data.message || 'Kirish xatosi' };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Server bilan bog\'lanishda xatolik';
      return { success: false, message };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout errors
    }
    await AsyncStorage.multiRemove(['token', 'user']);
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
