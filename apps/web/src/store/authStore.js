import { create } from 'zustand'
import api, { getErrorMessage } from '../services/api'

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  loading: false,
  error: null,

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
      
      if (!data.data?.token || !data.data?.user) {
        throw new Error('Server javobida xatolik')
      }
      
      localStorage.setItem('token', data.data.token)
      localStorage.setItem('user', JSON.stringify(data.data.user))
      set({ 
        user: data.data.user, 
        token: data.data.token, 
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
  setAuth: (token, user) => {
    if (!token || !user) {
      console.error('setAuth: token yoki user yo\'q')
      return
    }
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ user, token, error: null })
  },

  register: async ({ username, password, fullName, companyName, phone }) => {
    set({ loading: true, error: null })
    
    // Client-side validation
    if (!username?.trim()) {
      set({ loading: false, error: 'Username majburiy' })
      return { success: false, message: 'Username majburiy' }
    }
    if (!password || password.length < 6) {
      set({ loading: false, error: 'Parol kamida 6 ta belgi' })
      return { success: false, message: 'Parol kamida 6 ta belgi bo\'lishi kerak' }
    }
    if (!fullName?.trim()) {
      set({ loading: false, error: 'To\'liq ism majburiy' })
      return { success: false, message: 'To\'liq ism majburiy' }
    }
    
    try {
      const { data } = await api.post('/auth/register', { 
        username: username.trim(), 
        password, 
        fullName: fullName.trim(), 
        companyName: companyName?.trim() || '', 
        phone: phone || ''
      })
      
      if (!data.data?.token || !data.data?.user) {
        throw new Error('Server javobida xatolik')
      }
      
      localStorage.setItem('token', data.data.token)
      localStorage.setItem('user', JSON.stringify(data.data.user))
      set({ 
        user: data.data.user, 
        token: data.data.token, 
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

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null, error: null })
  },

  // Update user data
  updateUser: (userData) => {
    const currentUser = get().user
    const updatedUser = { ...currentUser, ...userData }
    localStorage.setItem('user', JSON.stringify(updatedUser))
    set({ user: updatedUser })
  }
}))
