import { io } from 'socket.io-client'

// Production mode tekshirish
const isDev = import.meta.env.DEV

// Socket.io ulanish
const getSocketURL = () => {
  const socketUrl = import.meta.env.VITE_SOCKET_URL
  const hostname = window.location.hostname
  
  // Agar VITE_SOCKET_URL berilgan bo'lsa
  if (socketUrl && socketUrl.startsWith('http')) {
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
let pendingRooms = { driver: null, business: null } // Qayta ulanishda xonalarga qo'shilish uchun

export const connectSocket = () => {
  if (socket?.connected) {
    return socket
  }

  const url = getSocketURL()
  
  socket = io(url, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 10000,
    autoConnect: true
  })

  // Qayta ulanganda xonalarga avtomatik qo'shilish
  socket.on('connect', () => {
    // Oldingi xonalarga qayta qo'shilish
    if (pendingRooms.driver) {
      socket.emit('join-driver', pendingRooms.driver)
    }
    if (pendingRooms.business) {
      socket.emit('join-business', pendingRooms.business)
    }
  })

  // Xatoliklarni yashirish - console ga chiqarmaslik
  socket.on('disconnect', () => {})
  socket.on('connect_error', () => {})
  socket.on('reconnect_error', () => {})
  socket.on('reconnect_failed', () => {})

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
  if (driverId) {
    pendingRooms.driver = driverId // Qayta ulanish uchun saqlash
    if (socket?.connected) {
      socket.emit('join-driver', driverId)
    }
  }
}

// Biznesmen xonasiga qo'shilish
export const joinBusinessRoom = (businessId) => {
  if (businessId) {
    pendingRooms.business = businessId.toString() // Qayta ulanish uchun saqlash
    if (socket?.connected) {
      socket.emit('join-business', businessId.toString())
    }
  }
}

export default { connectSocket, getSocket, disconnectSocket, joinDriverRoom, joinBusinessRoom }
