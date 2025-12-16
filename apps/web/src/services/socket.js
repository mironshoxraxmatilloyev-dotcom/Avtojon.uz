import { io } from 'socket.io-client'

// Production mode tekshirish
const isDev = import.meta.env.DEV

// Socket.io ulanish
const getSocketURL = () => {
  const apiUrl = import.meta.env.VITE_API_URL
  const hostname = window.location.hostname
  
  // Agar VITE_API_URL berilgan bo'lsa - /api ni olib tashlash
  if (apiUrl) {
    const socketUrl = apiUrl.replace('/api', '').replace(/\/$/, '')
    return socketUrl
  }
  
  // Localhost da
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000'
  }
  
  // Boshqa holatda (telefon) - xuddi shu IP, port 3000
  return `http://${hostname}:3000`
}

let socket = null

export const connectSocket = () => {
  if (socket?.connected) {
    return socket
  }

  const url = getSocketURL()
  
  socket = io(url, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 20000
  })

  if (isDev) {
    socket.on('connect', () => {
      console.log('✅ Socket ulandi:', socket.id)
    })

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket uzildi:', reason)
    })

    socket.on('connect_error', (error) => {
      console.error('❌ Socket xatosi:', error.message)
    })
  }

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
  }
}

// Biznesmen xonasiga qo'shilish
export const joinBusinessRoom = (businessId) => {
  if (socket?.connected && businessId) {
    socket.emit('join-business', businessId.toString())
  }
}

export default { connectSocket, getSocket, disconnectSocket, joinDriverRoom, joinBusinessRoom }
