import { create } from 'zustand'
import api, { getErrorMessage } from '../services/api'
import { storage, saveAuthData, clearAuthData, loadAuthData } from '../utils/storage'
import { preventAutoSignIn } from '../utils/credentials'

export const useAuthStore = create((set, get) => ({
  // ❌ localStorage dan olmaymiz - native da ishlamaydi
  // ✅ initAuth() orqali Capacitor Preferences dan yuklanadi
  user: null,
  token: null,
  refreshToken: null,
  loading: false,
  error: null,
  initialized: false,

  // App boshlanganda storage dan yuklash - MUHIM!
  initAuth: async () => {
    try {
      console.log('[Auth] Initializing from persistent storage...')
      const { token, refreshToken, user } = await loadAuthData()
      console.log('[Auth] Loaded:', { hasToken: !!token, hasUser: !!user })
      
      if (token && user) {
        // Token va user bor - API header ni ham set qilish
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }
      
      set({ 
        token, 
        refreshToken, 
        user, 
        initialized: true 
      })
      return { token, user }
    } catch (e) {
      console.error('[Auth] Init error:', e)
      set({ initialized: true })
      return { token: null, user: null }
    }
  },

  // Demo rejimda ekanligini tekshirish
  isDemo: () => {
    const user = get().user
    return user?.username === 'demo'
  },

  // Clear error
  clearError: () => set({ error: null }),

  login: async (username, password) => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.post('/auth/login', { username, password })
      
      if (!data.data?.accessToken || !data.data?.user) {
        if (!data.data?.token || !data.data?.user) {
          throw new Error('Server javobida xatolik')
        }
      }
      
      const accessToken = data.data.accessToken || data.data.token
      const refreshToken = data.data.refreshToken
      
      // Capacitor storage ga saqlash
      await saveAuthData(accessToken, data.data.user, refreshToken)
      
      set({ 
        user: data.data.user, 
        token: accessToken,
        refreshToken: refreshToken || null,
        loading: false,
        error: null 
      })
      return { 
        success: true, 
        role: data.data.user.role,
        user: data.data.user 
      }
    } catch (error) {
      const errorMessage = error.userMessage || getErrorMessage(error) || 'Kirish xatosi'
      set({ loading: false, error: errorMessage })
      return { 
        success: false, 
        message: errorMessage,
        isNetworkError: error.isNetworkError,
        isAuthError: error.isAuthError
      }
    }
  },

  // Demo login uchun - token va user to'g'ridan-to'g'ri set qilish
  setAuth: async (token, user, refreshToken = null) => {
    if (!token || !user) {
      console.error('setAuth: token yoki user yo\'q')
      return
    }
    await saveAuthData(token, user, refreshToken)
    set({ user, token, refreshToken, error: null })
  },

  register: async ({ fullName, password, phone }) => {
    set({ loading: true, error: null })
    
    if (!fullName?.trim()) {
      set({ loading: false, error: 'Ismingizni kiriting' })
      return { success: false, message: 'Ismingizni kiriting' }
    }
    if (!password || password.length < 6) {
      set({ loading: false, error: 'Parol kamida 6 ta belgi' })
      return { success: false, message: 'Parol kamida 6 ta belgi bo\'lishi kerak' }
    }
    
    try {
      const { data } = await api.post('/auth/register', { 
        fullName: fullName.trim(), 
        password, 
        phone: phone || ''
      })
      
      if (!data.data?.accessToken || !data.data?.user) {
        if (!data.data?.token || !data.data?.user) {
          throw new Error('Server javobida xatolik')
        }
      }
      
      const accessToken = data.data.accessToken || data.data.token
      const refreshToken = data.data.refreshToken
      
      // Capacitor storage ga saqlash
      await saveAuthData(accessToken, data.data.user, refreshToken)
      
      set({ 
        user: data.data.user, 
        token: accessToken,
        refreshToken: refreshToken || null,
        loading: false,
        error: null 
      })
      return { success: true, user: data.data.user }
    } catch (error) {
      const errorMessage = error.userMessage || getErrorMessage(error) || 'Ro\'yxatdan o\'tishda xatolik'
      set({ loading: false, error: errorMessage })
      return { 
        success: false, 
        message: errorMessage,
        isNetworkError: error.isNetworkError
      }
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout')
    } catch (e) {
      // Xato bo'lsa ham davom etamiz
    }
    
    // Capacitor storage dan o'chirish
    await clearAuthData()
    
    // Credential API - avtomatik login ni to'xtatish
    await preventAutoSignIn()
    
    // Auth cache ni tozalash
    if (typeof window !== 'undefined' && window.__clearAuthCache) {
      window.__clearAuthCache()
    }
    
    set({ user: null, token: null, refreshToken: null, error: null })
  },

  // Update user data
  updateUser: async (userData) => {
    const currentUser = get().user
    const updatedUser = { ...currentUser, ...userData }
    await storage.set('user', JSON.stringify(updatedUser))
    set({ user: updatedUser })
  }
}))
