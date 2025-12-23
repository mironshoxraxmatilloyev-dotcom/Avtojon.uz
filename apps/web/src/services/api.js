import axios from 'axios'

// 🚀 API base URL
const getBaseURL = () => {
  const apiUrl = import.meta.env.VITE_API_URL
  
  // Agar VITE_API_URL berilmagan yoki bo'sh bo'lsa - proxy ishlatish
  if (!apiUrl || apiUrl === '/api') {
    return '/api'
  }
  
  // To'liq URL berilgan bo'lsa - /api bilan tugasa shu holda qaytarish
  if (apiUrl.startsWith('http')) {
    // Agar allaqachon /api bilan tugasa, qayta qo'shmaslik
    return apiUrl.endsWith('/api') ? apiUrl : apiUrl + '/api'
  }
  
  return apiUrl
}

// 🎯 Error messages - O'zbek tilida
const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: 'Internet aloqasi yo\'q. Iltimos, tarmoqni tekshiring.',
  TIMEOUT: 'Server javob bermayapti. Iltimos, keyinroq urinib ko\'ring.',
  SERVER_ERROR: 'Serverda xatolik yuz berdi. Iltimos, keyinroq urinib ko\'ring.',
  
  // Auth errors
  UNAUTHORIZED: 'Sessiya tugadi. Iltimos, qaytadan kiring.',
  FORBIDDEN: 'Bu amalni bajarishga ruxsat yo\'q.',
  
  // Validation errors
  BAD_REQUEST: 'Noto\'g\'ri so\'rov. Ma\'lumotlarni tekshiring.',
  NOT_FOUND: 'Ma\'lumot topilmadi.',
  CONFLICT: 'Bu ma\'lumot allaqachon mavjud.',
  
  // Rate limiting
  TOO_MANY_REQUESTS: 'Juda ko\'p so\'rov. Biroz kuting.',
  
  // Default
  UNKNOWN: 'Noma\'lum xatolik yuz berdi.'
}

// 🎯 Get user-friendly error message
const getErrorMessage = (error) => {
  // Network error (no response)
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return ERROR_MESSAGES.TIMEOUT
    }
    // ERR_ADDRESS_UNREACHABLE - server mavjud emas
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      return 'Server bilan aloqa yo\'q. Backend ishga tushirilganligini tekshiring.'
    }
    return ERROR_MESSAGES.SERVER_ERROR
  }

  const status = error.response.status
  const serverMessage = error.response.data?.message

  // Server provided message
  if (serverMessage && typeof serverMessage === 'string') {
    return serverMessage
  }

  // Status-based messages
  switch (status) {
    case 400:
      return ERROR_MESSAGES.BAD_REQUEST
    case 401:
      return ERROR_MESSAGES.UNAUTHORIZED
    case 403:
      return ERROR_MESSAGES.FORBIDDEN
    case 404:
      return ERROR_MESSAGES.NOT_FOUND
    case 409:
      return ERROR_MESSAGES.CONFLICT
    case 429:
      return ERROR_MESSAGES.TOO_MANY_REQUESTS
    case 500:
    case 502:
    case 503:
    case 504:
      return ERROR_MESSAGES.SERVER_ERROR
    default:
      return ERROR_MESSAGES.UNKNOWN
  }
}

// 🚀 Axios instance
const api = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000 // 30 sekund timeout - MongoDB Atlas sekin
})

// 🎯 Advanced request cache (GET uchun)
const cache = new Map()
const CACHE_TTL = 30000 // 30 sekund - uzoqroq cache
const STALE_TTL = 60000 // 1 daqiqa - stale data ham ishlatiladi
const MAX_CACHE_SIZE = 100 // Maksimal cache hajmi

// 🧹 Cache tozalash funksiyasi
const cleanupCache = () => {
  const now = Date.now()
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > STALE_TTL) {
      cache.delete(key)
    }
  }
  // Agar hali ham katta bo'lsa, eng eskilarini o'chirish
  if (cache.size > MAX_CACHE_SIZE) {
    const entries = [...cache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)
    const toDelete = entries.slice(0, cache.size - MAX_CACHE_SIZE)
    toDelete.forEach(([key]) => cache.delete(key))
  }
}

// 🎯 Retry configuration
const MAX_RETRIES = 2
const RETRY_DELAY = 1000

// 🔄 Token refresh state
let isRefreshing = false
let refreshSubscribers = []

const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback)
}

const onTokenRefreshed = (newToken) => {
  refreshSubscribers.forEach(callback => callback(newToken))
  refreshSubscribers = []
}

