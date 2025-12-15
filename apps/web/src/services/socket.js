import { io } from 'socket.io-client'

// Socket.io ulanish
const getSocketURL = () => {
  const apiUrl = import.meta.env.VITE_API_URL
  const hostname = window.location.hostname
  
  console.log('🔗 Socket URL aniqlash:', { apiUrl, hostname })
  
  // Agar VITE_API_URL berilgan bo'lsa - /api ni olib tashlash
  if (apiUrl) {
    const socketUrl = apiUrl.replace('/api', '').replace(/\/$/, '')
    console.log('🔗 Socket URL (env):', socketUrl)
    return socketUrl
  }
  
  // Localhost da
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    console.log('🔗 Socket URL (localhost):', 'http://localhost:3000')
    return 'http://localhost:3000'
  }
  
  // Boshqa holatda (telefon) - xuddi shu IP, port 3000
  const url = `http://${hostname}:3000`
  console.log('🔗 Socket URL (auto):', url)
  return url
}

let socket = null

export const connectSocket = () => {
  if (socket?.connected) {
    console.log('🔌 Socket allaqachon ulangan:', socket.id)
    return socket
  }

  const url = getSocketURL()
  console.log('🔌 Socket ulanmoqda:', url)
  
  socket = io(url, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 20000
  })

  socket.on('connect', () => {
    console.log('✅ Socket ulandi:', socket.id)
  })

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket uzildi:', reason)
  })

  socket.on('connect_error', (error) => {
    console.error('❌ Socket xatosi:', error.message)
  })

  return socket
}

export const getSocket = () => socket

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

// Shofyor xonasiga qo'shilish
export const joinDriverRoom = (driverId) => {
  if (socket?.connected && driverId) {
    socket.emit('join-driver', driverId)
    console.log(`🚛 Driver xonasiga qo'shildi: ${driverId}`)
  }
}

// Biznesmen xonasiga qo'shilish
export const joinBusinessRoom = (businessId) => {
  if (socket?.connected && businessId) {
    socket.emit('join-business', businessId.toString())
    console.log(`📍 Business xonasiga qo'shildi: ${businessId}`)
  } else {
    console.log(`⚠️ Business xonasiga qo'shilmadi: socket=${socket?.connected}, businessId=${businessId}`)
  }
}

export default { connectSocket, getSocket, disconnectSocket, joinDriverRoom, joinBusinessRoom }
