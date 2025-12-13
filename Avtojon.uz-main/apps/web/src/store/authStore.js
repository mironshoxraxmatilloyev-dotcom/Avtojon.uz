import { create } from 'zustand'
import api from '../services/api'

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  loading: false,

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
