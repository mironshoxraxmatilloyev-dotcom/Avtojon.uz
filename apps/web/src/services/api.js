import axios from 'axios'

// API base URL ni aniqlash
const getBaseURL = () => {
  const apiUrl = import.meta.env.VITE_API_URL
  
  // Agar VITE_API_URL berilgan bo'lsa
  if (apiUrl) {
    // Agar URL allaqachon /api bilan tugasa, qayta qo'shmaslik
    return apiUrl.endsWith('/api') ? apiUrl : apiUrl + '/api'
  }
  
  // Localhost - Vite proxy orqali
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
