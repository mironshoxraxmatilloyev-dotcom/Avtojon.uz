import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuthStore } from '../store/authStore'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const user = useAuthStore((state) => state.user)
  const socketRef = useRef(null)

  // Socket yaratish - faqat bir marta
  useEffect(() => {
    if (socketRef.current) return

    const getSocketURL = () => {
      const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_SOCKET_URL
      const hostname = window.location.hostname
      
      if (apiUrl) return apiUrl
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:3000'
      }
      return `http://${hostname}:3000`
    }

    const socketUrl = getSocketURL()
    console.log('🔌 Socket ulanmoqda:', socketUrl)
    
    const socketInstance = io(socketUrl, {
      transports: ['polling', 'websocket'],
      upgrade: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    })

    socketInstance.on('connect', () => {
      console.log('✅ Socket ulandi:', socketInstance.id)
      setIsConnected(true)
    })

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Socket uzildi:', reason)
      setIsConnected(false)
    })

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Socket xatosi:', error.message)
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

  // User yoki socket o'zgarganda xonaga qo'shilish
  useEffect(() => {
    const sock = socketRef.current
    if (!sock) {
      console.log('⏳ Socket yo\'q')
      return
    }
    
    // user.id yoki user._id ni tekshirish
    const userId = user?._id || user?.id
    if (!userId) {
      console.log('⏳ User ID yo\'q:', user)
      return
    }

    const roomId = userId.toString()
    const role = user.role
    
    const joinRoom = () => {
      if (!sock.connected) {
        console.log('⏳ Socket ulanmagan')
        return
      }
      
      // admin ham business hisoblanadi
      if (role === 'business' || role === 'admin') {
        sock.emit('join-business', roomId)
        console.log(`📍 Business xonasiga JOIN yuborildi: ${roomId}`)
      } else if (role === 'driver') {
        sock.emit('join-driver', roomId)
        console.log(`🚛 Driver xonasiga JOIN yuborildi: ${roomId}`)
      }
    }

    // Darhol qo'shilish
    if (sock.connected) {
      joinRoom()
    }
    
    // Har safar ulanganda qayta qo'shilish
    sock.on('connect', joinRoom)

    return () => {
      sock.off('connect', joinRoom)
    }
  }, [user, socket])

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}
