import axios from 'axios'

// Telefonda proxy ishlamaydi, shuning uchun to'g'ridan-to'g'ri API URL ishlatamiz
const getBaseURL = () => {
  // Agar VITE_API_URL berilgan bo'lsa va localhost emas bo'lsa
  if (import.meta.env.VITE_API_URL && !window.location.hostname.includes('localhost')) {
    return import.meta.env.VITE_API_URL + '/api'
  }
  // Localhost da proxy orqali
  return '/api'
}

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json'
  }
})

// Token qo'shish
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
