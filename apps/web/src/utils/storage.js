// Capacitor native platformada ishlayaptimi?
let isNative = false
let Preferences = null

// Dynamic import - faqat native platformada yuklanadi
const initCapacitor = async () => {
  try {
    const { Capacitor } = await import('@capacitor/core')
    isNative = Capacitor.isNativePlatform()
    if (isNative) {
      const prefs = await import('@capacitor/preferences')
      Preferences = prefs.Preferences
    }
  } catch (e) {
    // Web da Capacitor yo'q - xato emas
    isNative = false
  }
}

// Init qilish
const initPromise = initCapacitor()

// Storage utility - Capacitor va Web uchun universal
export const storage = {
  async get(key) {
    await initPromise
    try {
      if (isNative && Preferences) {
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
    await initPromise
    try {
      if (isNative && Preferences) {
        await Preferences.set({ key, value: value || '' })
      }
      localStorage.setItem(key, value || '')
    } catch (e) {
      console.error('Storage set error:', e)
      localStorage.setItem(key, value || '')
    }
  },

  async remove(key) {
    await initPromise
    try {
      if (isNative && Preferences) {
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