// 🔄 Refresh token function
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) {
    throw new Error('No refresh token')
  }
  
  const response = await axios.post(`${getBaseURL()}/auth/refresh`, { refreshToken })
  const { accessToken, refreshToken: newRefreshToken } = response.data.data
  
  localStorage.setItem('token', accessToken)
  if (newRefreshToken) {
    localStorage.setItem('refreshToken', newRefreshToken)
  }
  
  return accessToken
}

// Token qo'shish
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  // 🚀 GET request caching - SWR pattern
  if (config.method === 'get' && !config.params?.noCache) {
    const cacheKey = config.url + JSON.stringify(config.params || {})
    const cached = cache.get(cacheKey)
    
    if (cached) {
      const age = Date.now() - cached.timestamp
      
      // Fresh cache - darhol qaytarish
      if (age < CACHE_TTL) {
        config.adapter = () => Promise.resolve({
          data: cached.data,
          status: 200,
          statusText: 'OK',
          headers: { 'x-cache': 'HIT' },
          config,
          request: {}
        })
      }
      // Stale cache - darhol qaytarish, fonda yangilash
      else if (age < STALE_TTL && !config.params?.forceRefresh) {
        config._staleData = cached.data
      }
    }
  }
  
  // Retry count
  config._retryCount = config._retryCount || 0
  
  return config
})

// Response handling
api.interceptors.response.use(
  (response) => {
    // 🚀 GET response ni cache qilish
    if (response.config.method === 'get') {
      const cacheKey = response.config.url + JSON.stringify(response.config.params || {})
      cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      })
      // Vaqti-vaqti bilan cache tozalash
      if (cache.size > MAX_CACHE_SIZE / 2) {
        cleanupCache()
      }
    }
    return response
  },
  async (error) => {
    const config = error.config

    // 🎯 Retry logic for network errors
    if (
      !error.response && 
      config._retryCount < MAX_RETRIES &&
      config.method === 'get'
    ) {
      config._retryCount += 1
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * config._retryCount))
      return api(config)
    }

    // 🎯 401 - Unauthorized - Token refresh urinish
    // Login/register/me so'rovlari uchun refresh qilmaslik
    const isAuthEndpoint = config.url?.includes('/auth/login') || 
                           config.url?.includes('/auth/register') ||
                           config.url?.includes('/auth/me')
    if (error.response?.status === 401 && !config._retry && !isAuthEndpoint) {
      const refreshToken = localStorage.getItem('refreshToken')
      
      // Refresh token mavjud bo'lsa, yangilashga urinish
      if (refreshToken) {
        if (isRefreshing) {
          // Boshqa so'rov allaqachon refresh qilmoqda - kutish
          return new Promise((resolve) => {
            subscribeTokenRefresh((newToken) => {
              config.headers.Authorization = `Bearer ${newToken}`
              config._retry = true
              resolve(api(config))
            })
          })
        }
        
        isRefreshing = true
        config._retry = true
        
        try {
          const newToken = await refreshAccessToken()
          isRefreshing = false
          onTokenRefreshed(newToken)
          
          config.headers.Authorization = `Bearer ${newToken}`
          return api(config)
        } catch (refreshError) {
          isRefreshing = false
          refreshSubscribers = []
          
          // Refresh ham muvaffaqiyatsiz - logout
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          
          if (window.location.pathname.startsWith('/dashboard') || 
              window.location.pathname.startsWith('/driver')) {
            window.location.href = '/login'
          }
        }
      } else {
        // Refresh token yo'q - logout
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        
        if (window.location.pathname.startsWith('/dashboard') || 
            window.location.pathname.startsWith('/driver')) {
          window.location.href = '/login'
        }
      }
    }

    // 🎯 Enhanced error object
    const enhancedError = {
      ...error,
      userMessage: getErrorMessage(error),
      statusCode: error.response?.status || 0,
      isNetworkError: !error.response,
      isServerError: error.response?.status >= 500,
      isAuthError: error.response?.status === 401 || error.response?.status === 403
    }

    return Promise.reject(enhancedError)
  }
)

// 🎯 Cache tozalash (POST/PUT/DELETE dan keyin)
export const clearCache = () => cache.clear()

// 🎯 API health check
export const checkApiHealth = async () => {
  try {
    await api.get('/health', { timeout: 5000, params: { noCache: true } })
    return true
  } catch {
    return false
  }
}

// 🎯 Export error messages for use in components
export { ERROR_MESSAGES, getErrorMessage }

export default api
