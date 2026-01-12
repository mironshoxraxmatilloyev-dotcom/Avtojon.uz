import { io } from 'socket.io-client'

// Socket URL ni aniqlash
const getSocketURL = () => {
  // 1. Env dan olish
  const socketUrl = import.meta.env.VITE_SOCKET_URL
  if (socketUrl && socketUrl.startsWith('http')) {
    return socketUrl
  }

  // 2. API URL dan yasash
  const apiUrl = import.meta.env.VITE_API_URL
  if (apiUrl && apiUrl.startsWith('http')) {
    return apiUrl.replace('/api', '')
  }

  // 3. Production URL - hardcoded fallback
  const hostname = window.location.hostname

  // Localhost - development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000'
  }

  // Capacitor app yoki production web
  if (hostname.includes('avtojon')) {
    return 'https://avtojon.uz'
  }

  // Boshqa holatda - production default
  return 'https://avtojon.uz'
}

let socket = null
let pendingRooms = { driver: null, business: null }

export const connectSocket = () => {
  // Agar socket mavjud va ulangan bo'lsa, qaytarish
  if (socket?.connected) {
    return socket
  }

  // Agar socket mavjud lekin ulanmagan bo'lsa, qayta ulanish
  if (socket) {
    socket.connect()
    return socket
  }

  const url = getSocketURL()

  socket = io(url, {
    transports: ['polling', 'websocket'],
    upgrade: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: true,
    forceNew: false
  })

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket.id)
    // Xonalarga qayta qo'shilish
    if (pendingRooms.driver) {
      console.log('🔌 Rejoining driver room:', `driver-${pendingRooms.driver}`)
      socket.emit('join-driver', pendingRooms.driver)
    }
    if (pendingRooms.business) {
      console.log('🔌 Rejoining business room:', `business-${pendingRooms.business}`)
      socket.emit('join-business', pendingRooms.business)
    }
  })

  return socket
}

export const getSocket = () => {
  if (!socket) {
    return connectSocket()
  }
  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
  pendingRooms = { driver: null, business: null }
}

// Shofyor xonasiga qo'shilish
export const joinDriverRoom = (driverId) => {
  if (!driverId) return

  pendingRooms.driver = driverId

  const s = getSocket()
  if (s?.connected) {
    s.emit('join-driver', driverId)
  }
}

// Biznesmen xonasiga qo'shilish
export const joinBusinessRoom = (businessId) => {
  if (!businessId) return

  const id = businessId.toString()
  pendingRooms.business = id

  const s = getSocket()
  if (s?.connected) {
    console.log('═══════════════════════════════════════════')
    console.log('🔌 JOIN BUSINESS ROOM')
    console.log('═══════════════════════════════════════════')
    console.log('🔌 Business ID:', id)
    console.log('🔌 Room name:', `business-${id}`)
    console.log('🔌 Socket ID:', s.id)
    console.log('🔌 Socket connected:', s.connected)
    console.log('═══════════════════════════════════════════')
    s.emit('join-business', id)
  } else {
    console.log('⏳ Socket not connected, will join room on connect:', `business-${id}`)
  }
}

// Socket holatini tekshirish
export const isSocketConnected = () => socket?.connected || false

export default {
  connectSocket,
  getSocket,
  disconnectSocket,
  joinDriverRoom,
  joinBusinessRoom,
  isSocketConnected
}
