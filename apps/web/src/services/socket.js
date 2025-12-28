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
  // avtojon.uz domenida bo'lsa
  if (hostname.includes('avtojon')) {
    return 'https://avtojon.uz'
  }
  
  // Boshqa holatda - production default
  return 'https://avtojon.uz'
}

let socket = null
let pendingRooms = { driver: null, business: null }
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 10

export const connectSocket = () => {
  if (socket?.connected) {
    return socket
  }

  const url = getSocketURL()
  console.log('🔌 Socket ulanmoqda:', url)

  socket = io(url, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: true,
    forceNew: false
  })

  socket.on('connect', () => {
    console.log('✅ Socket ulandi:', socket.id)
    reconnectAttempts = 0
    
    // Xonalarga qayta qo'shilish
    if (pendingRooms.driver) {
      socket.emit('join-driver', pendingRooms.driver)
      console.log('🚛 Driver xonasiga qo\'shildi:', pendingRooms.driver)
    }
    if (pendingRooms.business) {
      socket.emit('join-business', pendingRooms.business)
      console.log('💼 Business xonasiga qo\'shildi:', pendingRooms.business)
    }
  })

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket uzildi:', reason)
  })

  socket.on('connect_error', (error) => {
    reconnectAttempts++
    console.log(`⚠️ Socket xatosi (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}):`, error.message)
  })

  socket.on('reconnect', (attemptNumber) => {
    console.log('🔄 Socket qayta ulandi, urinish:', attemptNumber)
  })

  return socket
}

export const getSocket = () => socket

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
  
  if (socket?.connected) {
    socket.emit('join-driver', driverId)
    console.log('🚛 Driver xonasiga qo\'shildi:', driverId)
  } else {
    // Socket yo'q bo'lsa, ulanish
    connectSocket()
  }
}

// Biznesmen xonasiga qo'shilish
export const joinBusinessRoom = (businessId) => {
  if (!businessId) return
  
  const id = businessId.toString()
  pendingRooms.business = id
  
  if (socket?.connected) {
    socket.emit('join-business', id)
    console.log('💼 Business xonasiga qo\'shildi:', id)
  } else {
    // Socket yo'q bo'lsa, ulanish
    connectSocket()
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
