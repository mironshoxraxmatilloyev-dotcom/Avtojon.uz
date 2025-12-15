import { createContext, useContext, useEffect, useState, useRef, useCallback, memo } from 'react'
import { io } from 'socket.io-client'
import { useAuthStore } from '../store/authStore'

const SocketContext = createContext(null)

// 🚀 Socket URL - bir marta hisoblash
const getSocketURL = () => {
  const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_SOCKET_URL
  const hostname = window.location.hostname
  
  if (apiUrl) return apiUrl
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000'
  }
  return `http://${hostname}:3000`
}

const SOCKET_URL = getSocketURL()

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const user = useAuthStore((state) => state.user)
  const socketRef = useRef(null)

  // 🚀 Socket yaratish - faqat bir marta
  useEffect(() => {
    if (socketRef.current) return

    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'], // WebSocket birinchi
      upgrade: true,
      reconnection: true,
      reconnectionAttempts: 10, // Cheklangan urinishlar
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 15000
    })

    socketInstance.on('connect', () => {
      setIsConnected(true)
    })

    socketInstance.on('disconnect', () => {
      setIsConnected(false)
    })

    // 🚀 Error handling - silent
    socketInstance.on('connect_error', () => {
      // Silent - console spam yo'q
    })

    socketRef.current = socketInstance
    setSocket(socketInstance)

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [])

  // 🚀 User xonasiga qo'shilish - optimizatsiya qilingan
  useEffect(() => {
    const sock = socketRef.current
    if (!sock) return
    
    const userId = user?._id || user?.id
    if (!userId) return

    const roomId = userId.toString()
    const role = user.role
    
    const joinRoom = () => {
      if (!sock.connected) return
      
      if (role === 'business' || role === 'admin') {
        sock.emit('join-business', roomId)
      } else if (role === 'driver') {
        sock.emit('join-driver', roomId)
      }
    }

    if (sock.connected) joinRoom()
    sock.on('connect', joinRoom)

    return () => sock.off('connect', joinRoom)
  }, [user])

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}
