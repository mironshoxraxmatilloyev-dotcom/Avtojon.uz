import { create } from 'zustand'
import api from '../services/api'

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  loading: false,

  // Demo rejimda ekanligini tekshirish
  isDemo: () => {
    const user = get().user
    return user?.username === 'demo'
  },

  login: async (username, password) => {
    set({ loading: true })
    try {
      const { data } = await api.post('/auth/login', { username, password })
      localStorage.setItem('token', data.data.token)
      localStorage.setItem('user', JSON.stringify(data.data.user))
      set({ user: data.data.user, token: data.data.token, loading: false })
      return { success: true, role: data.data.user.role }
    } catch (error) {
      set({ loading: false })
      return { success: false, message: error.response?.data?.message || 'Xatolik yuz berdi' }
    }
  },

  // Demo login uchun - token va user to'g'ridan-to'g'ri set qilish
  setAuth: (token, user) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ user, token })
  },

  register: async ({ username, password, fullName, companyName, phone }) => {
    set({ loading: true })
    try {
      const { data } = await api.post('/auth/register', { 
        username, 
        password, 
        fullName, 
        companyName, 
        phone 
      })
      localStorage.setItem('token', data.data.token)
      localStorage.setItem('user', JSON.stringify(data.data.user))
      set({ user: data.data.user, token: data.data.token, loading: false })
      return { success: true }
    } catch (error) {
      set({ loading: false })
      return { success: false, message: error.response?.data?.message || 'Xatolik yuz berdi' }
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null })
  }
}))
