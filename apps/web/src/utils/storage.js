// Capacitor native platformada ishlayaptimi?
let isNative = false
let Preferences = null
let initDone = false

// IndexedDB - PWA uchun ishonchli storage
const DB_NAME = 'avtojon-auth'
const STORE_NAME = 'auth'
let db = null

const openDB = () => {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db)
    
    try {
      const request = indexedDB.open(DB_NAME, 1)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        db = request.result
        resolve(db)
      }
      request.onupgradeneeded = (e) => {
        const database = e.target.result
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME)
        }
      }
    } catch (e) {
      reject(e)
    }
  })
}

const idbGet = async (key) => {
  try {
    const database = await openDB()
    return new Promise((resolve) => {
      const tx = database.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.get(key)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

const idbSet = async (key, value) => {
  try {
    const database = await openDB()
    return new Promise((resolve) => {
      const tx = database.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      store.put(value, key)
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => resolve(false)
    })
  } catch {
    return false
  }
}

const idbRemove = async (key) => {
  try {
    const database = await openDB()
    return new Promise((resolve) => {
      const tx = database.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      store.delete(key)
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => resolve(false)
    })
  } catch {
    return false
  }
}

// Dynamic import - faqat native platformada yuklanadi
const initCapacitor = async () => {
  if (initDone) return
  
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
  
  initDone = true
}

// Init qilish
const initPromise = initCapacitor()

// Storage utility - Capacitor va Web uchun universal
export const storage = {
  async get(key) {
    await initPromise
    try {
      // 🔥 Native APK - FAQAT Capacitor Preferences
      if (isNative && Preferences) {
        const { value } = await Preferences.get({ key })
        return value
      }
      
      // Web: localStorage + IndexedDB fallback
      let value = localStorage.getItem(key)
      if (!value) {
        // localStorage da yo'q - IndexedDB dan tekshirish
        value = await idbGet(key)
        if (value) {
          // IndexedDB da bor - localStorage ga sync qilish
          localStorage.setItem(key, value)
        }
      }
      return value
    } catch (e) {
      return localStorage.getItem(key)
    }
  },

  async set(key, value) {
    await initPromise
    try {
      // 🔥 Native APK - FAQAT Capacitor Preferences
      if (isNative && Preferences) {
        await Preferences.set({ key, value: value || '' })
        return
      }
      
      // Web: localStorage + IndexedDB backup
      localStorage.setItem(key, value || '')
      await idbSet(key, value || '')
    } catch (e) {
      localStorage.setItem(key, value || '')
    }
  },

  async remove(key) {
    await initPromise
    try {
      // 🔥 Native APK - FAQAT Capacitor Preferences
      if (isNative && Preferences) {
        await Preferences.remove({ key })
        return
      }
      
      localStorage.removeItem(key)
      await idbRemove(key)
    } catch (e) {
      localStorage.removeItem(key)
    }
  },

  // Sync versiyalar - initial state uchun (WEB ONLY!)
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
      // Parse error
    }
  }
  
  return { token, refreshToken, user }
}

// Auth ma'lumotlarini saqlash
export async function saveAuthData(token, user, refreshToken = null) {
  const promises = [
    storage.set('token', token),
    storage.set('user', JSON.stringify(user))
  ]
  
  if (refreshToken) {
    promises.push(storage.set('refreshToken', refreshToken))
  }
  
  await Promise.all(promises)
}

// Auth ma'lumotlarini o'chirish
export async function clearAuthData() {
  await Promise.all([
    storage.remove('token'),
    storage.remove('refreshToken'),
    storage.remove('user')
  ])
}
