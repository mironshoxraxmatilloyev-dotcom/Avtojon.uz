import { Preferences } from '@capacitor/preferences'
import { Capacitor } from '@capacitor/core'

// Capacitor native platformada ishlayaptimi?
const isNative = Capacitor.isNativePlatform()

// Storage utility - Capacitor va Web uchun universal
export const storage = {
  async get(key) {
    try {
      if (isNative) {
        const { value } = await Preferences.get({ key })
        return value
      }
      return localStorage.getItem(key)
    } catch (e) {
      console.error('Storage get error:', e)
      return localStorage.getItem(key)
    }
  },

  async set(key, value) {
    try {
      if (isNative) {
        await Preferences.set({ key, value: value || '' })
      }
      localStorage.setItem(key, value || '')
    } catch (e) {
      console.error('Storage set error:', e)
      localStorage.setItem(key, value || '')
    }
  },

  async remove(key) {
    try {
      if (isNative) {
        await Preferences.remove({ key })
      }
      localStorage.removeItem(key)
    } catch (e) {
      console.error('Storage remove error:', e)
      localStorage.removeItem(key)
    }
  },

  // Sync versiyalar - initial state uchun
  getSync(key) {
    return localStorage.getItem(key)
  }
}

// Auth ma'lumotlarini yuklash
export async function loadAuthData() {
  const [token, refreshToken, userStr] = await Promise.all([
    storage.get('token'),
    storage.get('refreshToken'),
    storage.get('user')
  ])
  
  let user = null
  if (userStr) {
    try {
      user = JSON.parse(userStr)
    } catch (e) {
      console.error('User parse error:', e)
    }
  }
  
  return { token, refreshToken, user }
}

// Auth ma'lumotlarini saqlash
export async function saveAuthData(token, user, refreshToken = null) {
  await Promise.all([
    storage.set('token', token),
    storage.set('user', JSON.stringify(user)),
    refreshToken ? storage.set('refreshToken', refreshToken) : Promise.resolve()
  ])
}

// Auth ma'lumotlarini o'chirish
export async function clearAuthData() {
  await Promise.all([
    storage.remove('token'),
    storage.remove('refreshToken'),
    storage.remove('user')
  ])
}
